"""
Web Search Service - Dynamic Web Search Integration
====================================================
Provides web search capabilities for when the LLM needs external information.
Uses duckduckgo-search library for comprehensive web search results.

DigiMasterJi - Multilingual AI Tutor for Rural Education
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
import re

logger = logging.getLogger(__name__)

# Keywords that indicate web search might be helpful
WEB_SEARCH_TRIGGER_KEYWORDS = [
    # Current events
    "latest", "recent", "current", "today", "news", "2024", "2025", "2026",
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
    # Web search explicit
    "search", "web search", "google", "look up", "find online",
]


class WebSearchService:
    """Service for performing web searches to augment LLM responses."""
    
    def __init__(self, timeout: float = 15.0):
        """
        Initialize the web search service.
        
        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout
        self._ddgs = None
    
    def _get_ddgs(self):
        """Lazy load the DDGS instance."""
        if self._ddgs is None:
            try:
                from duckduckgo_search import DDGS
                self._ddgs = DDGS()
            except ImportError:
                logger.error("[WEB SEARCH] duckduckgo-search library not installed. Run: pip install duckduckgo-search")
                return None
        return self._ddgs
    
    async def search(
        self,
        query: str,
        max_results: int = 5,
        safe_search: bool = True
    ) -> Dict[str, Any]:
        """
        Perform a web search using DuckDuckGo text search.
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
            safe_search: Enable safe search for educational content
            
        Returns:
            Dictionary with search results and metadata
        """
        try:
            logger.info(f"[WEB SEARCH] Searching for: '{query[:80]}...'")
            
            # Clean the query
            clean_query = self._clean_query(query)
            if not clean_query:
                return self._error_response("Empty search query")
            
            # Run the search in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None,
                self._perform_search,
                clean_query,
                max_results,
                safe_search
            )
            
            return results
            
        except asyncio.TimeoutError:
            logger.warning("[WEB SEARCH] Request timed out")
            return self._error_response("Search timed out. Please try again.")
            
        except Exception as e:
            logger.error(f"[WEB SEARCH] Error: {e}")
            import traceback
            traceback.print_exc()
            return self._error_response(f"Search error: {str(e)}")
    
    def _perform_search(
        self,
        query: str,
        max_results: int,
        safe_search: bool
    ) -> Dict[str, Any]:
        """
        Perform the actual search (called in executor).
        
        Args:
            query: Cleaned search query
            max_results: Maximum results to return
            safe_search: Safe search mode
            
        Returns:
            Dictionary with search results
        """
        try:
            ddgs = self._get_ddgs()
            if ddgs is None:
                return self._error_response("DuckDuckGo search library not available")
            
            # Perform text search
            # safesearch: "strict", "moderate", "off"
            safesearch_level = "strict" if safe_search else "off"
            
            search_results = ddgs.text(
                keywords=query,
                max_results=max_results,
                safesearch=safesearch_level
            )
            
            # Convert to list (it may return a generator)
            results_list = list(search_results) if search_results else []
            
            # Parse and format results
            formatted_results = []
            for result in results_list:
                formatted_results.append({
                    "title": result.get("title", ""),
                    "snippet": result.get("body", ""),
                    "url": result.get("href", "") or result.get("link", ""),
                    "source": self._extract_domain(result.get("href", "") or result.get("link", "")),
                    "type": "web_result"
                })
            
            logger.info(f"[WEB SEARCH] Found {len(formatted_results)} results")
            
            return {
                "success": True,
                "query": query,
                "results": formatted_results,
                "has_results": len(formatted_results) > 0
            }
            
        except Exception as e:
            logger.error(f"[WEB SEARCH] Search execution error: {e}")
            return self._error_response(f"Search failed: {str(e)}")
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain name from URL."""
        if not url:
            return ""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc.replace("www.", "")
        except:
            return ""
    
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
            url = result.get("url", "")
            
            if snippet:
                context_parts.append(f"\n[Result {i}: {title}]")
                context_parts.append(snippet[:500])  # Limit snippet length
                if source:
                    context_parts.append(f"(Source: {source})")
        
        context_parts.append("\n=== End of Web Search Results ===")
        
        return "\n".join(context_parts)
    
    async def close(self):
        """Close any resources."""
        # DDGS doesn't need explicit cleanup, but we keep this for interface compatibility
        self._ddgs = None


# Global instance
web_search_service = WebSearchService()
