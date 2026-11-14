"""1 km equal-area (sinusoidal) grid shared by Python code and DuckDB SQL."""

from __future__ import annotations

import math

EARTH_RADIUS_M = 6371007.181
CELL_M = 1000.0
GRID_KM = CELL_M / 1000.0
GRID_DEG_APPROX = round(math.degrees(CELL_M / EARTH_RADIUS_M), 4)


def cell_of(lat: float, lon: float) -> tuple[int, int]:
    """(cell_x, cell_y) for a point; x uses the row-centre latitude so rows are equal-area."""
    cell_y = math.floor(EARTH_RADIUS_M * math.radians(lat) / CELL_M)
    row_lat = (cell_y + 0.5) * CELL_M / EARTH_RADIUS_M
    cell_x = math.floor(EARTH_RADIUS_M * math.radians(lon) * math.cos(row_lat) / CELL_M)
    return cell_x, cell_y


def cell_center(cell_x: int, cell_y: int) -> tuple[float, float]:
    """(lat, lon) of a cell centre."""
    row_lat = (cell_y + 0.5) * CELL_M / EARTH_RADIUS_M
    lon = (cell_x + 0.5) * CELL_M / (EARTH_RADIUS_M * math.cos(row_lat))
    return math.degrees(row_lat), math.degrees(lon)


def sql_cell_y(lat: str = "lat") -> str:
    return f"floor({EARTH_RADIUS_M} * radians({lat}) / {CELL_M})::INTEGER"


def sql_row_lat(cell_y: str = "cell_y") -> str:
    return f"(({cell_y} + 0.5) * {CELL_M} / {EARTH_RADIUS_M})"


def sql_cell_x(lon: str = "lon", cell_y: str = "cell_y") -> str:
    return (
        f"floor({EARTH_RADIUS_M} * radians({lon}) * cos({sql_row_lat(cell_y)}) / {CELL_M})::INTEGER"
    )


def sql_center_lat(cell_y: str = "cell_y") -> str:
    return f"degrees({sql_row_lat(cell_y)})"


def sql_center_lon(cell_x: str = "cell_x", cell_y: str = "cell_y") -> str:
    return f"degrees(({cell_x} + 0.5) * {CELL_M} / ({EARTH_RADIUS_M} * cos({sql_row_lat(cell_y)})))"
