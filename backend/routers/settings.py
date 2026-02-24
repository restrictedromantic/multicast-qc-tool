from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db, Settings
from models.schemas import SettingsUpdate, WhisperMode

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    """Get current settings."""
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(id=1, whisper_mode="api")
        db.add(settings)
        db.commit()
    
    return {
        "whisper_mode": settings.whisper_mode,
        "api_key_configured": bool(settings.openai_api_key)
    }


@router.put("/")
def update_settings(update: SettingsUpdate, db: Session = Depends(get_db)):
    """Update settings."""
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(id=1)
        db.add(settings)
    
    if update.openai_api_key is not None:
        settings.openai_api_key = update.openai_api_key
    
    if update.whisper_mode is not None:
        settings.whisper_mode = update.whisper_mode.value
    
    db.commit()
    
    return {
        "message": "Settings updated",
        "whisper_mode": settings.whisper_mode,
        "api_key_configured": bool(settings.openai_api_key)
    }


@router.post("/test-api-key")
def test_api_key(db: Session = Depends(get_db)):
    """Test if the configured API key is valid."""
    settings = db.query(Settings).first()
    if not settings or not settings.openai_api_key:
        raise HTTPException(status_code=400, detail="No API key configured")
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        client.models.list()
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        return {"valid": False, "message": str(e)}
