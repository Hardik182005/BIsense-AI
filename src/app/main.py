"""
BISense AI — FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import compliance, standards, analytics, chat

app = FastAPI(
    title="BISense AI API",
    description="AI-powered BIS compliance intelligence platform for Indian MSMEs",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files in production
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

STATIC_DIR = Path(__file__).parent.parent.parent / "frontend_dist"

app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance"])
app.include_router(standards.router, prefix="/api/standards", tags=["Standards"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Serve frontend static files in production (Cloud Run)
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "BISense AI API is running", "version": "1.0.0"}

