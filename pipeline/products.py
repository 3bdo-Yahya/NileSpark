"""hotspots.parquet -> celldays.parquet, coverage.json, factors.json, monthly.parquet.

Run: python -m pipeline.products [--reuse-celldays]
"""

from __future__ import annotations

import json
import time
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

from pipeline.db import connect
from pipeline.factors import Ratio, fit_ratio
from pipeline.grid import GRID_DEG_APPROX, GRID_KM, sql_cell_x, sql_cell_y, sql_center_lat, sql_center_lon
from pipeline.harmonize import (
    ALL_LABEL,
    EARLY_LABEL,
    EARLY_WINDOW,
    METHOD_VERSION,
    UNIT,
    Coverage,
    DayCounts,
    Factors,
    calibration_pairs,
    detect_outages,
    fit_factors,
    harmonize_days,
    per_year_ratio,
    validate_modis_factor,
    with_baseline,
)
from pipeline.paths import Products

PLAIN_LANGUAGE = (
    "Each fire is counted once per ~1 km grid cell per day, so the finer VIIRS pixels do not "
    "inflate counts. S-NPP VIIRS is the reference. Days when S-NPP is missing use NOAA-20 x k_n20; "
    "years before VIIRS use MODIS x k_modis (Terra-only x k_terra before Aqua, mid-2002). The k "
    "factors are fitted where both sensors observed the same days, preferring 2012-2017 before the "
    "MODIS orbits drifted, and small areas lean on their country's k. The anomaly compares a month "
    "with the median of the same month in all other years."
)


def _write_parquet(con, sql: str, target: Path) -> None:
    tmp = target.with_suffix(".parquet.tmp")
    con.sql(f"COPY ({sql}) TO '{tmp}' (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 250000)")
    tmp.replace(target)


def _write_json(payload: dict, target: Path) -> None:
    tmp = target.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=1, default=str), encoding="utf-8")
    tmp.replace(target)


def build_celldays(con, p: Products) -> None:
    sql = f"""
    WITH y AS (
        SELECT sensor, country, acq_date, satellite, frp, lon, {sql_cell_y()} AS cell_y
        FROM '{p.hotspots}'
    ), c AS (SELECT *, {sql_cell_x()} AS cell_x FROM y)
    SELECT sensor, acq_date, cell_x, cell_y,
           {sql_center_lat()} AS cell_lat, {sql_center_lon()} AS cell_lon,
           mode(country) AS country,
           count(*)::INTEGER AS n_detections,
           sum(frp) AS frp_sum,
           bool_or(satellite = 'Terra') AS has_terra,
           bool_or(satellite = 'Aqua') AS has_aqua
    FROM c GROUP BY sensor, acq_date, cell_x, cell_y
    ORDER BY cell_y, cell_x
    """
    _write_parquet(con, sql, p.celldays)


def load_coverage(con, p: Products) -> dict:
    sensor_years: dict[str, dict[str, list[int]]] = defaultdict(lambda: defaultdict(list))
    for sensor, country, year in con.sql(
        f"SELECT DISTINCT sensor, country, year(acq_date) FROM '{p.hotspots}' ORDER BY ALL"
    ).fetchall():
        sensor_years[country][sensor].append(year)
    extents = {
        c: [round(v, 4) for v in box]
        for c, *box in con.sql(
            f"SELECT country, min(lon), min(lat), max(lon), max(lat) FROM '{p.hotspots}' GROUP BY 1"
        ).fetchall()
    }
    [(last_day,)] = con.sql(f"SELECT max(acq_date) FROM '{p.hotspots}'").fetchall()
    return {"last_day": last_day.isoformat(), "countries": sensor_years, "extents": extents}


def sensor_year_sets(coverage: dict) -> dict[str, frozenset[tuple[str, int]]]:
    return {
        country: frozenset((s, y) for s, years in sensors.items() for y in years)
        for country, sensors in coverage["countries"].items()
    }


def find_outages(con, p: Products, sets: dict[str, frozenset]) -> frozenset[tuple[str, date]]:
    counts = {
        (s, c, d): n
        for s, c, d, n in con.sql(
            f"SELECT sensor, country, acq_date, count(*) FROM '{p.hotspots}' GROUP BY ALL"
        ).fetchall()
    }
    return detect_outages(counts, sets)


def country_daily(con, p: Products) -> dict[str, dict[date, DayCounts]]:
    out: dict[str, dict[date, DayCounts]] = defaultdict(dict)
    rows = con.sql(
        f"""
        SELECT country, acq_date,
               count(*) FILTER (WHERE sensor = 'viirs-snpp'),
               count(*) FILTER (WHERE sensor = 'viirs-jpss1'),
               count(*) FILTER (WHERE sensor = 'modis'),
               count(*) FILTER (WHERE sensor = 'modis' AND has_terra)
        FROM '{p.celldays}' GROUP BY ALL
        """
    ).fetchall()
    for country, d, snpp, n20, modis, terra in rows:
        out[country][d] = DayCounts(snpp=snpp, n20=n20, modis=modis, terra=terra)
    return out


def global_factors(daily_by_country, coverages) -> dict[str, Factors]:
    """Pooled priors per calibration window (no shrinkage)."""
    result = {}
    for label, years in ((EARLY_LABEL, EARLY_WINDOW), (ALL_LABEL, None)):
        ratios = {}
        for source in ("modis", "terra", "n20"):
            win = None if source == "n20" else years
            pairs = [
                p
                for c, daily in daily_by_country.items()
                for by_year in [calibration_pairs(daily, coverages[c], "snpp", source, win)]
                for y in sorted(by_year)
                for p in by_year[y]
            ]
            ratios[source] = fit_ratio(pairs, window=label if source != "n20" else ALL_LABEL)
        result[label] = Factors(**ratios)
    return result


def _prior_from(global_by_window: dict[str, Factors]):
    def prior(source: str, window: str) -> Ratio | None:
        factors = global_by_window.get(window)
        return factors.for_source(source) if factors else None

    return prior


def _monthly_rows(country: str, rows: list[dict], factors: Factors) -> list[tuple]:
    k = factors.modis.k if factors.modis else None
    return [
        (
            country, r["year"], r["month"], r["value"], r["low"], r["high"], r["source"],
            r["raw"]["modis"], r["raw"]["terra"], r["raw"]["snpp"], r["raw"]["n20"],
            r["median"], r["anomaly"], r["anomaly_pct"], k, METHOD_VERSION,
        )
        for r in rows
    ]


def write_monthly(con, p: Products, rows: list[tuple]) -> None:
    con.execute(
        """
        CREATE OR REPLACE TEMP TABLE monthly (
            country VARCHAR, year SMALLINT, month TINYINT, value DOUBLE, value_low DOUBLE,
            value_high DOUBLE, source VARCHAR, raw_modis INTEGER, raw_terra INTEGER,
            raw_snpp INTEGER, raw_n20 INTEGER, median DOUBLE, anomaly DOUBLE, anomaly_pct DOUBLE,
            k_modis DOUBLE, method_version VARCHAR)
        """
    )
    if rows:
        con.executemany("INSERT INTO monthly VALUES (" + ", ".join(["?"] * 16) + ")", rows)
    _write_parquet(con, "SELECT * FROM monthly ORDER BY country, year, month", p.monthly)


def _country_report(daily, cov, factors: Factors, rows: list[dict]) -> dict:
    return {
        "factors": factors.as_dict(),
        "per_year_k_modis": per_year_ratio(daily, cov),
        "validation_modis_loyo": validate_modis_factor(daily, cov),
        "months": len(rows),
        "first_month": f"{rows[0]['year']}-{rows[0]['month']:02d}" if rows else None,
    }


def build_harmonized(p: Products = Products(), rebuild_celldays: bool = True) -> dict:
    started = time.time()
    con = connect()
    if rebuild_celldays or not p.celldays.exists():
        print("celldays …", flush=True)
        build_celldays(con, p)
    coverage = load_coverage(con, p)
    sets = sensor_year_sets(coverage)
    last_day = date.fromisoformat(coverage["last_day"])
    print("outages …", flush=True)
    outages = find_outages(con, p, sets)
    coverages = {c: Coverage(sensor_years=s, last_day=last_day, outage_days=outages) for c, s in sets.items()}
    daily_by_country = country_daily(con, p)

    print("factors …", flush=True)
    globals_ = global_factors({c: daily_by_country.get(c, {}) for c in coverages}, coverages)
    prior = _prior_from(globals_)
    countries, monthly_rows = {}, []
    for country in sorted(coverages):
        daily, cov = daily_by_country.get(country, {}), coverages[country]
        factors = fit_factors(daily, cov, prior)
        rows = with_baseline(harmonize_days(daily, cov, factors))
        monthly_rows += _monthly_rows(country, rows, factors)
        countries[country] = _country_report(daily, cov, factors, rows)
    write_monthly(con, p, monthly_rows)

    outage_days: dict[str, list[str]] = defaultdict(list)
    for sensor, d in sorted(outages):
        outage_days[sensor].append(d.isoformat())
    _write_json({**coverage, "outage_days": outage_days}, p.coverage)

    early, overall = globals_[EARLY_LABEL].modis, globals_[ALL_LABEL].modis
    report = {
        "method_version": METHOD_VERSION,
        "unit": UNIT,
        "reference_sensor": "viirs-snpp",
        "grid_km": GRID_KM,
        "grid_deg": GRID_DEG_APPROX,
        "calibration_window": EARLY_LABEL,
        "overlap_years": sorted({int(y) for c in countries.values() for y in c["per_year_k_modis"]}),
        "global_k": round((early or overall).k, 4) if (early or overall) else None,
        "global_k_all_overlap": round(overall.k, 4) if overall else None,
        "global": {label: f.as_dict() for label, f in globals_.items()},
        "countries": countries,
        "outage_days": len(outages),
        "plain_language": PLAIN_LANGUAGE,
        "built_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    _write_json(report, p.factors)
    print(f"done in {time.time() - started:.1f}s → {p.factors.parent}")
    return report


if __name__ == "__main__":
    import sys

    build_harmonized(rebuild_celldays="--reuse-celldays" not in sys.argv)



