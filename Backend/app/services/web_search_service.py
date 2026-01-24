"""
Web Search Service - Dynamic Web Search Integration
====================================================
Provides web search capabilities for when the LLM needs external information.
Uses DuckDuckGo Instant Answer API (free, no API key required).

DigiMasterJi - Multilingual AI Tutor for Rural Education
"""

import httpx
import logging
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus
import re

logger = logging.getLogger(__name__)

# DuckDuckGo API endpoint
DUCKDUCKGO_API_URL = "https://api.duckduckgo.com/"

# Keywords that indicate web search might be helpful
WEB_SEARCH_TRIGGER_KEYWORDS = [
    # Current events
    "latest", "recent", "current", "today", "news", "2024", "2025",
    # Specific information
    "who is", "what is the", "how many", "when did", "where is",
    # Facts and data
    "statistics", "data", "facts about", "information about",
    # Hindi triggers
    "नवीनतम", "हालिया", "आज", "कौन है", "क्या है", "कितने", "कब", "कहाँ",
    # Tamil triggers
    "சமீபத்திய", "தற்போதைய", "யார்", "என்ன", "எப்போது", "எங்கே",
    # Educational research
    "research", "study", "discovery", "invented", "founded",
]


class WebSearchService:
    """Service for performing web searches to augment LLM responses."""
    
    def __init__(self, timeout: float = 10.0):
        """
        Initialize the web search service.
        
        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    async def search(
        self,
        query: str,
        max_results: int = 5,
        safe_search: bool = True
    ) -> Dict[str, Any]:
        """
        Perform a web search using DuckDuckGo Instant Answer API.
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
            safe_search: Enable safe search for educational content
            
        Returns:
            Dictionary with search results and metadata
        """
        try:
            logger.info(f"[WEB SEARCH] Searching for: '{query[:50]}...'")
            
            # Clean and encode query
            clean_query = self._clean_query(query)
            
            # DuckDuckGo Instant Answer API parameters
            params = {
                "q": clean_query,
                "format": "json",
                "no_html": "1",
                "skip_disambig": "1",
                "kp": "1" if safe_search else "-1",  # Safe search
            }
            
            response = await self.client.get(DUCKDUCKGO_API_URL, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Parse DuckDuckGo response
            results = self._parse_ddg_response(data, max_results)
            
            logger.info(f"[WEB SEARCH] Found {len(results['results'])} results")
            
            return results
            
        except httpx.TimeoutException:
            logger.warning("[WEB SEARCH] Request timed out")
            return self._error_response("Search timed out. Please try again.")
            
        except httpx.HTTPError as e:
            logger.error(f"[WEB SEARCH] HTTP error: {e}")
            return self._error_response(f"Search failed: {str(e)}")
            
        except Exception as e:
            logger.error(f"[WEB SEARCH] Error: {e}")
            return self._error_response(f"Search error: {str(e)}")
    
    async def search_educational(
        self,
        query: str,
        subject: Optional[str] = None,
        grade_level: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform an educational-focused web search.
        Adds educational context to improve search relevance.
        
        Args:
            query: User's question
            subject: Subject area (Math, Science, etc.)
            grade_level: Student's grade level
            
        Returns:
            Dictionary with search results
        """
        # Enhance query for educational content
        enhanced_query = query
        
        if subject:
            enhanced_query = f"{subject} {enhanced_query}"
        
        if grade_level:
            # Add grade context for appropriate content
            enhanced_query = f"{enhanced_query} for students"
        
        # Add educational context
        enhanced_query = f"{enhanced_query} educational explanation"
        
        return await self.search(enhanced_query, max_results=3, safe_search=True)
    
    def should_search(self, query: str, llm_response: Optional[str] = None) -> bool:
        """
        Determine if a web search would be helpful for the given query.
        
        Args:
            query: User's question
            llm_response: Optional LLM response to check for uncertainty
            
        Returns:
            True if web search is recommended
        """
        query_lower = query.lower()
        
        # Check for trigger keywords
        for keyword in WEB_SEARCH_TRIGGER_KEYWORDS:
            if keyword.lower() in query_lower:
                logger.info(f"[WEB SEARCH] Triggered by keyword: '{keyword}'")
                return True
        
        # Check if LLM expressed uncertainty
        if llm_response:
            uncertainty_phrases = [
                "i'm not sure", "i don't know", "i cannot", "i am not certain",
                "मुझे नहीं पता", "मुझे यकीन नहीं",
                "may not be accurate", "please verify", "outdated information"
            ]
            response_lower = llm_response.lower()
            for phrase in uncertainty_phrases:
                if phrase in response_lower:
                    logger.info(f"[WEB SEARCH] Triggered by LLM uncertainty: '{phrase}'")
                    return True
        
        return False
    
    def _clean_query(self, query: str) -> str:
        """Clean and normalize search query."""
        # Remove excessive whitespace
        query = " ".join(query.split())
        
        # Remove special characters that might break search
        query = re.sub(r'[^\w\s\-\?।॥]', '', query)
        
        # Limit query length
        if len(query) > 200:
            query = query[:200]
        
        return query.strip()
    
    def _parse_ddg_response(self, data: Dict[str, Any], max_results: int) -> Dict[str, Any]:
        """Parse DuckDuckGo API response into structured results."""
        results = []
        
        # Abstract (main answer)
        if data.get("Abstract"):
            results.append({
                "title": data.get("Heading", ""),
                "snippet": data.get("Abstract", ""),
                "source": data.get("AbstractSource", ""),
                "url": data.get("AbstractURL", ""),
                "type": "abstract"
            })
        
        # Related topics
        for topic in data.get("RelatedTopics", [])[:max_results]:
            if isinstance(topic, dict):
                if topic.get("Text"):
                    results.append({
                        "title": topic.get("Text", "")[:100],
                        "snippet": topic.get("Text", ""),
                        "url": topic.get("FirstURL", ""),
                        "type": "related"
                    })
                # Handle nested topics
                elif topic.get("Topics"):
                    for subtopic in topic.get("Topics", [])[:2]:
                        if subtopic.get("Text"):
                            results.append({
                                "title": subtopic.get("Text", "")[:100],
                                "snippet": subtopic.get("Text", ""),
                                "url": subtopic.get("FirstURL", ""),
                                "type": "related"
                            })
        
        # Infobox
        if data.get("Infobox"):
            infobox = data["Infobox"]
            if infobox.get("content"):
                info_text = []
                for item in infobox.get("content", [])[:5]:
                    if item.get("label") and item.get("value"):
                        info_text.append(f"{item['label']}: {item['value']}")
                
                if info_text:
                    results.append({
                        "title": "Quick Facts",
                        "snippet": "\n".join(info_text),
                        "type": "infobox"
                    })
        
        # Definition
        if data.get("Definition"):
            results.append({
                "title": "Definition",
                "snippet": data.get("Definition", ""),
                "source": data.get("DefinitionSource", ""),
                "url": data.get("DefinitionURL", ""),
                "type": "definition"
            })
        
        # Answer (for calculations, etc.)
        if data.get("Answer"):
            results.append({
                "title": "Answer",
                "snippet": data.get("Answer", ""),
                "type": "answer"
            })
        
        return {
            "success": True,
            "query": data.get("Heading", ""),
            "results": results[:max_results],
            "has_results": len(results) > 0,
            "image_url": data.get("Image", ""),
            "entity_type": data.get("Entity", "")
        }
    
    def _error_response(self, message: str) -> Dict[str, Any]:
        """Create an error response."""
        return {
            "success": False,
            "error": message,
            "results": [],
            "has_results": False
        }
    
    def format_results_for_llm(self, search_results: Dict[str, Any]) -> str:
        """
        Format search results as context for LLM prompt.
        
        Args:
            search_results: Results from search() method
            
        Returns:
            Formatted string for inclusion in LLM prompt
        """
        if not search_results.get("success") or not search_results.get("has_results"):
            return ""
        
        context_parts = []
        context_parts.append("=== Web Search Results ===")
        
        for i, result in enumerate(search_results.get("results", []), 1):
            title = result.get("title", "")
            snippet = result.get("snippet", "")
            source = result.get("source", "")
            
            if snippet:
                context_parts.append(f"\n[Result {i}: {title}]")
                context_parts.append(snippet[:500])  # Limit snippet length
                if source:
                    context_parts.append(f"(Source: {source})")
        
        context_parts.append("\n=== End of Web Search Results ===")
        
        return "\n".join(context_parts)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global instance
web_search_service = WebSearchService()
