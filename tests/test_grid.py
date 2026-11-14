import duckdb
import pytest

from pipeline.grid import (
    cell_center,
    cell_of,
    sql_cell_x,
    sql_cell_y,
    sql_center_lat,
    sql_center_lon,
)


@pytest.mark.parametrize("lat,lon", [(27.3792, 30.926), (-12.5, -53.1), (-28.0, 146.2), (0.0, 0.0)])
def test_center_maps_back_to_same_cell(lat, lon):
    cx, cy = cell_of(lat, lon)
    assert cell_of(*cell_center(cx, cy)) == (cx, cy)


def test_cells_are_about_one_km():
    a = cell_of(27.0, 31.0)
    assert cell_of(27.0, 31.0 + 0.02) != a
    lat, lon = cell_center(*a)
    assert cell_of(lat + 0.003, lon) == a


def test_sql_matches_python():
    points = [(27.3792, 30.926), (-12.5, -53.1), (-28.0, 146.2), (51.2, -0.1)]
    con = duckdb.connect()
    rows = con.sql(
        f"""
        WITH p(lat, lon) AS (VALUES {", ".join(f"({a}, {b})" for a, b in points)}),
        y AS (SELECT lat, lon, {sql_cell_y()} AS cell_y FROM p)
        SELECT {sql_cell_x()} AS cell_x, cell_y, {sql_center_lat()}, {sql_center_lon()} FROM y
        """
    ).fetchall()
    for (lat, lon), (cx, cy, clat, clon) in zip(points, rows):
        assert (cx, cy) == cell_of(lat, lon)
        assert cell_center(cx, cy) == pytest.approx((clat, clon))
