"""Run the full pipeline: load → harmonize.

Usage:
  python -m pipeline.build            # load + harmonize
  python -m pipeline.products         # harmonize only, from an existing hotspots.parquet
"""

from __future__ import annotations


def main() -> None:
    from pipeline.load import build_hotspots
    from pipeline.products import build_harmonized

    print("Building hotspots.parquet …")
    build_hotspots()
    print("Building celldays / monthly / factors …")
    build_harmonized()
    print("Done. Outputs in data/processed/")


if __name__ == "__main__":
    main()

