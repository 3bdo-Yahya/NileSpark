"""Normalize MODIS/VIIRS FIRMS CSVs into hotspots.parquet.

Owner: Maryam.
Contract: docs/PIPELINE_OUTPUT.md → hotspots.parquet
"""

from __future__ import annotations

from pathlib import Path


def normalize_modis_row(row: dict, country: str) -> dict:
    """Map one MODIS CSV row to the shared hotspot schema."""
    conf = float(row.get("confidence") or 0)
    return {
        "sensor": "modis",
        "satellite": row.get("satellite"),
        "country": country,
        "acq_date": row.get("acq_date"),
        "acq_time": int(row.get("acq_time") or 0),
        "lat": float(row["latitude"]),
        "lon": float(row["longitude"]),
        "frp": _optional_float(row.get("frp")),
        "conf_norm": conf / 100.0,
        "type": int(row.get("type") or 0),
        "daynight": row.get("daynight"),
        "brightness": _optional_float(row.get("brightness")),
    }


def normalize_viirs_row(row: dict, country: str, sensor: str) -> dict:
    """Map one VIIRS CSV row to the shared hotspot schema."""
    conf_map = {"l": 0.3, "n": 0.7, "h": 1.0}
    raw_conf = str(row.get("confidence") or "n").lower()
    return {
        "sensor": sensor,
        "satellite": row.get("satellite"),
        "country": country,
        "acq_date": row.get("acq_date"),
        "acq_time": int(row.get("acq_time") or 0),
        "lat": float(row["latitude"]),
        "lon": float(row["longitude"]),
        "frp": _optional_float(row.get("frp")),
        "conf_norm": conf_map.get(raw_conf, 0.7),
        "type": int(row.get("type") or 0),
        "daynight": row.get("daynight"),
        "brightness": _optional_float(row.get("bright_ti4")),
    }


def passes_default_qc(row: dict) -> bool:
    """Vegetation fires only; drop low confidence."""
    if int(row.get("type", -1)) != 0:
        return False
    conf = float(row.get("conf_norm") or 0)
    sensor = row.get("sensor")
    if sensor == "modis":
        return conf >= 0.30
    # VIIRS: keep nominal (0.7) and high (1.0)
    return conf >= 0.70


def country_from_filename(path: Path) -> str:
    """modis_2025_Egypt.csv → Egypt."""
    stem = path.stem
    parts = stem.split("_")
    # sensor tokens vary: modis | viirs-snpp | viirs-jpss1
    # last token(s) after year are the country
    for i, part in enumerate(parts):
        if part.isdigit() and len(part) == 4:
            return "_".join(parts[i + 1 :])
    return stem


def build_hotspots(_raw_root: Path | None = None) -> Path:
    """Scan data/raw, QC, write hotspots.parquet. Maryam implements body."""
    raise NotImplementedError(
        "Maryam: walk SENSOR_DIRS, normalize rows, apply passes_default_qc, "
        "write atomically to HOTSPOTS_PARQUET"
    )


def _optional_float(value) -> float | None:
    if value is None or value == "":
        return None
    return float(value)
