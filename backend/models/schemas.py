from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid


class LineStatus(str, Enum):
    PENDING = "pending"
    FOUND = "found"
    PARTIAL = "partial"
    MISSING = "missing"


class WhisperMode(str, Enum):
    API = "api"
    LOCAL = "local"


class ProjectCreate(BaseModel):
    name: str
    show_code: str
    episode_number: str


class ProjectResponse(BaseModel):
    id: str
    name: str
    show_code: str
    episode_number: str
    created_at: datetime
    script_uploaded: bool = False
    status: str = "draft"


class ArtistCreate(BaseModel):
    name: str
    color: str


class ArtistResponse(BaseModel):
    id: str
    name: str
    color: str
    total_lines: int = 0
    found_lines: int = 0
    partial_lines: int = 0
    missing_lines: int = 0


class ScriptLineResponse(BaseModel):
    id: str
    line_number: int
    text: str
    artist_color: str
    artist_name: Optional[str] = None
    status: LineStatus = LineStatus.PENDING
    confidence: float = 0.0
    matched_text: Optional[str] = None


class AudioUploadResponse(BaseModel):
    id: str
    filename: str
    artist_id: str
    transcription: Optional[str] = None
    status: str = "uploaded"


class TranscriptionRequest(BaseModel):
    audio_id: str
    mode: WhisperMode = WhisperMode.API


class QCReportResponse(BaseModel):
    project_id: str
    project_name: str
    episode: str
    total_lines: int
    found_lines: int
    partial_lines: int
    missing_lines: int
    completion_percentage: float
    artists: list[ArtistResponse]
    lines: list[ScriptLineResponse]


class SettingsUpdate(BaseModel):
    openai_api_key: Optional[str] = None
    whisper_mode: WhisperMode = WhisperMode.API


class ColorMapping(BaseModel):
    color: str
    artist_name: str
