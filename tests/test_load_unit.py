"""build_hotspots on tiny FIRMS-shaped CSVs: QC, normalization, country from filename."""

from datetime import date

import duckdb
import pytest

from pipeline.load import HOTSPOT_COLUMNS, build_hotspots

MODIS_HEADER = "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type"
VIIRS_HEADER = "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight,type"


def _write(path, header, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join([header, *rows]) + "\n")


@pytest.fixture()
def raw_dirs(tmp_path):
    dirs = {s: tmp_path / "raw" / s for s in ("modis", "viirs-snpp", "viirs-jpss1")}
    _write(
        dirs["modis"] / "2025" / "modis_2025_Egypt.csv",
        MODIS_HEADER,
        [
            "27.3,30.9,309.8,1.0,1.0,2025-01-06,1207,Aqua,MODIS,54,6.1NRT,290.1,7.5,D,0",
            "27.3,30.9,300.0,1.0,1.0,2025-01-06,1207,Aqua,MODIS,20,6.1NRT,290.1,1.0,D,0",
            "29.1,31.2,330.0,1.0,1.0,2025-01-07,0830,Terra,MODIS,90,6.1NRT,295.0,20.0,D,2",
        ],
    )
    _write(
        dirs["viirs-snpp"] / "2024" / "viirs-snpp_2024_American_Samoa.csv",
        VIIRS_HEADER,
        [
            "-14.3,-170.7,331.0,0.4,0.4,2024-03-01,0012,N,VIIRS,n,2,290.0,3.0,N,0",
            "-14.3,-170.7,320.0,0.4,0.4,2024-03-01,0012,N,VIIRS,l,2,290.0,1.0,N,0",
            "-14.3,-170.7,340.0,0.4,0.4,2024-03-02,1300,N,VIIRS,h,2,290.0,9.0,D,3",
        ],
    )
    return dirs


def test_build_hotspots_applies_qc_and_normalizes(raw_dirs, tmp_path):
    target = build_hotspots(raw_dirs, tmp_path / "hotspots.parquet")
    rel = duckdb.sql(f"SELECT * FROM '{target}' ORDER BY sensor")
    assert tuple(rel.columns) == HOTSPOT_COLUMNS
    modis, viirs = rel.fetchall()
    assert modis == ("modis", "Aqua", "Egypt", date(2025, 1, 6), 1207, 27.3, 30.9, 7.5, 0.54, 0, "D", 309.8)
    assert viirs == ("viirs-snpp", "N", "American_Samoa", date(2024, 3, 1), 12, -14.3, -170.7, 3.0, 0.7, 0, "N", 331.0)
    assert not list(tmp_path.glob("*.tmp"))


def test_build_hotspots_without_csvs_fails_clearly(tmp_path):
    empty = {"modis": tmp_path / "nothing"}
    with pytest.raises(FileNotFoundError, match="FIRMS"):
        build_hotspots(empty, tmp_path / "hotspots.parquet")
