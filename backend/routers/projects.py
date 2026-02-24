from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.database import get_db, Project, Artist, ScriptLine
from models.schemas import ProjectCreate, ProjectResponse, ArtistResponse
import uuid

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new QC project."""
    db_project = Project(
        id=str(uuid.uuid4()),
        name=project.name,
        show_code=project.show_code,
        episode_number=project.episode_number
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    """List all projects."""
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get a specific project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@router.get("/{project_id}/artists", response_model=List[ArtistResponse])
def get_project_artists(project_id: str, db: Session = Depends(get_db)):
    """Get all artists for a project with their line counts."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    artists = db.query(Artist).filter(Artist.project_id == project_id).all()
    
    result = []
    for artist in artists:
        lines = db.query(ScriptLine).filter(ScriptLine.artist_id == artist.id).all()
        total = len(lines)
        found = sum(1 for l in lines if l.status == "found")
        partial = sum(1 for l in lines if l.status == "partial")
        missing = sum(1 for l in lines if l.status == "missing" or l.status == "pending")
        
        result.append(ArtistResponse(
            id=artist.id,
            name=artist.name,
            color=artist.color,
            total_lines=total,
            found_lines=found,
            partial_lines=partial,
            missing_lines=missing
        ))
    
    return result
