"""BurnCal API entrypoint.

Run: uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

from datetime import date

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, RedirectResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from api.schemas import CalendarData, CalendarRequest, Envelope, MonthStat, YearStat
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
    """Return harmonized monthly/yearly series for an AOI.

    Ali: query monthly.parquet filtered by bbox/polygon + date range.
    Stub returns empty series so Omar can wire the UI shape tonight.
    """
    _ = body  # unused until DuckDB wiring
    data = CalendarData(
        months=[
            MonthStat(
                year=2025,
                month=3,
                value=0.0,
                raw_by_sensor={"modis": 0.0, "viirs": 0.0},
                median=None,
                anomaly=None,
                anomaly_pct=None,
            )
        ],
        years=[YearStat(year=2025, value=0.0)],
    )
    return ok(
        data.model_dump(),
        meta={
            "k": None,
            "baseline_years": [],
            "method_version": "v1",
            "country_hint": "Egypt",
            "stub": True,
        },
    )


@app.post("/api/hotspots.csv")
@limiter.limit("10/minute")
def hotspots_csv(request: Request, body: CalendarRequest):
    """Stream hotspot CSV for the search. Ali: read hotspots.parquet."""
    _ = body
    header = (
        "sensor,satellite,country,acq_date,acq_time,lat,lon,frp,"
        "conf_norm,type,daynight,brightness\n"
    )
    return PlainTextResponse(
        content=header,
        media_type="text/csv",
        headers={"X-Row-Cap": "100000", "X-Stub": "true"},
    )


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
    """GeoJSON cell counts for the heat/map layer."""
    if min_lon >= max_lon or min_lat >= max_lat:
        return fail("invalid bbox")
    if start > end:
        return fail("start must be on or before end")
    _ = include_static
    return ok(
        {
            "type": "FeatureCollection",
            "features": [],
        },
        meta={"stub": True},
    )


@app.get("/api/methodology")
@limiter.limit("60/minute")
def methodology(request: Request):
    """Factors + plain-language explanation for the UI panel."""
    if FACTORS_JSON.exists():
        import json

        payload = json.loads(FACTORS_JSON.read_text(encoding="utf-8"))
        return ok(payload)

    return ok(
        {
            "method_version": "v1",
            "grid_deg": 0.01,
            "overlap_years": [],
            "global_k": None,
            "countries": {},
            "plain_language": (
                "We count fires as ~1 km cell-days, then scale older MODIS "
                "counts by k so they match VIIRS sensitivity. "
                "(Stub — factors.json not built yet.)"
            ),
            "stub": True,
        }
    )

