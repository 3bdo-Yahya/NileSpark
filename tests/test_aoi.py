"""AOI queries against a tiny synthetic product set (VIIRS sees exactly 8x MODIS)."""

import json
from datetime import date

import duckdb
import pytest

from pipeline.aoi import Products, ProductsMissing, calendar_for_bbox, hotspot_rows, map_cells

BBOX = (10.0, 10.0, 11.0, 11.0)


@pytest.fixture(scope="module")
def products(tmp_path_factory) -> Products:
    root = tmp_path_factory.mktemp("products")
    con = duckdb.connect()
    con.execute(
        """CREATE TABLE celldays (sensor VARCHAR, acq_date DATE, cell_x INTEGER, cell_y INTEGER,
           cell_lat DOUBLE, cell_lon DOUBLE, country VARCHAR, n_detections INTEGER, frp_sum DOUBLE,
           has_terra BOOLEAN, has_aqua BOOLEAN)"""
    )
    con.execute(
        """CREATE TABLE hotspots (sensor VARCHAR, satellite VARCHAR, country VARCHAR, acq_date DATE,
           acq_time SMALLINT, lat DOUBLE, lon DOUBLE, frp DOUBLE, conf_norm DOUBLE, type TINYINT,
           daynight VARCHAR, brightness DOUBLE)"""
    )
    cells, spots = [], []
    for year in range(2010, 2014):
        for month in range(1, 13):
            d = date(year, month, 1)
            for i in range(2):
                cells.append(("modis", d, i, 0, 10.5, 10.1 + i * 0.1, "Testland", 1, 5.0, True, False))
            if year >= 2012:
                for i in range(16):
                    cells.append(("viirs-snpp", d, i, 1, 10.6, 10.05 + i * 0.05, "Testland", 2, 3.0, False, False))
                    spots.append(("viirs-snpp", "N", "Testland", d, 1300, 10.6, 10.05 + i * 0.05, 3.0, 0.7, 0, "D", 330.0))
    cells.append(("viirs-snpp", date(2013, 6, 1), 0, 2, 10.8, 10.98, "Smallland", 1, 1.0, False, False))
    con.executemany("INSERT INTO celldays VALUES (" + ",".join("?" * 11) + ")", cells)
    con.executemany("INSERT INTO hotspots VALUES (" + ",".join("?" * 12) + ")", spots)
    con.execute(f"COPY celldays TO '{root / 'celldays.parquet'}' (FORMAT parquet)")
    con.execute(f"COPY hotspots TO '{root / 'hotspots.parquet'}' (FORMAT parquet)")
    early = {"k": 8.0, "ci95": [7.0, 9.0], "window": "2012-2017"}
    ratio = {"modis": early, "terra": early, "n20": {"k": 1.0, "ci95": [1.0, 1.0], "window": "all-overlap"}}
    (root / "factors.json").write_text(
        json.dumps({"global": {"2012-2017": ratio, "all-overlap": ratio}, "countries": {"Testland": {"factors": ratio}}})
    )
    (root / "coverage.json").write_text(
        json.dumps(
            {
                "last_day": "2013-12-31",
                "countries": {
                    "Testland": {"modis": [2010, 2011, 2012, 2013], "viirs-snpp": [2012, 2013]},
                    "Smallland": {"viirs-snpp": [2013]},
                },
                "extents": {"Testland": [10.0, 10.0, 11.0, 11.0], "Smallland": [10.97, 10.75, 11.0, 10.85]},
                "outage_days": {},
            }
        )
    )
    return Products(
        celldays=root / "celldays.parquet",
        hotspots=root / "hotspots.parquet",
        factors=root / "factors.json",
        coverage=root / "coverage.json",
    )


def test_calendar_is_continuous_across_modis_to_viirs(products):
    data, meta = calendar_for_bbox(BBOX, date(2010, 1, 1), date(2013, 12, 31), products)
    values = {(m["year"], m["month"]): m["value"] for m in data["months"]}
    assert len(values) == 48
    assert values[(2010, 1)] == pytest.approx(16.0)
    assert values[(2013, 12)] == pytest.approx(16.0)
    assert values[(2013, 6)] == pytest.approx(16.0), "minor neighbour country must not leak in"
    assert meta["k"] == pytest.approx(8.0)
    assert meta["k_window"] == "2012-2017"
    assert meta["k_ci95"][0] < 8.0 < meta["k_ci95"][1]
    assert meta["stub"] is False
    assert meta["countries"] == ["Testland"]


def test_calendar_contract_fields(products):
    data, meta = calendar_for_bbox(BBOX, date(2013, 3, 1), date(2013, 4, 30), products)
    assert [(m["year"], m["month"]) for m in data["months"]] == [(2013, 3), (2013, 4)]
    month = data["months"][0]
    assert set(month) >= {"year", "month", "value", "median", "anomaly", "anomaly_pct", "raw_by_sensor"}
    assert month["raw_by_sensor"]["viirs"] == 16
    assert month["raw_by_sensor"]["modis"] == 2
    assert month["raw_by_sensor"]["viirs_noaa20"] is None
    assert month["median"] == pytest.approx(16.0)
    assert month["anomaly"] == pytest.approx(0.0)
    assert meta["baseline_years"] == [2010, 2011, 2012]
    assert {"unit", "method_version", "anomaly_basis"} <= set(meta)
    assert data["years"] == [{"year": 2013, "value": 32.0, "months": 2}]


def test_pre_viirs_months_report_no_raw_viirs(products):
    data, _ = calendar_for_bbox(BBOX, date(2010, 6, 1), date(2010, 6, 30), products)
    [june] = data["months"]
    assert june["raw_by_sensor"]["viirs"] is None
    assert june["source"] == "modis"


def test_empty_area_inside_country_extent_returns_zeros(products):
    data, meta = calendar_for_bbox((10.9, 10.9, 10.95, 10.95), date(2013, 1, 1), date(2013, 1, 31), products)
    assert data["months"][0]["value"] == 0
    assert meta["countries"] == ["Testland"]


def test_map_cells_geojson(products):
    fc, meta = map_cells(BBOX, date(2013, 1, 1), date(2013, 12, 31), products=products)
    assert fc["type"] == "FeatureCollection"
    assert meta["sensor_family"] == "viirs"
    assert len(fc["features"]) == 17, "map shows every fire cell, including minor neighbours"
    assert fc["features"][0]["properties"]["count"] == 12


def test_map_cells_falls_back_to_modis_before_viirs(products):
    fc, meta = map_cells(BBOX, date(2010, 1, 1), date(2010, 12, 31), limit=1, products=products)
    assert meta["sensor_family"] == "modis"
    assert meta["truncated"] is True
    assert len(fc["features"]) == 1


def test_hotspot_rows_cap(products):
    cols, rows, truncated = hotspot_rows(BBOX, date(2013, 1, 1), date(2013, 1, 31), cap=5, products=products)
    assert cols[0] == "sensor"
    assert len(rows) == 5 and truncated


def test_missing_products_raise(tmp_path):
    with pytest.raises(ProductsMissing):
        calendar_for_bbox(BBOX, date(2013, 1, 1), date(2013, 1, 31), Products(celldays=tmp_path / "nope.parquet"))


@pytest.mark.parametrize(
    "bbox, start, end",
    [
        ((float("nan"), 0, 1, 1), date(2013, 1, 1), date(2013, 2, 1)),
        ((5, 0, 1, 1), date(2013, 1, 1), date(2013, 2, 1)),
        ((0, -91, 1, 1), date(2013, 1, 1), date(2013, 2, 1)),
        (BBOX, date(2013, 2, 1), date(2013, 1, 1)),
        (BBOX, "2013-01-01", date(2013, 1, 1)),
    ],
)
@pytest.mark.parametrize("query", [calendar_for_bbox, map_cells, hotspot_rows])
def test_invalid_inputs_rejected(products, query, bbox, start, end):
    with pytest.raises(ValueError):
        query(bbox, start, end, products=products)









