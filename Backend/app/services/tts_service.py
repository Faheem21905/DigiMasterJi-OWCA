"""
TTS Service - Text-to-Speech using gTTS (Google Text-to-Speech)
================================================================
This service handles speech synthesis for converting AI tutor responses
to speech in multiple Indian languages.

DigiMasterJi - Multilingual AI Tutor for Rural Education

Uses gTTS (Google Text-to-Speech) which provides:
- Good quality speech synthesis
- Support for multiple Indian languages
- No model loading required (uses Google's API)
- Reliable and stable operation
"""

from typing import Optional, Dict, Any, Union, List
import os
import io
import base64
import tempfile
from pathlib import Path

# Supported Indian languages with gTTS
# Format: language_code -> (language_name, tld for accent)
SUPPORTED_LANGUAGES = {
    "hi": ("Hindi", "co.in"),
    "en": ("English", "co.in"),
    "bn": ("Bengali", "co.in"),
    "ta": ("Tamil", "co.in"),
    "te": ("Telugu", "co.in"),
    "mr": ("Marathi", "co.in"),
    "gu": ("Gujarati", "co.in"),
    "kn": ("Kannada", "co.in"),
    "ml": ("Malayalam", "co.in"),
    "pa": ("Punjabi", "co.in"),
    "ur": ("Urdu", "co.in"),
    "ne": ("Nepali", "co.in"),
}

# Language display names for UI
LANGUAGE_NAMES = {
    "hi": "Hindi",
    "en": "English (India)",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
    "ne": "Nepali",
}


class TTSService:
    """
    Text-to-Speech service using Google Text-to-Speech (gTTS).
    Supports multiple Indian languages for DigiMasterJi.
    """
    
    def __init__(self, default_language: str = "hi"):
        """
        Initialize the TTS service.
        
        Args:
            default_language: Default language code for synthesis
        """
        self.default_language = default_language
        self.sample_rate = 24000  # gTTS outputs MP3, decoded at ~24kHz
        self._gTTS = None
    
    def _get_gtts(self):
        """Lazy import for gTTS."""
        if self._gTTS is None:
            from gtts import gTTS
            self._gTTS = gTTS
        return self._gTTS
    
    def synthesize(
        self,
        text: str,
        language: Optional[str] = None,
        slow: bool = False
    ) -> Dict[str, Any]:
        """
        Synthesize speech from text.
        
        Args:
            text: The text to convert to speech
            language: Language code (e.g., 'hi' for Hindi)
            slow: Whether to speak slowly (useful for learning)
            
        Returns:
            Dictionary containing:
                - audio_bytes: Raw MP3 audio bytes
                - audio_base64: Base64 encoded audio (for web transfer)
                - sample_rate: Audio sample rate
                - format: Audio format (mp3)
                - language: Language used
        """
        if not text or not text.strip():
            return {
                "success": False,
                "error": "Empty text provided"
            }
        
        lang = language or self.default_language
        
        # Validate language
        if lang not in SUPPORTED_LANGUAGES:
            return {
                "success": False,
                "error": f"Unsupported language: {lang}",
                "supported_languages": list(SUPPORTED_LANGUAGES.keys())
            }
        
        try:
            gTTS = self._get_gtts()
            
            # Get the TLD for Indian accent
            _, tld = SUPPORTED_LANGUAGES[lang]
            
            # Create TTS object
            tts = gTTS(text=text, lang=lang, slow=slow, tld=tld)
            
            # Generate audio to bytes
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_bytes = audio_buffer.getvalue()
            
            # Encode to base64 for web transfer
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            return {
                "success": True,
                "audio_bytes": audio_bytes,
                "audio_base64": audio_base64,
                "sample_rate": self.sample_rate,
                "format": "mp3",
                "language": lang,
                "language_name": LANGUAGE_NAMES.get(lang, lang),
                "text_length": len(text),
                "audio_size": len(audio_bytes)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def synthesize_to_file(
        self,
        text: str,
        output_path: str,
        language: Optional[str] = None,
        slow: bool = False
    ) -> Dict[str, Any]:
        """
        Synthesize speech and save to a file.
        
        Args:
            text: The text to convert to speech
            output_path: Path to save the audio file
            language: Language code
            slow: Whether to speak slowly
            
        Returns:
            Dictionary with status and file info
        """
        result = self.synthesize(text, language, slow)
        
        if not result.get("success"):
            return result
        
        try:
            # Ensure output directory exists
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Write audio bytes to file
            with open(output_path, 'wb') as f:
                f.write(result["audio_bytes"])
            
            return {
                "success": True,
                "file_path": output_path,
                "format": "mp3",
                "language": result["language"],
                "audio_size": result["audio_size"]
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to save file: {str(e)}"
            }
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get list of supported languages."""
        return [
            {"code": code, "name": name}
            for code, name in LANGUAGE_NAMES.items()
        ]
    
    def get_info(self) -> Dict[str, Any]:
        """Get information about the TTS service."""
        return {
            "engine": "gTTS (Google Text-to-Speech)",
            "default_language": self.default_language,
            "supported_languages": list(SUPPORTED_LANGUAGES.keys()),
            "language_count": len(SUPPORTED_LANGUAGES),
            "output_format": "mp3",
            "features": [
                "Multiple Indian languages",
                "Indian accent support",
                "Slow speech mode for learning",
                "No model loading required",
                "Real-time synthesis"
            ]
        }


# Singleton instance
tts_service = TTSService()


# Test function
def test_tts_service():
    """Test the TTS service."""
    print("=" * 60)
    print("Testing TTS Service (gTTS)")
    print("=" * 60)
    
    service = TTSService()
    
    # Test 1: Get info
    print("\n1. Service Information:")
    info = service.get_info()
    for key, value in info.items():
        print(f"   {key}: {value}")
    
    # Test 2: List languages
    print("\n2. Supported Languages:")
    languages = service.get_supported_languages()
    for lang in languages:
        print(f"   {lang['code']}: {lang['name']}")
    
    # Test 3: English synthesis
    print("\n3. Testing English synthesis...")
    result = service.synthesize("Hello! Welcome to DigiMasterJi.", language="en")
    if result.get("success"):
        print(f"   ✓ Generated {result['audio_size']} bytes of audio")
    else:
        print(f"   ✗ Failed: {result.get('error')}")
        return
    
    # Test 4: Hindi synthesis
    print("\n4. Testing Hindi synthesis...")
    result = service.synthesize("नमस्ते! डिजीमास्टरजी में आपका स्वागत है।", language="hi")
    if result.get("success"):
        print(f"   ✓ Generated {result['audio_size']} bytes of audio")
    else:
        print(f"   ✗ Failed: {result.get('error')}")
        return
    
    # Test 5: Tamil synthesis
    print("\n5. Testing Tamil synthesis...")
    result = service.synthesize("வணக்கம்! டிஜிமாஸ்டர்ஜிக்கு வரவேற்கிறோம்.", language="ta")
    if result.get("success"):
        print(f"   ✓ Generated {result['audio_size']} bytes of audio")
    else:
        print(f"   ✗ Failed: {result.get('error')}")
        return
    
    # Test 6: Save to file
    print("\n6. Testing file output...")
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        temp_path = f.name
    
    result = service.synthesize_to_file(
        "This is a test of saving audio to file.",
        temp_path,
        language="en"
    )
    if result.get("success"):
        print(f"   ✓ Saved to: {temp_path}")
        print(f"   ✓ File size: {result['audio_size']} bytes")
        os.unlink(temp_path)  # Clean up
    else:
        print(f"   ✗ Failed: {result.get('error')}")
    
    print("\n" + "=" * 60)
    print("TTS Service test completed!")
    print("=" * 60)
    print("\nUsage example:")
    print('  result = tts_service.synthesize("नमस्ते", language="hi")')
    print('  audio_bytes = result["audio_bytes"]')


if __name__ == "__main__":
    test_tts_service()
