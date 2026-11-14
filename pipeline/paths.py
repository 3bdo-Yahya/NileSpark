"""Shared filesystem paths for the pipeline and API."""

from dataclasses import dataclass
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
COVERAGE_JSON = PROCESSED / "coverage.json"

SENSOR_DIRS = {
    "modis": RAW / "modis",
    "viirs-snpp": RAW / "viirs-snpp",
    "viirs-jpss1": RAW / "viirs-jpss1",
}


class ProductsMissing(RuntimeError):
    """Pipeline outputs are not built yet (run python -m pipeline.products)."""


@dataclass(frozen=True)
class Products:
    hotspots: Path = HOTSPOTS_PARQUET
    celldays: Path = CELLDAYS_PARQUET
    monthly: Path = MONTHLY_PARQUET
    factors: Path = FACTORS_JSON
    coverage: Path = COVERAGE_JSON

    @classmethod
    def under(cls, folder: Path) -> "Products":
        return cls(**{name: folder / getattr(cls, name).name for name in cls.__dataclass_fields__})

    def require(self, *paths: Path) -> None:
        missing = [p.name for p in paths if not p.exists()]
        if missing:
            raise ProductsMissing(f"missing pipeline outputs: {', '.join(missing)}")
