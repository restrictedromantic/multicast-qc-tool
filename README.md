# Multicast QC Tool

A quality control tool for multicast voice-over recordings at Pocket FM. Detects missing lines/phrases before the mastering stage.

## Features

- **Script Upload**: Upload color-coded Word documents (.docx) - each color represents a different voice artist
- **Audio Upload**: Upload audio files per artist (WAV, MP3, M4A, OGG, FLAC)
- **Speech-to-Text**: Automatic transcription using OpenAI Whisper (API or local)
- **Smart Matching**: Fuzzy text matching to detect found, partial, and missing lines
- **QC Report**: Visual dashboard showing completion status per artist
- **Shareable Links**: Each project has a unique URL for team sharing

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key (optional, for API transcription mode)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Usage

1. **Create a Project**: Click "New Project" and enter show code + episode number
2. **Upload Script**: Drag & drop your color-coded .docx script file
3. **Map Artists**: Rename the auto-detected color groups to artist names
4. **Upload Audio**: Select an artist and upload their audio file
5. **View Report**: Check the QC Report tab to see found/missing lines

## Naming Convention for Audio Files

Recommended format:
```
{ShowCode}_{EpisodeNumber}_{ArtistCode}_{Type}.wav

Examples:
- MYS_E045_VOA1_FULL.wav  (Full recording from Artist 1)
- MYS_E045_VOA2_001.wav   (Snippet 1 from Artist 2)
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Python, FastAPI, SQLAlchemy
- **Transcription**: OpenAI Whisper (API + local)
- **Text Matching**: RapidFuzz

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects` | GET/POST | List/create projects |
| `/projects/{id}` | GET/DELETE | Get/delete project |
| `/scripts/{project_id}/upload` | POST | Upload script |
| `/scripts/{project_id}/lines` | GET | Get parsed lines |
| `/audio/{project_id}/upload` | POST | Upload audio |
| `/audio/{project_id}/transcribe/{audio_id}` | POST | Transcribe audio |
| `/qc/{project_id}/report` | GET | Get QC report |
| `/settings` | GET/PUT | Manage settings |

## Deployment

### Vercel (Frontend)

1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-railway-url.up.railway.app`

### Railway (Backend)

1. Push to GitHub
2. Create new project in Railway
3. Set root directory to `backend`
4. Railway will auto-detect the Dockerfile

## License

Internal tool for Pocket FM
