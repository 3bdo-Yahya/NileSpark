"""Area-of-interest queries over the harmonized products — what the API calls.

    from pipeline.aoi import calendar_for_bbox, map_cells, hotspot_rows
"""

from __future__ import annotations

import json
from datetime import date
from functools import lru_cache
from pathlib import Path

from pipeline.db import connect
from pipeline.factors import Ratio
from pipeline.load import HOTSPOT_COLUMNS
from pipeline.harmonize import (
    ALL_LABEL,
    ANOMALY_BASIS,
    METHOD_VERSION,
    SOURCE_SENSOR,
    SOURCE_START,
    UNIT,
    Coverage,
    DayCounts,
    Factors,
    fit_factors,
    harmonize_days,
    with_baseline,
)
from pipeline.paths import Products, ProductsMissing

__all__ = ["Products", "ProductsMissing", "calendar_for_bbox", "hotspot_rows", "map_cells"]

MAIN_COUNTRY_SHARE = 0.05
GLOBAL_YEAR_SHARE = 0.5
MAP_CELL_LIMIT = 5000
CSV_ROW_CAP = 100_000
CSV_COLUMNS = HOTSPOT_COLUMNS
RAW_KEYS = {"modis": "modis", "viirs": "snpp", "viirs_noaa20": "n20", "modis_terra": "terra"}

BBox = tuple[float, float, float, float]


@lru_cache(maxsize=8)
def _cached_json(path: str, mtime: float) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _json(path: Path) -> dict:
    return _cached_json(str(path), path.stat().st_mtime)


def _checked(bbox: BBox, start: date, end: date) -> BBox:
    if not (isinstance(start, date) and isinstance(end, date)):
        raise ValueError("start and end must be dates")
    if start > end:
        raise ValueError("start must be on or before end")
    min_lon, min_lat, max_lon, max_lat = (float(v) for v in bbox)
    if not (-180 <= min_lon < max_lon <= 180 and -90 <= min_lat < max_lat <= 90):
        raise ValueError("bbox must be [min_lon, min_lat, max_lon, max_lat] within WGS84 bounds")
    return min_lon, min_lat, max_lon, max_lat


def _bbox_sql(bbox: BBox, lon: str = "cell_lon", lat: str = "cell_lat") -> str:
    min_lon, min_lat, max_lon, max_lat = (float(v) for v in bbox)
    return f"{lon} BETWEEN {min_lon} AND {max_lon} AND {lat} BETWEEN {min_lat} AND {max_lat}"


def _daily_by_country(products: Products, bbox: BBox) -> dict[str, dict[date, DayCounts]]:
    rows = connect().sql(
        f"""
        SELECT country, acq_date,
               count(*) FILTER (WHERE sensor = 'viirs-snpp'),
               count(*) FILTER (WHERE sensor = 'viirs-jpss1'),
               count(*) FILTER (WHERE sensor = 'modis'),
               count(*) FILTER (WHERE sensor = 'modis' AND has_terra)
        FROM '{products.celldays}' WHERE {_bbox_sql(bbox)} GROUP BY ALL
        """
    ).fetchall()
    out: dict[str, dict[date, DayCounts]] = {}
    for country, d, snpp, n20, modis, terra in rows:
        out.setdefault(country, {})[d] = DayCounts(snpp=snpp, n20=n20, modis=modis, terra=terra)
    return out


def _intersects(a: BBox, b: list[float]) -> bool:
    return not (a[2] < b[0] or a[0] > b[2] or a[3] < b[1] or a[1] > b[3])


def _main_countries(by_country: dict, coverage: dict, bbox: BBox) -> dict[str, float]:
    totals = {c: sum(d.snpp + d.n20 + d.modis for d in days.values()) for c, days in by_country.items()}
    grand = sum(totals.values())
    if grand > 0:
        shares = {c: n / grand for c, n in totals.items() if n / grand >= MAIN_COUNTRY_SHARE}
        return shares or {max(totals, key=totals.get): 1.0}
    near = [c for c, box in coverage["extents"].items() if _intersects(bbox, box)]
    return {c: 1.0 / len(near) for c in near}


def _sensor_years(main: dict[str, float], coverage: dict) -> frozenset[tuple[str, int]]:
    sets = [
        {(s, y) for s, years in coverage["countries"].get(c, {}).items() for y in years} for c in main
    ]
    if sets:
        return frozenset(set.intersection(*sets))
    counts: dict[tuple[str, int], int] = {}
    for sensors in coverage["countries"].values():
        for s, years in sensors.items():
            for y in years:
                counts[(s, y)] = counts.get((s, y), 0) + 1
    n = len(coverage["countries"]) or 1
    return frozenset(k for k, v in counts.items() if v / n >= GLOBAL_YEAR_SHARE)


def _ratio(doc: dict, window: str) -> Ratio:
    low, high = doc.get("ci95") or (doc["k"], doc["k"])
    return Ratio(k=doc["k"], low=low, high=high, numerator=0, denominator=0, n_months=0, window=window)


def _prior(main: dict[str, float], factors_doc: dict):
    """Share-weighted country factor (k and CI) for `window`; None if no country or global fit exists for it."""

    def prior(source: str, window: str) -> Ratio | None:
        g = (factors_doc["global"].get(window) or {}).get(source)
        if not g:
            return None
        weighted = [
            (w, f)
            for c, w in main.items()
            if (f := factors_doc["countries"].get(c, {}).get("factors", {}).get(source))
            and f.get("window") in (window, "prior")
        ]
        if not weighted:
            return _ratio(g, window)
        total = sum(w for w, _ in weighted)
        k = sum(w * f["k"] for w, f in weighted) / total
        low = sum(w * f["ci95"][0] for w, f in weighted) / total
        high = sum(w * f["ci95"][1] for w, f in weighted) / total
        return Ratio(k=k, low=low, high=high, numerator=0, denominator=0, n_months=0, window=window)

    return prior


def _covered(source: str, year: int, month: int, sensor_years) -> bool:
    month_end = date(year + (month == 12), month % 12 + 1, 1)
    return (SOURCE_SENSOR[source], year) in sensor_years and SOURCE_START[source] < month_end


def _round(v: float | None, nd: int = 1) -> float | None:
    return None if v is None else round(v, nd)


def _month_out(row: dict, sensor_years) -> dict:
    raw = {
        key: (row["raw"][src] if _covered(src, row["year"], row["month"], sensor_years) else None)
        for key, src in RAW_KEYS.items()
    }
    return {
        "year": row["year"],
        "month": row["month"],
        "value": _round(row["value"]),
        "value_low": _round(row["low"]),
        "value_high": _round(row["high"]),
        "source": row["source"],
        "raw_by_sensor": raw,
        "median": _round(row["median"]),
        "anomaly": _round(row["anomaly"]),
        "anomaly_pct": _round(row["anomaly_pct"]),
    }


def _in_range(year: int, month: int, start: date, end: date) -> bool:
    return (start.year, start.month) <= (year, month) <= (end.year, end.month)


def _years(months: list[dict]) -> list[dict]:
    by_year: dict[int, list[dict]] = {}
    for m in months:
        by_year.setdefault(m["year"], []).append(m)
    out = []
    for year, rows in sorted(by_year.items()):
        values = [r["value"] for r in rows if r["value"] is not None]
        out.append({"year": year, "value": _round(sum(values)) if values else None, "months": len(values)})
    return out


def calendar_for_bbox(
    bbox: BBox, start: date, end: date, products: Products = Products()
) -> tuple[dict, dict]:
    """Harmonized monthly calendar for a bbox -> (data, meta) matching docs/API_CONTRACT.md."""
    bbox = _checked(bbox, start, end)
    products.require(products.celldays, products.factors, products.coverage)
    coverage_doc, factors_doc = _json(products.coverage), _json(products.factors)
    by_country = _daily_by_country(products, bbox)
    main = _main_countries(by_country, coverage_doc, bbox)
    sensor_years = _sensor_years(main, coverage_doc)
    outages = frozenset(
        (s, date.fromisoformat(d)) for s, days in coverage_doc.get("outage_days", {}).items() for d in days
    )
    cov = Coverage(
        sensor_years=sensor_years,
        last_day=date.fromisoformat(coverage_doc["last_day"]),
        outage_days=outages,
    )
    daily: dict[date, DayCounts] = {}
    for country, days in by_country.items():
        if country not in main:
            continue
        for d, c in days.items():
            prev = daily.get(d)
            daily[d] = c if prev is None else DayCounts(
                snpp=prev.snpp + c.snpp, n20=prev.n20 + c.n20, modis=prev.modis + c.modis, terra=prev.terra + c.terra
            )
    factors: Factors = fit_factors(daily, cov, _prior(main, factors_doc))
    rows = with_baseline(harmonize_days(daily, cov, factors))
    months = [_month_out(r, sensor_years) for r in rows if _in_range(r["year"], r["month"], start, end)]
    baseline = sorted({y for r in rows if _in_range(r["year"], r["month"], start, end) for y in r["baseline_years"]})
    meta = {
        "stub": False,
        "method_version": METHOD_VERSION,
        "unit": UNIT,
        "reference_sensor": "viirs-snpp",
        "k": _round(factors.modis.k, 4) if factors.modis else None,
        "k_ci95": [_round(factors.modis.low, 4), _round(factors.modis.high, 4)] if factors.modis else None,
        "k_window": factors.modis.window if factors.modis else None,
        "factors": factors.as_dict(),
        "baseline_years": baseline,
        "anomaly_basis": ANOMALY_BASIS,
        "countries": sorted(main),
        "record": {
            "first": f"{rows[0]['year']}-{rows[0]['month']:02d}" if rows else None,
            "last": f"{rows[-1]['year']}-{rows[-1]['month']:02d}" if rows else None,
        },
        "include_static": False,
    }
    return {"months": months, "years": _years(months)}, meta


def map_cells(
    bbox: BBox, start: date, end: date, limit: int = MAP_CELL_LIMIT, products: Products = Products()
) -> tuple[dict, dict]:
    """GeoJSON cell centroids with fire-day counts. Uses VIIRS when present in the window, else MODIS."""
    bbox = _checked(bbox, start, end)
    products.require(products.celldays)
    con = connect()
    where = f"{_bbox_sql(bbox)} AND acq_date BETWEEN DATE '{start.isoformat()}' AND DATE '{end.isoformat()}'"
    [(has_viirs,)] = con.sql(
        f"SELECT count(*) > 0 FROM '{products.celldays}' WHERE {where} AND sensor LIKE 'viirs%'"
    ).fetchall()
    family = "viirs" if has_viirs else "modis"
    sensor_filter = "sensor LIKE 'viirs%'" if has_viirs else "sensor = 'modis'"
    rows = con.sql(
        f"""
        SELECT cell_lon, cell_lat, count(DISTINCT acq_date) AS n, sum(frp_sum) AS frp
        FROM '{products.celldays}' WHERE {where} AND {sensor_filter}
        GROUP BY 1, 2 ORDER BY n DESC, frp DESC LIMIT {int(limit) + 1}
        """
    ).fetchall()
    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]},
            "properties": {"count": n, "frp": _round(frp)},
        }
        for lon, lat, n, frp in rows[:limit]
    ]
    meta = {"stub": False, "sensor_family": family, "truncated": len(rows) > limit, "limit": limit}
    return {"type": "FeatureCollection", "features": features}, meta


def hotspot_rows(
    bbox: BBox, start: date, end: date, cap: int = CSV_ROW_CAP, products: Products = Products()
) -> tuple[tuple[str, ...], list[tuple], bool]:
    """Raw QC'd detections for CSV export -> (columns, rows, truncated)."""
    bbox = _checked(bbox, start, end)
    products.require(products.hotspots)
    rows = connect().sql(
        f"""
        SELECT {", ".join(CSV_COLUMNS)} FROM '{products.hotspots}'
        WHERE {_bbox_sql(bbox, "lon", "lat")}
          AND acq_date BETWEEN DATE '{start.isoformat()}' AND DATE '{end.isoformat()}'
        ORDER BY acq_date, acq_time LIMIT {int(cap) + 1}
        """
    ).fetchall()
    return CSV_COLUMNS, rows[:cap], len(rows) > cap












