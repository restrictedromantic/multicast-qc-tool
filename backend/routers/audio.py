from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil

from models.database import get_db, Project, Artist, ScriptLine, AudioFile, Settings
from models.schemas import AudioUploadResponse
from services.transcriber import transcribe_audio
from services.matcher import find_line_in_transcription

router = APIRouter(prefix="/audio", tags=["audio"])

UPLOAD_DIR = "uploads/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{project_id}/upload", response_model=AudioUploadResponse)
async def upload_audio(
    project_id: str,
    artist_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload an audio file for a specific artist."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    artist = db.query(Artist).filter(Artist.id == artist_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    allowed_extensions = ['.wav', '.mp3', '.m4a', '.ogg', '.flac']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format. Allowed: {', '.join(allowed_extensions)}"
        )
    
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    audio_file = AudioFile(
        id=file_id,
        project_id=project_id,
        artist_id=artist_id,
        filename=file.filename,
        filepath=filepath,
        status="uploaded"
    )
    db.add(audio_file)
    db.commit()
    
    return AudioUploadResponse(
        id=file_id,
        filename=file.filename,
        artist_id=artist_id,
        status="uploaded"
    )


@router.post("/{project_id}/transcribe/{audio_id}")
async def transcribe_audio_file(
    project_id: str,
    audio_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Transcribe an uploaded audio file."""
    audio = db.query(AudioFile).filter(
        AudioFile.id == audio_id,
        AudioFile.project_id == project_id
    ).first()
    
    if not audio:
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(id=1, whisper_mode="local")
        db.add(settings)
        db.commit()
    
    mode = settings.whisper_mode
    api_key = settings.openai_api_key
    
    if mode == "api" and not api_key:
        raise HTTPException(
            status_code=400,
            detail="OpenAI API key not configured. Set it in settings or switch to local mode."
        )
    
    audio.status = "transcribing"
    db.commit()
    
    try:
        transcription = transcribe_audio(
            filepath=audio.filepath,
            mode=mode,
            api_key=api_key
        )
        
        audio.transcription = transcription
        audio.status = "transcribed"
        db.commit()
        
        lines = db.query(ScriptLine).filter(
            ScriptLine.artist_id == audio.artist_id
        ).all()
        
        for line in lines:
            status, confidence, matched = find_line_in_transcription(
                line.text, transcription
            )
            line.status = status
            line.confidence = confidence
            line.matched_text = matched
        
        db.commit()
        
        return {
            "message": "Transcription complete",
            "audio_id": audio_id,
            "transcription": transcription,
            "lines_matched": len(lines)
        }
        
    except ImportError:
        audio.status = "uploaded"  # keep so user can retry after switching to API
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Local Whisper is not installed on this server. Go to Settings and switch to OpenAI API mode, then add your API key."
        )
    except Exception as e:
        err_msg = str(e)
        if "Local Whisper not installed" in err_msg or "openai-whisper" in err_msg:
            audio.status = "uploaded"
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Local Whisper is not installed on this server. Go to Settings and switch to OpenAI API mode, then add your API key."
            )
        if "Numpy is not available" in err_msg or "numpy" in err_msg.lower():
            audio.status = "uploaded"
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Numpy is missing in the backend. In the backend folder run: source venv/bin/activate && pip install numpy && restart the server."
            )
        audio.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {err_msg}")


@router.get("/{project_id}/files", response_model=List[AudioUploadResponse])
def get_audio_files(project_id: str, db: Session = Depends(get_db)):
    """Get all audio files for a project."""
    files = db.query(AudioFile).filter(AudioFile.project_id == project_id).all()
    return [
        AudioUploadResponse(
            id=f.id,
            filename=f.filename,
            artist_id=f.artist_id,
            transcription=f.transcription,
            status=f.status
        )
        for f in files
    ]


@router.get("/{project_id}/transcription/{audio_id}")
def get_transcription(project_id: str, audio_id: str, db: Session = Depends(get_db)):
    """Get transcription for a specific audio file."""
    audio = db.query(AudioFile).filter(
        AudioFile.id == audio_id,
        AudioFile.project_id == project_id
    ).first()
    
    if not audio:
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return {
        "audio_id": audio_id,
        "filename": audio.filename,
        "transcription": audio.transcription,
        "status": audio.status
    }
