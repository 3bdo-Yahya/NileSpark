"""Serve the built frontend and FastAPI on one origin: uvicorn release:app."""
from pathlib import Path

from starlette.applications import Starlette
from starlette.responses import FileResponse
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

from api.main import app as api

DIST = Path(__file__).resolve().parent / "frontend" / "dist"


async def index(request):
    return FileResponse(DIST / "index.html")


async def favicon(request):
    return FileResponse(DIST / "favicon.svg")


app = Starlette(routes=[
    Route("/", index),
    Route("/favicon.svg", favicon),
    *(Mount(f"/{folder}", StaticFiles(directory=DIST / folder)) for folder in ("assets", "images", "licenses")),
    Mount("/", api),
])
