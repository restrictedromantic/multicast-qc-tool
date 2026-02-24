from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid

DATABASE_URL = "sqlite:///./multicast_qc.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_uuid():
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    show_code = Column(String, nullable=False)
    episode_number = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    script_uploaded = Column(Boolean, default=False)
    script_filename = Column(String, nullable=True)
    status = Column(String, default="draft")
    
    artists = relationship("Artist", back_populates="project", cascade="all, delete-orphan")
    lines = relationship("ScriptLine", back_populates="project", cascade="all, delete-orphan")
    audio_files = relationship("AudioFile", back_populates="project", cascade="all, delete-orphan")


class Artist(Base):
    __tablename__ = "artists"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)
    
    project = relationship("Project", back_populates="artists")
    lines = relationship("ScriptLine", back_populates="artist")
    audio_files = relationship("AudioFile", back_populates="artist")


class ScriptLine(Base):
    __tablename__ = "script_lines"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    artist_id = Column(String, ForeignKey("artists.id"), nullable=True)
    line_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    artist_color = Column(String, nullable=False)
    status = Column(String, default="pending")
    confidence = Column(Float, default=0.0)
    matched_text = Column(Text, nullable=True)
    
    project = relationship("Project", back_populates="lines")
    artist = relationship("Artist", back_populates="lines")


class AudioFile(Base):
    __tablename__ = "audio_files"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    artist_id = Column(String, ForeignKey("artists.id"), nullable=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    transcription = Column(Text, nullable=True)
    status = Column(String, default="uploaded")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="audio_files")
    artist = relationship("Artist", back_populates="audio_files")


class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, default=1)
    openai_api_key = Column(String, nullable=True)
    whisper_mode = Column(String, default="api")


Base.metadata.create_all(bind=engine)
