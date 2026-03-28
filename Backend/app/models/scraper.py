"""
Web Scraper Models
==================
Pydantic models for the agentic web scraper feature.

DigiMasterJi - Multilingual AI Tutor for Rural Education
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from app.models.knowledge_base import SubjectEnum, LanguageEnum


class ScraperStartRequest(BaseModel):
    """Request body to start a scraping job."""
    base_url: str = Field(..., description="Starting URL to scrape")
    purpose: str = Field(
        ...,
        description="Purpose / goal of the scraping (used as context for the LLM agent)",
        min_length=10
    )
    max_pages: int = Field(default=50, ge=1, le=500, description="Maximum pages to scrape")
    max_depth: int = Field(default=3, ge=1, le=10, description="Maximum link depth")
    delay: float = Field(default=1.5, ge=0.5, le=10.0, description="Delay between requests (seconds)")
    subject: SubjectEnum = Field(default=SubjectEnum.GENERAL_SCIENCE, description="Subject for RAG tagging")
    language: LanguageEnum = Field(default=LanguageEnum.ENGLISH, description="Language for RAG tagging")
    headless: bool = Field(default=True, description="Run browser in headless mode")
    auto_add_to_rag: bool = Field(default=True, description="Automatically add scraped content to RAG")


class AgentDecision(BaseModel):
    """A single LLM agent decision logged during scraping."""
    url: str
    decision_type: str  # "visit", "content", "links"
    verdict: bool
    reason: str
    timestamp: Optional[str] = None


class ScraperJobResponse(BaseModel):
    """Response for scraper job status."""
    job_id: str
    status: str  # "running", "completed", "error", "stopped"
    base_url: str
    purpose: str
    pages_scraped: int = 0
    pages_skipped: int = 0
    chunks_added: int = 0
    current_url: Optional[str] = None
    errors: List[str] = []
    agent_log: List[AgentDecision] = []
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class ScraperJobListItem(BaseModel):
    """Summary item for scraper job history."""
    job_id: str
    base_url: str
    purpose: str
    status: str
    pages_scraped: int = 0
    chunks_added: int = 0
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
