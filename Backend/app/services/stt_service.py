"""
STT Service - Speech-to-Text using OpenAI Whisper or Deepgram Cloud
====================================================================
This service handles audio transcription using either the local Whisper model
or Deepgram's cloud-hosted Whisper API for converting student voice queries
to text in multiple Indian languages.

DigiMasterJi - Multilingual AI Tutor for Rural Education

Environment Variables:
- STT_PROVIDER: 'local' or 'deepgram' (default: 'local')
- STT_MODEL_SIZE: Whisper model size (default: 'medium')
- STT_LANGUAGE_MODE: 'auto' or 'profile' (default: 'profile')
- DEEPGRAM_API_KEY: API key for Deepgram (required if STT_PROVIDER=deepgram)
- DEEPGRAM_MODEL: Deepgram model (default: 'whisper-medium')

Supported Model Sizes:
- Local: tiny, base, small, medium, large
- Deepgram: whisper-tiny, whisper-base, whisper-small, whisper-medium, whisper-large
"""

from typing import Optional, Dict, Any, Union, TYPE_CHECKING
import os
import tempfile
import logging
import httpx
import base64
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

# Set environment variables before any heavy imports
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")

# Lazy imports for heavy ML libraries
if TYPE_CHECKING:
    import torch
    import numpy as np
    import whisper

# Supported Indian languages for transcription
SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "en": "English",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
    "ne": "Nepali",
    "sa": "Sanskrit"
}

# Environment variable configuration
STT_PROVIDER = os.getenv("STT_PROVIDER", "local").lower()  # 'local' or 'deepgram'
STT_MODEL_SIZE = os.getenv("STT_MODEL_SIZE", "medium")  # tiny, base, small, medium, large
STT_LANGUAGE_MODE = os.getenv("STT_LANGUAGE_MODE", "profile").lower()  # 'auto' or 'profile'
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
DEEPGRAM_MODEL = os.getenv("DEEPGRAM_MODEL", "whisper-medium")  # whisper, whisper-tiny, etc.
DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen"

# Module-level cache for lazy imports
_torch = None
_np = None
_whisper = None


def _get_torch():
    """Lazy import for torch."""
    global _torch
    if _torch is None:
        import torch
        _torch = torch
    return _torch


def _get_numpy():
    """Lazy import for numpy."""
    global _np
    if _np is None:
        import numpy as np
        _np = np
    return _np


def _get_whisper():
    """Lazy import for whisper."""
    global _whisper
    if _whisper is None:
        import whisper
        _whisper = whisper
    return _whisper


class DeepgramSTTService:
    """
    Speech-to-Text service using Deepgram's cloud-hosted Whisper API.
    """
    
    def __init__(
        self,
        api_key: str = DEEPGRAM_API_KEY,
        model: str = DEEPGRAM_MODEL
    ):
        """
        Initialize the Deepgram STT service.
        
        Args:
            api_key: Deepgram API key
            model: Whisper model to use (whisper, whisper-tiny, whisper-base, whisper-small, whisper-medium, whisper-large)
        """
        self.api_key = api_key
        self.model = model
        self.sample_rate = 16000
        
        if not self.api_key:
            logger.warning("[Deepgram STT] No API key provided. Deepgram transcription will fail.")
    
    async def transcribe_file_async(
        self,
        file_path: str,
        language: Optional[str] = None,
        detect_language: bool = False
    ) -> Dict[str, Any]:
        """
        Transcribe an audio file using Deepgram's Whisper API (async version).
        
        Args:
            file_path: Path to the audio file
            language: Language code (e.g., 'hi' for Hindi). None for auto-detect.
            detect_language: Whether to enable Deepgram's language detection
            
        Returns:
            Dictionary containing:
                - success: Whether transcription was successful
                - text: The transcribed text
                - language: Detected/specified language
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "Deepgram API key not configured. Set DEEPGRAM_API_KEY environment variable."
            }
        
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}
        
        try:
            # Read audio file
            with open(file_path, "rb") as f:
                audio_data = f.read()
            
            # Determine content type based on file extension
            ext = os.path.splitext(file_path)[1].lower()
            content_type_map = {
                ".wav": "audio/wav",
                ".mp3": "audio/mpeg",
                ".webm": "audio/webm",
                ".ogg": "audio/ogg",
                ".flac": "audio/flac",
                ".m4a": "audio/mp4",
                ".mp4": "audio/mp4"
            }
            content_type = content_type_map.get(ext, "audio/wav")
            
            # Build query parameters
            params = {"model": self.model}
            
            # Language handling
            if language:
                params["language"] = language
            elif detect_language:
                params["detect_language"] = "true"
            
            # Make request to Deepgram API
            headers = {
                "Authorization": f"Token {self.api_key}",
                "Content-Type": content_type
            }
            
            logger.info(f"[Deepgram STT] Sending request to Deepgram API (model={self.model}, language={language or 'auto-detect'})")
            
            async with httpx.AsyncClient(timeout=180.0) as client:
                response = await client.post(
                    DEEPGRAM_API_URL,
                    headers=headers,
                    params=params,
                    content=audio_data
                )
            
            if response.status_code != 200:
                error_msg = f"Deepgram API error: {response.status_code} - {response.text}"
                logger.error(f"[Deepgram STT] {error_msg}")
                return {"success": False, "error": error_msg}
            
            result = response.json()
            
            # Parse Deepgram response
            transcript = ""
            detected_language = language
            confidence = 0.0
            
            if "results" in result and "channels" in result["results"]:
                channels = result["results"]["channels"]
                if channels and len(channels) > 0:
                    alternatives = channels[0].get("alternatives", [])
                    if alternatives and len(alternatives) > 0:
                        transcript = alternatives[0].get("transcript", "")
                        confidence = alternatives[0].get("confidence", 0.0)
            
            # Get detected language from metadata if available
            if "metadata" in result:
                detected_language = result["metadata"].get("language", language)
            
            logger.info(f"[Deepgram STT] Transcription successful: '{transcript[:50]}...' (confidence: {confidence:.2f})")
            
            return {
                "success": True,
                "text": transcript.strip(),
                "language": detected_language,
                "confidence": confidence,
                "provider": "deepgram"
            }
            
        except httpx.TimeoutException:
            error_msg = "Deepgram API request timed out"
            logger.error(f"[Deepgram STT] {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Deepgram transcription error: {str(e)}"
            logger.error(f"[Deepgram STT] {error_msg}")
            return {"success": False, "error": error_msg}
    
    def transcribe_file(
        self,
        file_path: str,
        language: Optional[str] = None,
        detect_language: bool = False
    ) -> Dict[str, Any]:
        """
        Synchronous wrapper for transcribe_file_async.
        """
        import asyncio
        
        # Get or create event loop
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an async context, we need to use a different approach
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(
                        asyncio.run,
                        self.transcribe_file_async(file_path, language, detect_language)
                    )
                    return future.result()
            else:
                return loop.run_until_complete(
                    self.transcribe_file_async(file_path, language, detect_language)
                )
        except RuntimeError:
            # No event loop, create one
            return asyncio.run(
                self.transcribe_file_async(file_path, language, detect_language)
            )
    
    def get_info(self) -> Dict[str, Any]:
        """Get information about the Deepgram STT service."""
        return {
            "provider": "deepgram",
            "model": self.model,
            "api_configured": bool(self.api_key),
            "supported_languages": list(SUPPORTED_LANGUAGES.keys()),
            "sample_rate": self.sample_rate
        }


class LocalSTTService:
    """
    Speech-to-Text service using OpenAI's local Whisper model.
    Optimized for transcribing Indian language audio.
    """
    
    def __init__(
        self,
        model_size: str = STT_MODEL_SIZE,
        device: Optional[str] = None
    ):
        """
        Initialize the local STT service.
        
        Args:
            model_size: Whisper model size ('tiny', 'base', 'small', 'medium', 'large')
            device: Device to run inference on ('cuda', 'cpu', 'mps', or None for auto)
        """
        self.model_size = model_size
        self._device = device
        
        self.model = None
        self._is_loaded = False
        
        # Audio processing parameters (Whisper expects 16kHz)
        self.sample_rate = 16000
    
    @property
    def device(self) -> str:
        """Get device, lazily detecting CUDA/MPS availability."""
        if self._device is None:
            torch = _get_torch()
            if torch.cuda.is_available():
                self._device = "cuda"
            elif torch.backends.mps.is_available():
                self._device = "cpu"  # MPS has some issues with whisper, use CPU
            else:
                self._device = "cpu"
        return self._device

    def load_model(self) -> Dict[str, Any]:
        """
        Load the Whisper model into memory.
        
        Returns:
            Dictionary with loading status and model info
        """
        if self._is_loaded:
            return {
                "success": True,
                "message": "Model already loaded",
                "device": self.device,
                "model": f"whisper-{self.model_size}"
            }
        
        try:
            whisper = _get_whisper()
            
            logger.info(f"[Local STT] Loading Whisper model: {self.model_size}")
            logger.info(f"[Local STT] Device: {self.device}")
            
            # Load the model
            self.model = whisper.load_model(self.model_size, device=self.device)
            
            self._is_loaded = True
            
            return {
                "success": True,
                "message": "Model loaded successfully",
                "device": str(self.model.device),
                "model": f"whisper-{self.model_size}"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "hint": "Make sure you have enough memory and openai-whisper is installed"
            }

    def unload_model(self) -> Dict[str, str]:
        """Unload the model from memory to free resources."""
        if self.model is not None:
            del self.model
            self.model = None
        
        torch = _get_torch()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        self._is_loaded = False
        return {"success": True, "message": "Model unloaded"}

    def transcribe(
        self,
        audio: Union[Any, str, bytes],  # np.ndarray or str or bytes
        language: Optional[str] = None,
        task: str = "transcribe",
        return_timestamps: bool = False
    ) -> Dict[str, Any]:
        """
        Transcribe audio to text.
        
        Args:
            audio: Audio input - can be:
                   - numpy array of audio samples (16kHz expected)
                   - path to audio file
                   - raw bytes of audio data
            language: Language code (e.g., 'hi' for Hindi). None for auto-detect.
            task: 'transcribe' for same-language or 'translate' for English translation
            return_timestamps: Whether to return word/segment timestamps
            
        Returns:
            Dictionary containing:
                - text: The transcribed text
                - language: Detected/specified language
                - segments: Timestamped segments (if requested)
        """
        if not self._is_loaded:
            load_result = self.load_model()
            if not load_result.get("success"):
                return load_result
        
        try:
            # Handle different input types
            audio_input = self._prepare_audio(audio)
            
            # Set up transcription options
            options = {
                "task": task,
                "fp16": False  # Use FP32 for better compatibility
            }
            
            if language:
                options["language"] = language
            
            # Transcribe
            result = self.model.transcribe(audio_input, **options)
            
            response = {
                "success": True,
                "text": result["text"].strip(),
                "language": result.get("language", language),
                "task": task,
                "provider": "local"
            }
            
            if return_timestamps and "segments" in result:
                response["segments"] = [
                    {
                        "start": seg["start"],
                        "end": seg["end"],
                        "text": seg["text"]
                    }
                    for seg in result["segments"]
                ]
            
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def _prepare_audio(self, audio: Union[Any, str, bytes]) -> Union[str, Any]:
        """
        Prepare audio input for processing.
        
        Args:
            audio: Audio in various formats
            
        Returns:
            Either a file path string or numpy array
        """
        np = _get_numpy()
        
        if isinstance(audio, str):
            # It's a file path - whisper can handle this directly
            return audio
        
        elif isinstance(audio, np.ndarray):
            # Numpy array - save to temp file for whisper
            import soundfile as sf
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                temp_path = f.name
            
            # Ensure correct format
            audio_data = audio.astype(np.float32)
            if audio_data.max() > 1.0 or audio_data.min() < -1.0:
                audio_data = audio_data / max(abs(audio_data.max()), abs(audio_data.min()))
            
            sf.write(temp_path, audio_data, self.sample_rate)
            return temp_path
        
        elif isinstance(audio, bytes):
            # Raw bytes - save to temp file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                f.write(audio)
                return f.name
        
        else:
            raise ValueError(f"Unsupported audio type: {type(audio)}")

    def transcribe_file(
        self,
        file_path: str,
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        Convenience method to transcribe an audio file.
        
        Args:
            file_path: Path to the audio file
            language: Language code (None for auto-detect)
            task: 'transcribe' or 'translate'
            
        Returns:
            Transcription result dictionary
        """
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}
        
        return self.transcribe(file_path, language=language, task=task)

    @property
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        return self._is_loaded

    def get_info(self) -> Dict[str, Any]:
        """Get information about the local STT service."""
        torch = _get_torch()
        whisper = _get_whisper()
        
        info = {
            "provider": "local",
            "model": f"whisper-{self.model_size}",
            "available_models": whisper.available_models(),
            "device": self._device or "auto",
            "is_loaded": self._is_loaded,
            "sample_rate": self.sample_rate,
            "supported_languages": list(SUPPORTED_LANGUAGES.keys()),
            "gpu_available": torch.cuda.is_available(),
            "mps_available": torch.backends.mps.is_available()
        }
        
        # Add GPU name if available
        if torch.cuda.is_available():
            info["gpu_name"] = torch.cuda.get_device_name(0)
        
        return info


class STTService:
    """
    Unified Speech-to-Text service that can use either local Whisper or Deepgram cloud.
    Configurable via environment variables.
    """
    
    def __init__(
        self,
        provider: str = STT_PROVIDER,
        model_size: str = STT_MODEL_SIZE,
        deepgram_model: str = DEEPGRAM_MODEL,
        language_mode: str = STT_LANGUAGE_MODE
    ):
        """
        Initialize the unified STT service.
        
        Args:
            provider: 'local' or 'deepgram'
            model_size: Model size for local Whisper
            deepgram_model: Model name for Deepgram
            language_mode: 'auto' or 'profile'
        """
        self.provider = provider
        self.language_mode = language_mode
        self.model_size = model_size
        self.deepgram_model = deepgram_model
        
        # Initialize appropriate backend
        if provider == "deepgram":
            self._backend = DeepgramSTTService(model=deepgram_model)
            logger.info(f"[STT] Initialized with Deepgram provider (model={deepgram_model})")
        else:
            self._backend = LocalSTTService(model_size=model_size)
            logger.info(f"[STT] Initialized with local Whisper provider (model_size={model_size})")
        
        logger.info(f"[STT] Language mode: {language_mode}")
    
    def should_use_profile_language(self) -> bool:
        """Check if profile's preferred language should be used."""
        return self.language_mode == "profile"
    
    def load_model(self) -> Dict[str, Any]:
        """Load model (only applicable for local provider)."""
        if self.provider == "local":
            return self._backend.load_model()
        return {"success": True, "message": "Deepgram is cloud-based, no model to load"}
    
    def unload_model(self) -> Dict[str, str]:
        """Unload model (only applicable for local provider)."""
        if self.provider == "local":
            return self._backend.unload_model()
        return {"success": True, "message": "Deepgram is cloud-based, no model to unload"}
    
    def transcribe(
        self,
        audio: Union[Any, str, bytes],
        language: Optional[str] = None,
        task: str = "transcribe",
        return_timestamps: bool = False
    ) -> Dict[str, Any]:
        """
        Transcribe audio to text using the configured provider.
        
        Args:
            audio: Audio input (numpy array, file path, or bytes)
            language: Language code (e.g., 'hi' for Hindi). None for auto-detect.
            task: 'transcribe' for same-language or 'translate' for English translation
            return_timestamps: Whether to return word/segment timestamps
            
        Returns:
            Dictionary containing transcription results
        """
        if self.provider == "local":
            return self._backend.transcribe(
                audio=audio,
                language=language,
                task=task,
                return_timestamps=return_timestamps
            )
        else:
            # Deepgram: need to handle file path
            if isinstance(audio, str):
                detect_language = language is None
                return self._backend.transcribe_file(
                    file_path=audio,
                    language=language,
                    detect_language=detect_language
                )
            else:
                # Need to save to temp file first
                np = _get_numpy()
                temp_path = None
                try:
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                        temp_path = f.name
                        if isinstance(audio, bytes):
                            f.write(audio)
                        elif isinstance(audio, np.ndarray):
                            import soundfile as sf
                            sf.write(temp_path, audio, 16000)
                    
                    detect_language = language is None
                    return self._backend.transcribe_file(
                        file_path=temp_path,
                        language=language,
                        detect_language=detect_language
                    )
                finally:
                    if temp_path and os.path.exists(temp_path):
                        os.unlink(temp_path)
    
    async def transcribe_async(
        self,
        audio: Union[Any, str, bytes],
        language: Optional[str] = None,
        task: str = "transcribe",
        return_timestamps: bool = False
    ) -> Dict[str, Any]:
        """
        Async transcription method - more efficient for Deepgram.
        
        Args:
            audio: Audio input (numpy array, file path, or bytes)
            language: Language code (e.g., 'hi' for Hindi). None for auto-detect.
            task: 'transcribe' for same-language or 'translate' for English translation
            return_timestamps: Whether to return word/segment timestamps
            
        Returns:
            Dictionary containing transcription results
        """
        if self.provider == "deepgram":
            if isinstance(audio, str):
                detect_language = language is None
                return await self._backend.transcribe_file_async(
                    file_path=audio,
                    language=language,
                    detect_language=detect_language
                )
            else:
                # Need to save to temp file first
                np = _get_numpy()
                temp_path = None
                try:
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                        temp_path = f.name
                        if isinstance(audio, bytes):
                            f.write(audio)
                        elif isinstance(audio, np.ndarray):
                            import soundfile as sf
                            sf.write(temp_path, audio, 16000)
                    
                    detect_language = language is None
                    return await self._backend.transcribe_file_async(
                        file_path=temp_path,
                        language=language,
                        detect_language=detect_language
                    )
                finally:
                    if temp_path and os.path.exists(temp_path):
                        os.unlink(temp_path)
        else:
            # Local provider - run in thread to not block
            import asyncio
            return await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self._backend.transcribe(
                    audio=audio,
                    language=language,
                    task=task,
                    return_timestamps=return_timestamps
                )
            )
    
    def transcribe_file(
        self,
        file_path: str,
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        Convenience method to transcribe an audio file.
        
        Args:
            file_path: Path to the audio file
            language: Language code (None for auto-detect based on language_mode)
            task: 'transcribe' or 'translate'
            
        Returns:
            Transcription result dictionary
        """
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}
        
        if self.provider == "local":
            return self._backend.transcribe_file(
                file_path=file_path,
                language=language,
                task=task
            )
        else:
            detect_language = language is None
            return self._backend.transcribe_file(
                file_path=file_path,
                language=language,
                detect_language=detect_language
            )
    
    async def transcribe_file_async(
        self,
        file_path: str,
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        Async convenience method to transcribe an audio file.
        
        Args:
            file_path: Path to the audio file
            language: Language code (None for auto-detect based on language_mode)
            task: 'transcribe' or 'translate'
            
        Returns:
            Transcription result dictionary
        """
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}
        
        if self.provider == "deepgram":
            detect_language = language is None
            return await self._backend.transcribe_file_async(
                file_path=file_path,
                language=language,
                detect_language=detect_language
            )
        else:
            # Run local transcription in thread
            import asyncio
            return await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self._backend.transcribe_file(
                    file_path=file_path,
                    language=language,
                    task=task
                )
            )
    
    @property
    def is_loaded(self) -> bool:
        """Check if the model is loaded (local provider only)."""
        if self.provider == "local":
            return self._backend.is_loaded
        return True  # Deepgram is always "loaded"
    
    def get_info(self) -> Dict[str, Any]:
        """Get information about the STT service."""
        info = self._backend.get_info()
        info["language_mode"] = self.language_mode
        info["provider_config"] = {
            "STT_PROVIDER": STT_PROVIDER,
            "STT_MODEL_SIZE": STT_MODEL_SIZE,
            "STT_LANGUAGE_MODE": STT_LANGUAGE_MODE,
            "DEEPGRAM_MODEL": DEEPGRAM_MODEL,
            "DEEPGRAM_API_KEY_SET": bool(DEEPGRAM_API_KEY)
        }
        return info


# Singleton instance
stt_service = STTService(
    provider=STT_PROVIDER,
    model_size=STT_MODEL_SIZE,
    deepgram_model=DEEPGRAM_MODEL,
    language_mode=STT_LANGUAGE_MODE
)


# Test function
def test_stt_service():
    """Test the STT service loading and basic functionality."""
    print("=" * 60)
    print(f"Testing STT Service (Provider: {STT_PROVIDER})")
    print("=" * 60)
    
    service = STTService()
    
    # Test 1: Get info
    print("\n1. Service Information:")
    info = service.get_info()
    for key, value in info.items():
        print(f"   {key}: {value}")
    
    if STT_PROVIDER == "local":
        np = _get_numpy()
        
        # Test 2: Load model
        print("\n2. Loading Whisper model...")
        print("   (This may take a few minutes on first run)")
        result = service.load_model()
        print(f"   Status: {'✓ Loaded' if result.get('success') else '✗ Failed'}")
        if not result.get("success"):
            print(f"   Error: {result.get('error')}")
            print(f"   Hint: {result.get('hint', 'N/A')}")
            return
        
        # Test 3: Create dummy audio and transcribe
        print("\n3. Testing transcription with dummy audio...")
        dummy_audio = np.zeros(16000, dtype=np.float32)
        result = service.transcribe(dummy_audio)
        print(f"   Status: {'✓ Success' if result.get('success') else '✗ Failed'}")
        print(f"   Transcription: '{result.get('text', 'N/A')}'")
        print("   (Empty or minimal output expected for silent audio)")
        
        # Test 4: Unload model
        print("\n4. Unloading model...")
        service.unload_model()
        print("   ✓ Model unloaded")
    else:
        print("\n2. Deepgram provider - no local model to load")
        print("   API Key configured:", bool(DEEPGRAM_API_KEY))
    
    print("\n" + "=" * 60)
    print("STT Service test completed!")
    print("=" * 60)
    print("\nUsage example:")
    print('  result = stt_service.transcribe_file("audio.wav", language="hi")')
    print('  print(result["text"])')
    print("\nEnvironment variables:")
    print(f"  STT_PROVIDER={STT_PROVIDER}")
    print(f"  STT_MODEL_SIZE={STT_MODEL_SIZE}")
    print(f"  STT_LANGUAGE_MODE={STT_LANGUAGE_MODE}")
    print(f"  DEEPGRAM_MODEL={DEEPGRAM_MODEL}")


if __name__ == "__main__":
    test_stt_service()
