"""
Agentic Web Scraper Service
============================
Playwright-based web scraper that uses a lightweight LLM (Ollama gemma3:4b-cloud)
to make goal-aware decisions about which URLs to visit, what content to scrape,
and which links to follow.

DigiMasterJi - Multilingual AI Tutor for Rural Education
"""

import asyncio
import logging
import hashlib
import re
import json
import os
from typing import Optional, List, Dict, Any, Set
from datetime import datetime
from urllib.parse import urljoin, urlparse, urlunparse
from dataclasses import dataclass, field
from collections import deque

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# LLM config for the scraper agent
SCRAPER_LLM_MODEL = os.getenv("OLLAMA_SCRAPER_MODEL", "gemma3:4b-cloud")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ScrapedPage:
    """Represents a successfully scraped page."""
    url: str
    title: str
    content: str
    links: List[str] = field(default_factory=list)
    scraped_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    word_count: int = 0

    def __post_init__(self):
        self.word_count = len(self.content.split())


# ---------------------------------------------------------------------------
# LLM Agent helpers
# ---------------------------------------------------------------------------

async def _ask_llm(prompt: str, system: str, timeout: float = 30.0) -> str:
    """Call Ollama generate API and return the response text."""
    payload = {
        "model": SCRAPER_LLM_MODEL,
        "prompt": prompt,
        "system": system,
        "options": {"temperature": 0.1, "num_predict": 256},
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "")
    except Exception as e:
        logger.error(f"[SCRAPER LLM] Error calling LLM: {e}")
        return ""


def _parse_json_verdict(raw: str) -> Dict[str, Any]:
    """Best-effort parse a JSON object from LLM output."""
    # Try to find JSON in the response
    try:
        # Look for {...} pattern
        match = re.search(r'\{[^{}]*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except json.JSONDecodeError:
        pass
    # Fallback heuristic
    lower = raw.lower()
    return {"visit": "yes" in lower or "true" in lower, "reason": raw.strip()[:200]}


async def should_visit_url(url: str, purpose: str) -> Dict[str, Any]:
    """Ask the LLM whether a URL is worth visiting given the scraping purpose."""
    system = (
        "You are a web crawling assistant. Given a URL and the purpose of the scraping task, "
        "decide whether this URL is likely to contain relevant content. "
        "Respond ONLY with a JSON object: {\"visit\": true/false, \"reason\": \"brief reason\"}\n"
        "Rules:\n"
        "- Skip login/signup/auth/cart/checkout/account pages\n"
        "- Skip image/video/binary file URLs\n"
        "- Skip social media share links, mailto:, tel:, javascript: URLs\n"
        "- Focus on pages that match the stated purpose"
    )
    prompt = f"Purpose: {purpose}\nURL: {url}\n\nShould I visit this URL?"
    raw = await _ask_llm(prompt, system)
    result = _parse_json_verdict(raw)
    return {"visit": bool(result.get("visit", False)), "reason": result.get("reason", "")}


async def is_content_relevant(title: str, snippet: str, purpose: str) -> Dict[str, Any]:
    """Ask the LLM whether scraped page content is relevant to the purpose."""
    system = (
        "You are a content relevance judge. Given a page title, a content snippet, and the purpose "
        "of the scraping task, decide whether this content is relevant and should be kept. "
        "Respond ONLY with a JSON object: {\"relevant\": true/false, \"reason\": \"brief reason\"}"
    )
    prompt = (
        f"Purpose: {purpose}\n"
        f"Page Title: {title}\n"
        f"Content Snippet (first 500 chars): {snippet[:500]}\n\n"
        f"Is this content relevant to the purpose?"
    )
    raw = await _ask_llm(prompt, system)
    result = _parse_json_verdict(raw)
    return {"relevant": bool(result.get("relevant", result.get("visit", False))), "reason": result.get("reason", "")}


async def filter_links(links: List[str], purpose: str) -> List[str]:
    """Ask the LLM which discovered links are worth following."""
    if not links:
        return []
    # Batch links (max 20 at a time to keep prompt short)
    links_batch = links[:20]
    system = (
        "You are a web crawling assistant. Given a list of URLs and the purpose of the crawl, "
        "select ONLY the URLs that are likely relevant. "
        "Respond ONLY with a JSON object: {\"keep\": [list of URLs to keep]}"
    )
    links_text = "\n".join(f"- {url}" for url in links_batch)
    prompt = f"Purpose: {purpose}\n\nLinks discovered:\n{links_text}\n\nWhich links should I follow?"
    raw = await _ask_llm(prompt, system, timeout=45.0)

    # Parse response
    try:
        match = re.search(r'\{[^{}]*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            kept = data.get("keep", [])
            if isinstance(kept, list):
                # Only keep URLs that were actually in the input
                valid = set(links_batch)
                return [u for u in kept if u in valid]
    except (json.JSONDecodeError, Exception):
        pass

    # Fallback: keep links that appear in the LLM's response text
    return [u for u in links_batch if u in raw]


# ---------------------------------------------------------------------------
# HTML extraction helpers (from reference code)
# ---------------------------------------------------------------------------

def _normalize_url(url: str) -> str:
    """Normalize URL by removing fragments and trailing slashes."""
    parsed = urlparse(url)
    normalized = urlunparse((
        parsed.scheme,
        parsed.netloc.lower(),
        parsed.path.rstrip('/') or '/',
        parsed.params,
        parsed.query,
        '',
    ))
    return normalized


def _is_same_domain(url: str, allowed_domains: List[str]) -> bool:
    """Check if URL belongs to one of the allowed domains."""
    try:
        parsed = urlparse(url)
        return parsed.netloc.lower() in [d.lower() for d in allowed_domains]
    except Exception:
        return False


def _is_obviously_bad_url(url: str) -> bool:
    """Quick static check for obviously unwanted URLs (binary files, mailto, etc.)."""
    lower = url.lower()
    bad_extensions = (
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.tar', '.gz', '.mp3', '.mp4', '.avi', '.mov',
    )
    if any(lower.endswith(ext) for ext in bad_extensions):
        return True
    if lower.startswith(('mailto:', 'tel:', 'javascript:', 'data:')):
        return True
    if '#' in url and url.index('#') == len(url.split('#')[0]):
        # Pure anchor link
        pass
    return False


# ---------------------------------------------------------------------------
# Core Scraper
# ---------------------------------------------------------------------------

class WebScraperService:
    """
    Playwright-based agentic web scraper.
    Runs as a background task; progress is stored in a dict keyed by job_id.
    """

    # In-memory job store: job_id -> job state dict
    _jobs: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        return cls._jobs.get(job_id)

    @classmethod
    def get_all_jobs(cls) -> List[Dict[str, Any]]:
        return list(cls._jobs.values())

    @classmethod
    def stop_job(cls, job_id: str) -> bool:
        job = cls._jobs.get(job_id)
        if job and job["status"] == "running":
            job["_stop"] = True
            return True
        return False

    @classmethod
    async def start_job(
        cls,
        job_id: str,
        base_url: str,
        purpose: str,
        max_pages: int = 50,
        max_depth: int = 3,
        delay: float = 1.5,
        subject: str = "General Science",
        language: str = "en",
        headless: bool = True,
        auto_add_to_rag: bool = True,
    ):
        """Run the scraping job (intended to be wrapped in asyncio.create_task)."""
        parsed = urlparse(base_url)
        allowed_domains = [parsed.netloc]

        job: Dict[str, Any] = {
            "job_id": job_id,
            "status": "running",
            "base_url": base_url,
            "purpose": purpose,
            "pages_scraped": 0,
            "pages_skipped": 0,
            "chunks_added": 0,
            "current_url": None,
            "errors": [],
            "agent_log": [],
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "_stop": False,
        }
        cls._jobs[job_id] = job

        visited: Set[str] = set()
        scraped_pages: List[ScrapedPage] = []

        try:
            from playwright.async_api import async_playwright

            logger.info(f"[SCRAPER {job_id}] Starting browser…")
            pw = await async_playwright().start()
            browser = await pw.chromium.launch(headless=headless)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080},
            )
            context.set_default_timeout(30000)
            page = await context.new_page()

            # BFS
            queue: deque = deque([(base_url, 0)])
            visited.add(_normalize_url(base_url))

            while queue and len(scraped_pages) < max_pages and not job["_stop"]:
                url, depth = queue.popleft()
                if depth > max_depth:
                    continue

                job["current_url"] = url

                # ---- AGENT DECISION 1: Should I visit? ----
                verdict = await should_visit_url(url, purpose)
                log_entry = {
                    "url": url,
                    "decision_type": "visit",
                    "verdict": verdict["visit"],
                    "reason": verdict["reason"],
                    "timestamp": datetime.utcnow().isoformat(),
                }
                job["agent_log"].append(log_entry)

                if not verdict["visit"]:
                    job["pages_skipped"] += 1
                    logger.info(f"[SCRAPER {job_id}] SKIP {url} — {verdict['reason']}")
                    continue

                # ---- SCRAPE THE PAGE ----
                try:
                    logger.info(f"[SCRAPER {job_id}] Navigating to {url}")
                    response = await page.goto(url, wait_until="domcontentloaded")
                    if not response or response.status >= 400:
                        job["pages_skipped"] += 1
                        continue

                    content_type = response.headers.get("content-type", "")
                    if not any(ct in content_type.lower() for ct in ["text/html", "application/xhtml"]):
                        job["pages_skipped"] += 1
                        continue

                    # Wait a bit for content
                    try:
                        await page.wait_for_load_state("networkidle", timeout=8000)
                    except Exception:
                        pass

                    title = await page.title()
                    html = await page.content()
                except Exception as e:
                    logger.error(f"[SCRAPER {job_id}] Navigation error {url}: {e}")
                    job["errors"].append(f"Navigation error {url}: {str(e)[:100]}")
                    job["pages_skipped"] += 1
                    continue

                # ---- Extract content with BeautifulSoup ----
                try:
                    from bs4 import BeautifulSoup

                    soup = BeautifulSoup(html, "html.parser")
                    for tag in soup.find_all(["script", "style", "nav", "footer", "header", "aside", "iframe", "noscript", "svg", "form"]):
                        tag.decompose()
                    for el in soup.find_all(style=re.compile(r'display\s*:\s*none', re.I)):
                        el.decompose()
                    for el in soup.find_all(attrs={"hidden": True}):
                        el.decompose()

                    main_el = soup.find("main") or soup.find("article") or soup.find(id="content") or soup.find(class_="content")
                    if main_el:
                        text = main_el.get_text(separator="\n", strip=True)
                    else:
                        body = soup.find("body")
                        text = body.get_text(separator="\n", strip=True) if body else soup.get_text(separator="\n", strip=True)

                    lines = [l.strip() for l in text.split("\n") if l.strip()]
                    text = "\n".join(lines)
                    text = re.sub(r'\n{3,}', '\n\n', text)
                    text = re.sub(r' {2,}', ' ', text)

                    # Extract links
                    raw_links: List[str] = []
                    current_url = page.url
                    for a in soup.find_all("a", href=True):
                        abs_url = urljoin(current_url, a["href"])
                        raw_links.append(abs_url)
                except Exception as e:
                    logger.error(f"[SCRAPER {job_id}] Extraction error {url}: {e}")
                    job["errors"].append(f"Extraction error: {str(e)[:100]}")
                    job["pages_skipped"] += 1
                    continue

                if len(text) < 100:
                    job["pages_skipped"] += 1
                    continue

                # ---- AGENT DECISION 2: Is content relevant? ----
                relevance = await is_content_relevant(title or url, text, purpose)
                log_entry2 = {
                    "url": url,
                    "decision_type": "content",
                    "verdict": relevance["relevant"],
                    "reason": relevance["reason"],
                    "timestamp": datetime.utcnow().isoformat(),
                }
                job["agent_log"].append(log_entry2)

                if not relevance["relevant"]:
                    job["pages_skipped"] += 1
                    logger.info(f"[SCRAPER {job_id}] Content not relevant: {url}")
                    # Still process links even if content not kept
                else:
                    scraped_page = ScrapedPage(
                        url=url, title=title or url, content=text, links=raw_links
                    )
                    scraped_pages.append(scraped_page)
                    job["pages_scraped"] = len(scraped_pages)
                    logger.info(f"[SCRAPER {job_id}] ✓ Scraped {url} ({scraped_page.word_count} words)")

                # ---- AGENT DECISION 3: Which links to follow? ----
                # Pre-filter: same domain, not visited, not obviously bad
                candidate_links = []
                for link in raw_links:
                    norm = _normalize_url(link)
                    if norm not in visited and _is_same_domain(link, allowed_domains) and not _is_obviously_bad_url(link):
                        candidate_links.append(norm)

                # Deduplicate
                candidate_links = list(dict.fromkeys(candidate_links))

                if candidate_links:
                    kept_links = await filter_links(candidate_links, purpose)
                    log_entry3 = {
                        "url": url,
                        "decision_type": "links",
                        "verdict": True,
                        "reason": f"Kept {len(kept_links)}/{len(candidate_links)} links",
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                    job["agent_log"].append(log_entry3)

                    for link in kept_links:
                        if link not in visited:
                            visited.add(link)
                            queue.append((link, depth + 1))

                # Delay
                await asyncio.sleep(delay)

            # Cleanup browser
            await page.close()
            await context.close()
            await browser.close()
            await pw.stop()

            # ---- Add to RAG ----
            if auto_add_to_rag and scraped_pages:
                logger.info(f"[SCRAPER {job_id}] Adding {len(scraped_pages)} pages to RAG…")
                total_chunks = await _add_pages_to_rag(scraped_pages, subject, language)
                job["chunks_added"] = total_chunks

            job["status"] = "stopped" if job["_stop"] else "completed"

        except Exception as e:
            logger.error(f"[SCRAPER {job_id}] Fatal error: {e}")
            import traceback
            traceback.print_exc()
            job["errors"].append(str(e))
            job["status"] = "error"
        finally:
            job["current_url"] = None
            job["completed_at"] = datetime.utcnow().isoformat()
            # Persist to MongoDB
            await _persist_job(job)
            logger.info(f"[SCRAPER {job_id}] Job finished: {job['status']}, {job['pages_scraped']} pages scraped, {job['chunks_added']} chunks added")


# ---------------------------------------------------------------------------
# RAG integration
# ---------------------------------------------------------------------------

async def _add_pages_to_rag(
    pages: List[ScrapedPage],
    subject: str,
    language: str,
) -> int:
    """Add scraped pages to the RAG knowledge base. Returns total chunks added."""
    from app.services.rag_service import rag_service
    from app.database import knowledge_base as kb_db

    total_chunks = 0

    for page in pages:
        try:
            doc_text = f"# {page.title}\n\nSource URL: {page.url}\n\n---\n\n{page.content}"

            # Chunk the text
            chunks = rag_service.chunk_text(doc_text)
            if not chunks:
                continue

            # Generate embeddings
            chunk_texts = [c["text"] for c in chunks]
            embeddings = rag_service.generate_embeddings(chunk_texts)

            # Prepare documents
            documents = []
            for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
                documents.append({
                    "title": rag_service.generate_chunk_title(chunk["text"]),
                    "content_chunk": chunk["text"],
                    "subject": subject,
                    "language": language,
                    "vector_embedding": emb,
                    "tags": ["web_scrape"],
                    "source_file": f"web:{page.url}",
                    "chunk_index": i,
                })

            inserted_ids = await kb_db.insert_many_knowledge_chunks(documents)
            total_chunks += len(inserted_ids)
            logger.info(f"[SCRAPER RAG] Added {len(inserted_ids)} chunks for {page.url}")

        except Exception as e:
            logger.error(f"[SCRAPER RAG] Error processing {page.url}: {e}")

    return total_chunks


# ---------------------------------------------------------------------------
# MongoDB persistence for job history
# ---------------------------------------------------------------------------

async def _persist_job(job: Dict[str, Any]):
    """Save/update a job record in the scrape_jobs collection."""
    try:
        from app.database.mongodb import db
        collection = db.client["digimasterji"]["scrape_jobs"]
        # Strip internal keys
        doc = {k: v for k, v in job.items() if not k.startswith("_")}
        await collection.update_one(
            {"job_id": job["job_id"]},
            {"$set": doc},
            upsert=True,
        )
    except Exception as e:
        logger.error(f"[SCRAPER] Failed to persist job: {e}")


async def load_jobs_from_db(limit: int = 20) -> List[Dict[str, Any]]:
    """Load recent scrape jobs from DB for history display."""
    try:
        from app.database.mongodb import db
        collection = db.client["digimasterji"]["scrape_jobs"]
        cursor = collection.find(
            {},
            {"_id": 0, "job_id": 1, "base_url": 1, "purpose": 1, "status": 1,
             "pages_scraped": 1, "chunks_added": 1, "started_at": 1, "completed_at": 1}
        ).sort("started_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    except Exception as e:
        logger.error(f"[SCRAPER] Failed to load jobs: {e}")
        return []
