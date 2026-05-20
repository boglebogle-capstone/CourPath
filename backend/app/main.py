from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.routers import departments, jobs, courses, analyze

app = FastAPI(title="CourPath API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(departments.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")


@app.get("/api")
def api_root():
    return {"message": "CourPath API is running"}


# ── React 빌드 정적 파일 서빙 (배포용) ──
FRONTEND_BUILD = Path(__file__).resolve().parents[2] / "frontend" / "build"

if FRONTEND_BUILD.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_BUILD / "static")), name="static")

    @app.get("/{full_path:path}")
    async def serve_react(request: Request, full_path: str):
        """API가 아닌 모든 경로 → React index.html (SPA 라우팅)"""
        file_path = FRONTEND_BUILD / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_BUILD / "index.html"))
