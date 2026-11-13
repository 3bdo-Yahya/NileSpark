"""Unit tests for load/normalize helpers (Maryam extends these)."""

from pathlib import Path

from pipeline.load import (
    country_from_filename,
    normalize_modis_row,
    normalize_viirs_row,
    passes_default_qc,
)


def test_country_from_filename():
    assert country_from_filename(Path("modis_2025_Egypt.csv")) == "Egypt"
    assert country_from_filename(Path("viirs-snpp_2025_American_Samoa.csv")) == "American_Samoa"


def test_normalize_modis_and_qc():
    row = normalize_modis_row(
        {
            "latitude": "27.3",
            "longitude": "30.9",
            "acq_date": "2025-01-06",
            "acq_time": "1207",
            "satellite": "Aqua",
            "confidence": "54",
            "frp": "7.5",
            "daynight": "D",
            "type": "0",
            "brightness": "309.8",
        },
        "Egypt",
    )
    assert row["sensor"] == "modis"
    assert row["conf_norm"] == 0.54
    assert passes_default_qc(row)


def test_qc_drops_gas_flare_and_low_conf():
    flare = normalize_viirs_row(
        {
            "latitude": "31.1",
            "longitude": "29.8",
            "acq_date": "2025-01-01",
            "acq_time": "0012",
            "satellite": "N20",
            "confidence": "n",
            "frp": "0.3",
            "daynight": "N",
            "type": "2",
            "bright_ti4": "295",
        },
        "Egypt",
        "viirs-jpss1",
    )
    assert not passes_default_qc(flare)

    low = normalize_modis_row(
        {
            "latitude": "27.3",
            "longitude": "30.9",
            "acq_date": "2025-01-06",
            "acq_time": "1207",
            "satellite": "Aqua",
            "confidence": "20",
            "frp": "1",
            "daynight": "D",
            "type": "0",
            "brightness": "300",
        },
        "Egypt",
    )
    assert not passes_default_qc(low)
