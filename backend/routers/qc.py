from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db, Project, Artist, ScriptLine, AudioFile
from models.schemas import QCReportResponse, ArtistResponse, ScriptLineResponse

router = APIRouter(prefix="/qc", tags=["qc"])


@router.get("/{project_id}/report", response_model=QCReportResponse)
def get_qc_report(project_id: str, db: Session = Depends(get_db)):
    """Generate QC report for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    all_lines = db.query(ScriptLine).filter(
        ScriptLine.project_id == project_id
    ).order_by(ScriptLine.line_number).all()
    
    total = len(all_lines)
    found = sum(1 for l in all_lines if l.status == "found")
    partial = sum(1 for l in all_lines if l.status == "partial")
    missing = sum(1 for l in all_lines if l.status == "missing" or l.status == "pending")
    
    completion = (found + partial * 0.5) / total * 100 if total > 0 else 0
    
    artists = db.query(Artist).filter(Artist.project_id == project_id).all()
    artist_responses = []
    
    for artist in artists:
        artist_lines = [l for l in all_lines if l.artist_id == artist.id]
        a_total = len(artist_lines)
        a_found = sum(1 for l in artist_lines if l.status == "found")
        a_partial = sum(1 for l in artist_lines if l.status == "partial")
        a_missing = sum(1 for l in artist_lines if l.status == "missing" or l.status == "pending")
        
        artist_responses.append(ArtistResponse(
            id=artist.id,
            name=artist.name,
            color=artist.color,
            total_lines=a_total,
            found_lines=a_found,
            partial_lines=a_partial,
            missing_lines=a_missing
        ))
    
    line_responses = []
    for line in all_lines:
        artist = next((a for a in artists if a.id == line.artist_id), None)
        line_responses.append(ScriptLineResponse(
            id=line.id,
            line_number=line.line_number,
            text=line.text,
            artist_color=line.artist_color,
            artist_name=artist.name if artist else None,
            status=line.status,
            confidence=line.confidence,
            matched_text=line.matched_text
        ))
    
    return QCReportResponse(
        project_id=project.id,
        project_name=project.name,
        episode=project.episode_number,
        total_lines=total,
        found_lines=found,
        partial_lines=partial,
        missing_lines=missing,
        completion_percentage=round(completion, 1),
        artists=artist_responses,
        lines=line_responses
    )


@router.get("/{project_id}/summary")
def get_qc_summary(project_id: str, db: Session = Depends(get_db)):
    """Get a quick summary of QC status."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    all_lines = db.query(ScriptLine).filter(ScriptLine.project_id == project_id).all()
    
    total = len(all_lines)
    found = sum(1 for l in all_lines if l.status == "found")
    partial = sum(1 for l in all_lines if l.status == "partial")
    missing = sum(1 for l in all_lines if l.status == "missing" or l.status == "pending")
    
    audio_files = db.query(AudioFile).filter(AudioFile.project_id == project_id).all()
    transcribed = sum(1 for a in audio_files if a.status == "transcribed")
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "script_uploaded": project.script_uploaded,
        "total_lines": total,
        "found_lines": found,
        "partial_lines": partial,
        "missing_lines": missing,
        "completion_percentage": round((found + partial * 0.5) / total * 100, 1) if total > 0 else 0,
        "audio_files_uploaded": len(audio_files),
        "audio_files_transcribed": transcribed
    }
