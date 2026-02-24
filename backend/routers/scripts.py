from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil

from models.database import get_db, Project, Artist, ScriptLine
from models.schemas import ScriptLineResponse, ColorMapping
from services.script_parser import parse_docx_with_all_lines, get_unique_colors

router = APIRouter(prefix="/scripts", tags=["scripts"])

UPLOAD_DIR = "uploads/scripts"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{project_id}/upload")
async def upload_script(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a script file (DOCX) for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only DOCX files are supported")
    
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        all_lines = parse_docx_with_all_lines(filepath)
        colors = list(set(color for _, _, color in all_lines))
        
        db.query(ScriptLine).filter(ScriptLine.project_id == project_id).delete()
        db.query(Artist).filter(Artist.project_id == project_id).delete()
        
        color_to_artist = {}
        for i, color in enumerate(colors):
            artist = Artist(
                id=str(uuid.uuid4()),
                project_id=project_id,
                name=f"Artist {i + 1}",
                color=color
            )
            db.add(artist)
            color_to_artist[color] = artist.id
        
        for line_num, text, color in all_lines:
            script_line = ScriptLine(
                id=str(uuid.uuid4()),
                project_id=project_id,
                artist_id=color_to_artist.get(color),
                line_number=line_num,
                text=text,
                artist_color=color,
                status="pending"
            )
            db.add(script_line)
        
        project.script_uploaded = True
        project.script_filename = filename
        project.status = "script_uploaded"
        
        db.commit()
        
        return {
            "message": "Script uploaded successfully",
            "total_lines": len(all_lines),
            "colors_found": colors,
            "artists_created": len(colors)
        }
        
    except Exception as e:
        os.remove(filepath)
        raise HTTPException(status_code=500, detail=f"Error parsing script: {str(e)}")


@router.get("/{project_id}/lines", response_model=List[ScriptLineResponse])
def get_script_lines(project_id: str, db: Session = Depends(get_db)):
    """Get all script lines for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    lines = db.query(ScriptLine).filter(
        ScriptLine.project_id == project_id
    ).order_by(ScriptLine.line_number).all()
    
    result = []
    for line in lines:
        artist = db.query(Artist).filter(Artist.id == line.artist_id).first()
        result.append(ScriptLineResponse(
            id=line.id,
            line_number=line.line_number,
            text=line.text,
            artist_color=line.artist_color,
            artist_name=artist.name if artist else None,
            status=line.status,
            confidence=line.confidence,
            matched_text=line.matched_text
        ))
    
    return result


@router.get("/{project_id}/colors")
def get_script_colors(project_id: str, db: Session = Depends(get_db)):
    """Get unique colors found in the script."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    artists = db.query(Artist).filter(Artist.project_id == project_id).all()
    return [{"color": a.color, "name": a.name, "id": a.id} for a in artists]


@router.put("/{project_id}/artists/{artist_id}")
def update_artist_name(
    project_id: str,
    artist_id: str,
    mapping: ColorMapping,
    db: Session = Depends(get_db)
):
    """Update an artist's name."""
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.project_id == project_id
    ).first()
    
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    artist.name = mapping.artist_name
    db.commit()
    
    return {"message": "Artist name updated", "artist_id": artist_id, "name": mapping.artist_name}
