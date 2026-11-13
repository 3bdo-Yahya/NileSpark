"""Download FIRMS country-year CSVs into data/raw/.

Owner: Maryam. Verify the FIRMS archive base URL before bulk download.
Stub only — fill in the real URL and country list.
"""

from __future__ import annotations

# TODO(Maryam): confirm base URL against FIRMS country archive.
FIRMS_COUNTRY_BASE = "https://firms.modaps.eosdis.nasa.gov/data/country"

DEMO_COUNTRIES = ("Egypt", "Sudan", "Nigeria", "Brazil")

# Inclusive year ranges by sensor family.
YEAR_RANGES = {
    "modis": range(2000, 2026),
    "viirs-snpp": range(2012, 2026),
    "viirs-jpss1": range(2018, 2026),
}


def target_path(sensor: str, year: int, country: str):
    """Return local path for a country-year CSV (does not download)."""
    from pipeline.paths import SENSOR_DIRS

    safe = country.replace(" ", "_")
    return SENSOR_DIRS[sensor] / str(year) / f"{sensor}_{year}_{safe}.csv"


def main() -> None:
    raise NotImplementedError(
        "Maryam: implement download into data/raw/{sensor}/{year}/ "
        "for DEMO_COUNTRIES using YEAR_RANGES. Skip files that already exist."
    )


if __name__ == "__main__":
    main()
