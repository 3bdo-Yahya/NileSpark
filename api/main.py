"""BurnCal API entrypoint.

Run: uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import csv
import io
import json
import logging
from datetime import date

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, RedirectResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from api.schemas import BBoxAoi, CalendarRequest, Envelope
from pipeline.aoi import CSV_ROW_CAP, calendar_for_bbox, hotspot_rows, map_cells
from pipeline.paths import ProductsMissing
from pipeline.paths import FACTORS_JSON

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="BurnCal API",
    version="0.1.0",
    description="Harmonized MODIS/VIIRS burning-activity calendar",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    expose_headers=["X-Stub", "X-Truncated", "X-Row-Cap", "Content-Disposition"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ok(data, meta: dict | None = None) -> dict:
    return Envelope(success=True, data=data, error=None, meta=meta or {}).model_dump()


def fail(message: str, status_code: int = 400) -> JSONResponse:
    body = Envelope(success=False, data=None, error=message, meta={}).model_dump()
    return JSONResponse(status_code=status_code, content=body)


@app.get("/", include_in_schema=False)
def root():
    """Browser hit on :8000 → interactive API docs (UI lives on Vite :5173)."""
    return RedirectResponse(url="/docs")


@app.get("/health")
@limiter.limit("60/minute")
def health(request: Request):
    return ok({"status": "ok"})


@app.post("/api/calendar")
@limiter.limit("30/minute")
def calendar(request: Request, body: CalendarRequest):
    if not isinstance(body.aoi, BBoxAoi):
        return fail("Select a bounding box. Polygon queries are not supported yet.", 422)
    data, meta = calendar_for_bbox(tuple(body.aoi.bbox), body.start, body.end)
    return ok(data, meta)


@app.post("/api/hotspots.csv")
@limiter.limit("10/minute")
def hotspots_csv(request: Request, body: CalendarRequest):
    if not isinstance(body.aoi, BBoxAoi):
        return fail("Select a bounding box. Polygon queries are not supported yet.", 422)
    columns, rows, truncated = hotspot_rows(tuple(body.aoi.bbox), body.start, body.end)
    buffer = io.StringIO(newline="")
    writer = csv.writer(buffer)
    writer.writerow(columns)
    writer.writerows(rows)
    return PlainTextResponse(buffer.getvalue(), media_type="text/csv", headers={
        "X-Stub": "false", "X-Truncated": str(truncated).lower(), "X-Row-Cap": str(CSV_ROW_CAP)
    })


@app.get("/api/map")
@limiter.limit("30/minute")
def map_layer(
    request: Request,
    min_lon: float = Query(...),
    min_lat: float = Query(...),
    max_lon: float = Query(...),
    max_lat: float = Query(...),
    start: date = Query(...),
    end: date = Query(...),
    include_static: bool = Query(False),
):
    data, meta = map_cells((min_lon, min_lat, max_lon, max_lat), start, end)
    return ok(data, meta)


@app.get("/api/methodology")
@limiter.limit("60/minute")
def methodology(request: Request):
    if not FACTORS_JSON.is_file():
        raise ProductsMissing("Build the processed data before requesting methodology.")
    payload = json.loads(FACTORS_JSON.read_text(encoding="utf-8"))
    payload.pop("countries", None)
    return ok(payload, {"stub": False})


@app.exception_handler(ProductsMissing)
async def missing_products(request, exc):
    return fail(str(exc), 503)


@app.exception_handler(ValueError)
async def invalid_query(request, exc):
    return fail(str(exc), 400)


@app.exception_handler(Exception)
async def internal_error(request, exc):
    logging.getLogger(__name__).exception("API request failed")
    return fail("Unable to read processed data.", 500)
