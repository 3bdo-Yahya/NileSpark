"""Run the full pipeline: load → harmonize.

Usage (after Salma/Maryam implement stubs):
  python -m pipeline.build
"""

from __future__ import annotations


def main() -> None:
    from pipeline.harmonize import build_harmonized
    from pipeline.load import build_hotspots

    print("Building hotspots.parquet …")
    build_hotspots()
    print("Building celldays / monthly / factors …")
    build_harmonized()
    print("Done. Outputs in data/processed/")


if __name__ == "__main__":
    main()
