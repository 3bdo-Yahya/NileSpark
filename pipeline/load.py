"""Normalize MODIS/VIIRS FIRMS CSVs into hotspots.parquet.

Contract: docs/PIPELINE_OUTPUT.md → hotspots.parquet
Run: python -m pipeline.load   (~40 s for 79M detections, < 2 GB RAM)
"""

from __future__ import annotations

import time
from collections.abc import Mapping
from pathlib import Path

from pipeline.db import connect
from pipeline.paths import HOTSPOTS_PARQUET, SENSOR_DIRS

HOTSPOT_COLUMNS = (
    "sensor", "satellite", "country", "acq_date", "acq_time", "lat", "lon",
    "frp", "conf_norm", "type", "daynight", "brightness",
)

_SELECT = """
SELECT
    '{sensor}' AS sensor,
    CAST(satellite AS VARCHAR) AS satellite,
    regexp_extract(filename, '_[0-9]{{4}}_(.+)\\.csv$', 1) AS country,
    CAST(acq_date AS DATE) AS acq_date,
    CAST(acq_time AS SMALLINT) AS acq_time,
    CAST(latitude AS DOUBLE) AS lat,
    CAST(longitude AS DOUBLE) AS lon,
    CAST(frp AS DOUBLE) AS frp,
    {conf_norm} AS conf_norm,
    CAST(type AS TINYINT) AS type,
    CAST(daynight AS VARCHAR) AS daynight,
    CAST({brightness} AS DOUBLE) AS brightness
FROM read_csv('{glob}', union_by_name = true, filename = true,
              types = {{'confidence': 'VARCHAR', 'acq_time': 'VARCHAR', 'version': 'VARCHAR'}})
WHERE type = 0 AND {qc}
"""

# Vegetation fires only (type 0); MODIS confidence >= 30; VIIRS nominal or high.
_MODIS = {
    "conf_norm": "CAST(confidence AS DOUBLE) / 100.0",
    "brightness": "brightness",
    "qc": "TRY_CAST(confidence AS DOUBLE) >= 30",
}
_VIIRS = {
    "conf_norm": "CASE lower(confidence) WHEN 'h' THEN 1.0 WHEN 'n' THEN 0.7 ELSE 0.3 END",
    "brightness": "bright_ti4",
    "qc": "lower(confidence) IN ('n', 'h')",
}


def build_hotspots(raw_dirs: Mapping[str, Path] = SENSOR_DIRS, target: Path = HOTSPOTS_PARQUET) -> Path:
    """QC'd detections from raw/<sensor>/<year>/<sensor>_<year>_<Country>.csv -> target parquet."""
    parts = [
        _SELECT.format(sensor=sensor, glob=f"{root}/*/*.csv", **(_MODIS if sensor == "modis" else _VIIRS))
        for sensor, root in raw_dirs.items()
        if any(Path(root).glob("*/*.csv"))
    ]
    if not parts:
        raise FileNotFoundError(f"No FIRMS CSVs under {', '.join(str(r) for r in raw_dirs.values())}")
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(".parquet.tmp")
    connect().sql(
        f"COPY ({' UNION ALL '.join(parts)}) TO '{tmp}' (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 500000)"
    )
    tmp.replace(target)
    return target


def main() -> None:
    started = time.time()
    target = build_hotspots()
    for row in connect().sql(
        f"SELECT sensor, count(*), min(acq_date), max(acq_date), count(DISTINCT country) "
        f"FROM '{target}' GROUP BY 1 ORDER BY 1"
    ).fetchall():
        print(row)
    print(f"wrote {target} in {time.time() - started:.1f}s")


if __name__ == "__main__":
    main()
