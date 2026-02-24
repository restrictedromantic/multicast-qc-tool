import os
from typing import Optional
from openai import OpenAI

_whisper_model = None


def transcribe_with_api(filepath: str, api_key: str) -> str:
    """Transcribe audio using OpenAI Whisper API."""
    client = OpenAI(api_key=api_key)
    
    with open(filepath, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
    
    return transcript


def transcribe_with_local(filepath: str, model_size: str = "base") -> str:
    """Transcribe audio using local Whisper model."""
    global _whisper_model
    
    try:
        import whisper
    except ImportError:
        raise ImportError(
            "Local Whisper not installed. Install with: pip install openai-whisper\n"
            "Or use API mode instead."
        )
    
    if _whisper_model is None:
        _whisper_model = whisper.load_model(model_size)
    
    result = _whisper_model.transcribe(filepath)
    return result["text"]


def transcribe_audio(
    filepath: str,
    mode: str = "api",
    api_key: Optional[str] = None,
    model_size: str = "base"
) -> str:
    """
    Transcribe audio file using specified mode.
    
    Args:
        filepath: Path to audio file
        mode: "api" for OpenAI API, "local" for local Whisper
        api_key: OpenAI API key (required for API mode)
        model_size: Whisper model size for local mode (tiny, base, small, medium, large)
    
    Returns:
        Transcribed text
    """
    if mode == "api":
        if not api_key:
            raise ValueError("OpenAI API key required for API mode")
        return transcribe_with_api(filepath, api_key)
    else:
        return transcribe_with_local(filepath, model_size)
