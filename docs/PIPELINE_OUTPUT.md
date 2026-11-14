# Pipeline output contract (method v2)

**Owners:** Salma + Maryam (`pipeline/load.py`, `pipeline/harmonize.py`, `pipeline/products.py`, AI anomaly layer) · Ali (API consumer via `pipeline/aoi.py`)

The API reads **only** `data/processed/`. Ali should not query parquet directly: call `pipeline.aoi`.

```bash
python -m pipeline.build      # load (~40 s) + products (~80 s), peak 1.7 GB RAM
```

## Method in one paragraph

Fires are counted as **cell-days**: one ~1 km equal-area cell with at least one detection that day. The unit is **S-NPP-equivalent fire cell-days**. Each day uses the best available sensor: S-NPP as-is → NOAA-20 × `k_n20` (S-NPP outage days) → MODIS Terra+Aqua × `k_modis` → Terra-only × `k_terra` (before Aqua, Jul 2002). `k` = ratio of sums over days both sensors observed, preferring **2012–2017** (before Terra/Aqua orbit drift; Egypt's raw ratio falls from ~8 to ~4 by 2025), with a month-block bootstrap 95% CI. Areas shrink toward their country's `k` with a prior worth 50 MODIS cell-days.

## Files

| File | Written by | Read by |
|------|------------|---------|
| `hotspots.parquet` | `load.py` (Maryam) | `products.py`, `aoi.hotspot_rows` |
| `celldays.parquet` | `products.py` | `aoi.calendar_for_bbox`, `aoi.map_cells` |
| `monthly.parquet` | `products.py` | charts / validation (per country) |
| `factors.json` | `products.py` | `/api/methodology`, AOI priors |
| `coverage.json` | `products.py` | AOI sensor availability |

## `hotspots.parquet` — one QC'd FIRMS detection

| Column | Type | Notes |
|--------|------|-------|
| `sensor` | VARCHAR | `modis` \| `viirs-snpp` \| `viirs-jpss1` |
| `satellite` | VARCHAR | `Terra`, `Aqua`, `N`, `N20` — **`Terra`/`Aqua` required** (Terra-only factor) |
| `country` | VARCHAR | From filename (`Egypt`, `American_Samoa`) |
| `acq_date` | DATE | UTC |
| `acq_time` | SMALLINT | HHMM |
| `lat`, `lon` | DOUBLE | |
| `frp` | DOUBLE | MW |
| `conf_norm` | DOUBLE | MODIS conf/100; VIIRS l=0.3, n=0.7, h=1.0 |
| `type` | TINYINT | |
| `daynight` | VARCHAR | `D` \| `N` |
| `brightness` | DOUBLE | MODIS `brightness` / VIIRS `bright_ti4` |

QC already applied: `type == 0`, MODIS `confidence >= 30`, VIIRS `confidence in (n, h)`.

## `celldays.parquet` — one sensor × cell × day (sorted by `cell_y, cell_x`)

| Column | Type | Notes |
|--------|------|-------|
| `sensor` | VARCHAR | per satellite family, not unioned |
| `acq_date` | DATE | |
| `cell_x`, `cell_y` | INTEGER | sinusoidal 1 km grid (`pipeline/grid.py`) |
| `cell_lat`, `cell_lon` | DOUBLE | cell centre |
| `country` | VARCHAR | majority country of the detections |
| `n_detections` | INTEGER | raw pixels merged into this cell-day |
| `frp_sum` | DOUBLE | |
| `has_terra`, `has_aqua` | BOOLEAN | MODIS satellites that saw it |

## `monthly.parquet` — harmonized series per country

`country, year, month, value, value_low, value_high, source, raw_modis, raw_terra, raw_snpp, raw_n20, median, anomaly, anomaly_pct, k_modis, method_version`

- `value` is null when any day of the month has no usable sensor (e.g. data ends mid-month).
- `value_low/high` propagate the `k` 95% CI (equal to `value` for S-NPP months).
- `source` = sensor used on most days: `viirs-snpp`, `viirs-jpss1`, `modis`, `modis-terra`.
- `median` = same calendar month, all other years (needs ≥ 3 years, else null).

## `factors.json`

`method_version, unit, reference_sensor, grid_km, grid_deg, calibration_window, overlap_years, global_k, global_k_early, global{window → factors}, countries{name → factors, per_year_k_modis, validation_modis_loyo, months, first_month}, outage_days, plain_language, built_at`

Each factor: `{k, ci95: [low, high], numerator_celldays, denominator_celldays, n_months, window}`.
`validation_modis_loyo`: leave-one-year-out over 2012–2017 — predict a year's S-NPP total from MODIS × k fitted on the other years (`mape_pct`, per-year `error_pct`). **Salma: chart these two (per-year k, LOYO error).**

## `coverage.json`

`last_day`, `countries{name → {sensor → [years]}}`, `extents{name → [min_lon, min_lat, max_lon, max_lat]}`, `outage_days{sensor → [dates]}`.

Outage days: a VIIRS satellite-day whose fire cells (summed over countries) fall below 0.4 × expected from the other VIIRS satellite, or below 0.1 × expected when only MODIS can be compared (MODIS/VIIRS daily ratios are too noisy for more). A MODIS day is dead when its pooled count is below 5% of the median of the ±30 days around it — this catches exactly the Terra outages (2001-06-16 → 07-03, 2002-03-20 → 28, 2002-04-15). Outage days use the next sensor in priority; before VIIRS there is none, so those months are null ("no data") rather than undercounted.

## Rules

1. Don't rename columns without updating this file and pinging Ali.
2. Writers go through `*.tmp` then rename, so the API never reads a half-written file.




