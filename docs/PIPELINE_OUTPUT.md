# Pipeline output contract

**Owners:** Salma + Maryam (pipeline) · Ali (API consumer) · Abdelrahman (schema owner)

The pipeline writes files under `data/processed/`. The API reads **only** these files — never raw CSVs.

## Paths

| File | Format | Written by | Read by |
|------|--------|------------|---------|
| `data/processed/hotspots.parquet` | Parquet | Maryam (`load`) | Ali (`/hotspots.csv`, map) |
| `data/processed/celldays.parquet` | Parquet | Salma (`harmonize`) | Ali (`/calendar`, `/map`) |
| `data/processed/monthly.parquet` | Parquet | Salma (`harmonize`) | Ali (`/calendar`) |
| `data/processed/factors.json` | JSON | Salma | Ali (`/methodology`, calendar meta) |

## `hotspots.parquet` (one row = one FIRMS detection after QC)

| Column | Type | Notes |
|--------|------|-------|
| `sensor` | string | `modis` \| `viirs-snpp` \| `viirs-jpss1` |
| `satellite` | string | Terra, Aqua, N, N20, … |
| `country` | string | From filename (`Egypt`) |
| `acq_date` | date | UTC |
| `acq_time` | int16 | HHMM as integer (e.g. 1207) |
| `lat` | float64 | |
| `lon` | float64 | |
| `frp` | float64 | MW; may be null |
| `conf_norm` | float64 | 0–1. MODIS: conf/100. VIIRS: l=0.3, n=0.7, h=1.0 |
| `type` | int8 | Prefer 0 only in default QC |
| `daynight` | string | `D` \| `N` |
| `brightness` | float64 | MODIS brightness or VIIRS bright_ti4 |

Default QC before write: `type == 0`, MODIS `confidence >= 30`, VIIRS `confidence in {n,h}`.

## `celldays.parquet` (one row = one fire cell-day)

| Column | Type | Notes |
|--------|------|-------|
| `sensor_family` | string | `modis` \| `viirs` (S-NPP + NOAA-20 unioned) |
| `country` | string | |
| `acq_date` | date | |
| `cell_lat` | float64 | Floor to 0.01° then +0.005 |
| `cell_lon` | float64 | Floor to 0.01° then +0.005 |
| `n_detections` | int32 | Raw hits inside the cell that day |
| `frp_sum` | float64 | |

## `monthly.parquet` (harmonized series the calendar uses)

| Column | Type | Notes |
|--------|------|-------|
| `country` | string | Empty string `""` = multi-country / global grid slice (optional) |
| `year` | int16 | |
| `month` | int8 | 1–12 |
| `value` | float64 | Harmonized fire cell-day count |
| `raw_modis` | float64 | Pre-harmonization MODIS cell-days (nullable) |
| `raw_viirs` | float64 | Pre-harmonization VIIRS cell-days (nullable) |
| `k` | float64 | Factor applied for this row's country |
| `method_version` | string | e.g. `v1` |

## `factors.json`

```json
{
  "method_version": "v1",
  "grid_deg": 0.01,
  "overlap_years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
  "global_k": 12.5,
  "countries": {
    "Egypt": { "k": 14.2, "n_overlap_months": 24, "notes": "" }
  },
  "plain_language": "We count fires as ~1 km cell-days, then scale older MODIS counts by k so they match VIIRS sensitivity."
}
```

## Rules

1. Do **not** change column names without updating this file and pinging Ali.
2. Always overwrite atomically (write `*.tmp` then rename) so the API never reads a half-written file.
3. Egypt must work first; other countries are optional until the morning checkpoint.
