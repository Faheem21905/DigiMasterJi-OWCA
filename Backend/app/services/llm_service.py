"""
LLM Service - Ollama Integration for Gemma 3 12B Model
========================================================
This service handles communication with the local Ollama server
for generating AI tutor responses in multiple Indian languages.

DigiMasterJi - Multilingual AI Tutor for Rural Education
"""

import httpx
from typing import Optional, AsyncGenerator, Dict, Any, List
import json
import os
from dotenv import load_dotenv

load_dotenv()


class LLMService:
    """
    Service for interacting with Ollama's local LLM API.
    Uses Gemma 3 12B model for multilingual STEM tutoring.
    """
    
    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: float = 120.0
    ):
        """
        Initialize the LLM service.
        
        Args:
            base_url: Ollama server URL (defaults to env or localhost:11434)
            model_name: Model to use (defaults to gemma3:12b)
            timeout: Request timeout in seconds
        """
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = model_name or os.getenv("OLLAMA_MODEL", "gemma3:12b")
        self.timeout = timeout
        
        # System prompt for STEM tutoring in regional languages
        self.default_system_prompt = """You are DigiMasterJi, a friendly and patient AI tutor designed to teach STEM concepts to rural and under-resourced students in India. 

Key Guidelines:
1. LANGUAGE: Respond in the same language the student uses. Support Hindi, English, and other Indian regional languages.
2. SIMPLICITY: Explain concepts in simple terms with relatable real-world examples from rural Indian life.
3. ENCOURAGEMENT: Be encouraging and supportive. Celebrate small wins.
4. STEP-BY-STEP: Break down complex problems into small, manageable steps.
5. VERIFICATION: Ask follow-up questions to ensure understanding.
6. CULTURAL CONTEXT: Use examples relevant to Indian students (farming, local festivals, everyday life).

Remember: Many students may have limited prior exposure to these concepts. Be patient and thorough."""

    async def check_health(self) -> Dict[str, Any]:
        """
        Check if Ollama server is running and accessible.
        
        Returns:
            Dictionary with health status and available models
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Check if server is running
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "") for m in models]
                    return {
                        "status": "healthy",
                        "server": self.base_url,
                        "available_models": model_names,
                        "target_model": self.model_name,
                        "model_available": any(self.model_name in m for m in model_names)
                    }
                return {"status": "unhealthy", "error": f"Status code: {response.status_code}"}
        except httpx.ConnectError:
            return {
                "status": "unhealthy",
                "error": f"Cannot connect to Ollama at {self.base_url}. Is Ollama running?"
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        context: Optional[List[int]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a response from the LLM.
        
        Args:
            prompt: User's input message
            system_prompt: Custom system prompt (uses default if not provided)
            context: Previous conversation context (for maintaining chat history)
            temperature: Creativity of response (0.0 = deterministic, 1.0 = creative)
            max_tokens: Maximum response length
            stream: Whether to stream the response
            
        Returns:
            Dictionary containing the response and metadata
        """
        system = system_prompt or self.default_system_prompt
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "system": system,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
            "stream": stream
        }
        
        if context:
            payload["context"] = context
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "response": result.get("response", ""),
                    "context": result.get("context", []),  # For maintaining conversation
                    "model": result.get("model", self.model_name),
                    "total_duration": result.get("total_duration", 0),
                    "eval_count": result.get("eval_count", 0)
                }
                
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "Request timed out. The model may be loading or processing a complex query."
            }
        except httpx.HTTPStatusError as e:
            return {
                "success": False,
                "error": f"HTTP error: {e.response.status_code}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        context: Optional[List[int]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> AsyncGenerator[str, None]:
        """
        Stream a response from the LLM token by token.
        
        Yields:
            Individual response tokens as they are generated
        """
        system = system_prompt or self.default_system_prompt
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "system": system,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
            "stream": True
        }
        
        if context:
            payload["context"] = context
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/generate",
                    json=payload
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            data = json.loads(line)
                            if "response" in data:
                                yield data["response"]
                            if data.get("done", False):
                                break
        except Exception as e:
            yield f"[Error: {str(e)}]"

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """
        Chat completion with message history.
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
                     roles can be: 'system', 'user', 'assistant'
            temperature: Creativity of response
            max_tokens: Maximum response length
            
        Returns:
            Dictionary containing the assistant's response
        """
        # Ensure system message is present
        has_system = any(m.get("role") == "system" for m in messages)
        if not has_system:
            messages = [{"role": "system", "content": self.default_system_prompt}] + messages
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "message": result.get("message", {}),
                    "model": result.get("model", self.model_name),
                    "total_duration": result.get("total_duration", 0)
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance for easy importing
llm_service = LLMService()


# Test function
async def test_llm_service():
    """Test the LLM service connection and generation."""
    print("=" * 60)
    print("Testing LLM Service (Ollama + Gemma)")
    print("=" * 60)
    
    service = LLMService()
    
    # Test 1: Health check
    print("\n1. Checking Ollama server health...")
    health = await service.check_health()
    print(f"   Status: {health.get('status')}")
    if health.get('status') == 'healthy':
        print(f"   Available models: {health.get('available_models', [])}")
        print(f"   Target model ({service.model_name}) available: {health.get('model_available')}")
    else:
        print(f"   Error: {health.get('error')}")
        print("\n   ⚠️  To fix this:")
        print("   1. Install Ollama: https://ollama.ai/download")
        print("   2. Run: ollama serve")
        print(f"   3. Pull model: ollama pull {service.model_name}")
        return
    
    # Test 2: Simple generation
    print("\n2. Testing simple generation...")
    test_prompt = "What is photosynthesis? Explain in simple Hindi."
    print(f"   Prompt: {test_prompt}")
    
    result = await service.generate(test_prompt)
    if result.get("success"):
        print(f"   Response: {result.get('response', '')[:200]}...")
    else:
        print(f"   Error: {result.get('error')}")
    
    print("\n" + "=" * 60)
    print("LLM Service test completed!")
    print("=" * 60)


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_llm_service())
