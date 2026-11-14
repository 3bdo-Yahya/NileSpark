"""End-to-end: synthetic hotspots.parquet -> build_harmonized -> calendar_for_bbox."""

import json
from datetime import date

import duckdb
import pytest

from pipeline.aoi import calendar_for_bbox
from pipeline.grid import cell_center, cell_of
from pipeline.paths import Products
from pipeline.products import build_harmonized


@pytest.fixture(scope="module")
def built(tmp_path_factory) -> tuple[Products, dict]:
    root = tmp_path_factory.mktemp("build")
    p = Products.under(root)
    con = duckdb.connect()
    con.execute(
        """CREATE TABLE h (sensor VARCHAR, satellite VARCHAR, country VARCHAR, acq_date DATE,
           acq_time SMALLINT, lat DOUBLE, lon DOUBLE, frp DOUBLE, conf_norm DOUBLE, type TINYINT,
           daynight VARCHAR, brightness DOUBLE)"""
    )
    rows = []
    for year in range(2010, 2014):
        for month in range(1, 13):
            for day in (1, 15):
                d = date(year, month, day)
                for i in range(2):
                    rows.append(("modis", "Terra", "Testland", d, 1030, 10.5, 10.1 + i * 0.1, 5.0, 0.8, 0, "D", 320.0))
                if year >= 2012:
                    for i in range(16):
                        lat, lon = cell_center(*cell_of(10.6, 10.05 + i * 0.05))
                        rows.append(("viirs-snpp", "N", "Testland", d, 1330, lat, lon, 3.0, 0.7, 0, "D", 330.0))
                        rows.append(("viirs-snpp", "N", "Testland", d, 1330, lat + 0.001, lon + 0.001, 2.0, 0.7, 0, "D", 331.0))
    con.executemany("INSERT INTO h VALUES (" + ",".join("?" * 12) + ")", rows)
    con.execute(f"COPY h TO '{p.hotspots}' (FORMAT parquet)")
    report = build_harmonized(p)
    return p, report


def test_outputs_written(built):
    p, _ = built
    for path in (p.celldays, p.monthly, p.factors, p.coverage):
        assert path.exists(), path.name


def test_cell_day_dedupes_neighbouring_viirs_pixels(built):
    p, _ = built
    [(n_cells, n_det)] = duckdb.sql(
        f"SELECT count(*), sum(n_detections) FROM '{p.celldays}' WHERE sensor='viirs-snpp' AND acq_date = DATE '2012-01-15'"
    ).fetchall()
    assert (n_cells, n_det) == (16, 32)


def test_country_factor_matches_construction(built):
    _, report = built
    k = report["countries"]["Testland"]["factors"]["modis"]
    assert k["k"] == pytest.approx(8.0, rel=0.02)
    assert report["global_k"] == pytest.approx(8.0, rel=0.02)
    assert report["countries"]["Testland"]["per_year_k_modis"] == {2012: 8.0, 2013: 8.0}


def test_monthly_series_continuous(built):
    p, _ = built
    values = duckdb.sql(
        f"SELECT DISTINCT round(value, 1) FROM '{p.monthly}' WHERE country='Testland' AND value IS NOT NULL"
    ).fetchall()
    assert values == [(32.0,)]


def test_coverage_json(built):
    p, _ = built
    cov = json.loads(p.coverage.read_text())
    assert cov["last_day"] == "2013-12-15"
    assert cov["countries"]["Testland"]["viirs-snpp"] == [2012, 2013]


def test_end_to_end_calendar(built):
    p, _ = built
    data, meta = calendar_for_bbox((10.0, 10.0, 11.5, 11.0), date(2011, 1, 1), date(2012, 12, 31), p)
    jan_2011 = data["months"][0]
    assert jan_2011["value"] == pytest.approx(32.0, rel=0.02)
    assert jan_2011["source"] == "modis"
    assert meta["countries"] == ["Testland"]


