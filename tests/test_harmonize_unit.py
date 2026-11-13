"""Unit tests for pure harmonization helpers (Salma extends these)."""

from pipeline.harmonize import compute_k, harmonize_month, month_anomaly, sensor_family, snap_to_cell


def test_snap_to_cell_centers():
    lat, lon = snap_to_cell(27.3792, 30.926)
    assert abs(lat - 27.375) < 1e-9
    assert abs(lon - 30.925) < 1e-9


def test_sensor_family():
    assert sensor_family("modis") == "modis"
    assert sensor_family("viirs-snpp") == "viirs"
    assert sensor_family("viirs-jpss1") == "viirs"


def test_compute_k():
    assert compute_k(10, 150) == 15.0


def test_harmonize_prefers_viirs_after_2012():
    assert harmonize_month(year=2025, raw_modis=10, raw_viirs=140, k=15) == 140.0


def test_harmonize_scales_modis_before_viirs():
    assert harmonize_month(year=2005, raw_modis=10, raw_viirs=None, k=15) == 150.0


def test_month_anomaly_vs_median():
    anomaly, pct = month_anomaly(120, [60, 90, 100])
    assert anomaly == 30.0
    assert abs(pct - 33.3333333) < 0.01
