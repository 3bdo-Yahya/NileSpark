"""QC grid → cell-days → k factor → monthly harmonized series.

Owner: Salma (+ Maryam on anomaly / AI QC).
Contract: docs/PIPELINE_OUTPUT.md → celldays.parquet, monthly.parquet, factors.json
"""

from __future__ import annotations

GRID_DEG = 0.01
METHOD_VERSION = "v1"


def snap_to_cell(lat: float, lon: float, grid_deg: float = GRID_DEG) -> tuple[float, float]:
    """Snap a point to the center of a grid_deg cell."""
    cell_lat = (lat // grid_deg) * grid_deg + grid_deg / 2
    cell_lon = (lon // grid_deg) * grid_deg + grid_deg / 2
    return float(cell_lat), float(cell_lon)


def sensor_family(sensor: str) -> str:
    """Collapse VIIRS platforms into one family for cell-day union."""
    if sensor == "modis":
        return "modis"
    if sensor.startswith("viirs"):
        return "viirs"
    raise ValueError(f"Unknown sensor: {sensor}")


def compute_k(modis_celldays: float, viirs_celldays: float) -> float:
    """Overlap-period scaling factor: VIIRS / MODIS."""
    if modis_celldays <= 0:
        raise ValueError("Cannot compute k with zero MODIS cell-days")
    return viirs_celldays / modis_celldays


def harmonize_month(
    *,
    year: int,
    raw_modis: float | None,
    raw_viirs: float | None,
    k: float,
    viirs_start_year: int = 2012,
) -> float:
    """Pick VIIRS when available; else scale MODIS by k."""
    if year >= viirs_start_year and raw_viirs is not None:
        return float(raw_viirs)
    if raw_modis is None:
        return 0.0
    return float(raw_modis) * k


def month_anomaly(value: float, historical_same_month: list[float]) -> tuple[float, float]:
    """Return (anomaly, anomaly_pct) vs median of prior same-calendar-month values."""
    if not historical_same_month:
        return 0.0, 0.0
    sorted_vals = sorted(historical_same_month)
    mid = len(sorted_vals) // 2
    if len(sorted_vals) % 2:
        median = float(sorted_vals[mid])
    else:
        median = (sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0
    anomaly = value - median
    pct = 0.0 if median == 0 else (anomaly / median) * 100.0
    return anomaly, pct


def build_harmonized() -> None:
    """Read hotspots.parquet → write celldays, monthly, factors. Salma implements."""
    raise NotImplementedError(
        "Salma: grid hotspots to cell-days, fit per-country k on overlap years, "
        "write MONTHLY_PARQUET + FACTORS_JSON atomically"
    )
