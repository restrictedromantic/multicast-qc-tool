from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import projects_router, scripts_router, audio_router, qc_router, settings_router

app = FastAPI(
    title="Multicast QC Tool",
    description="Quality Control tool for multicast voice-over recordings at Pocket FM",
    version="1.0.0"
)

# CORS: allow Vercel frontend + local dev (allow_credentials=True cannot use "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://multicast-qc-tool.vercel.app",
        "http://localhost:3000",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(scripts_router)
app.include_router(audio_router)
app.include_router(qc_router)
app.include_router(settings_router)


@app.get("/")
def root():
    return {
        "name": "Multicast QC Tool",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/version")
def version():
    """Return version and feature flags so frontend can verify backend deploy."""
    return {"version": "1.0.0", "pdf_supported": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
