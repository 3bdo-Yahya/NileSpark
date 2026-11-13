"""Shared filesystem paths for the pipeline and API."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
FIXTURES = DATA / "fixtures"

HOTSPOTS_PARQUET = PROCESSED / "hotspots.parquet"
CELLDAYS_PARQUET = PROCESSED / "celldays.parquet"
MONTHLY_PARQUET = PROCESSED / "monthly.parquet"
FACTORS_JSON = PROCESSED / "factors.json"

SENSOR_DIRS = {
    "modis": RAW / "modis",
    "viirs-snpp": RAW / "viirs-snpp",
    "viirs-jpss1": RAW / "viirs-jpss1",
}
