# API contract (BurnCal)

**Owners:** Ali (implement) · Omar (consume) · Abdelrahman (review)

Base URL (local): `http://127.0.0.1:8000`

All JSON responses use this envelope:

```json
{ "success": true, "data": {}, "error": null, "meta": {} }
```

On failure: `success=false`, `data=null`, `error` is a short string, HTTP 4xx/5xx.
`pipeline.aoi` raises `ValueError` for a bad bbox or date range (→ **400**, safe to show) and `ProductsMissing` when outputs aren't built (→ **503**). Log anything else and return a generic 500.

## Backend wiring (Ali)

Each endpoint is one call into `pipeline/aoi.py`; the harmonization lives there, not in the API.

```python
from pipeline.aoi import ProductsMissing, calendar_for_bbox, hotspot_rows, map_cells

data, meta = calendar_for_bbox(tuple(body.aoi.bbox), body.start, body.end)   # /api/calendar
fc, meta = map_cells((min_lon, min_lat, max_lon, max_lat), start, end)       # /api/map
columns, rows, truncated = hotspot_rows(bbox, start, end)                    # /api/hotspots.csv
```

Methodology: return `factors.json` minus the bulky `countries` map (or keep only the requested country).

## `GET /health`

```json
{ "success": true, "data": { "status": "ok" }, "error": null, "meta": {} }
```

## `POST /api/calendar`

Body:

```json
{
  "aoi": { "bbox": [31, 24, 33, 26] },
  "start": "2000-01-01",
  "end": "2025-12-31",
  "include_static": false
}
```

- `aoi.bbox`: `[minLon, minLat, maxLon, maxLat]` (WGS84). `aoi.polygon` is phase 2.
- Dates inclusive; months are returned when they overlap the range.
- `include_static` is accepted but ignored: hotspots are vegetation fires only (`type = 0`).

`data`:

```json
{
  "months": [
    {
      "year": 2025, "month": 12,
      "value": 13.0, "value_low": 13.0, "value_high": 13.0,
      "source": "viirs-snpp",
      "raw_by_sensor": { "modis": 0, "viirs": 13, "viirs_noaa20": 2, "modis_terra": 0 },
      "median": 7.0, "anomaly": 6.0, "anomaly_pct": 86.3
    }
  ],
  "years": [{ "year": 2025, "value": 395.0, "months": 12 }]
}
```

- `value`: S-NPP-equivalent fire cell-days. Null when any day of the month has no usable sensor.
- `value_low/high`: 95% band from the `k` uncertainty (only differs in MODIS-era months).
- `source`: `viirs-snpp` | `viirs-jpss1` | `modis` | `modis-terra`.
- `raw_by_sensor.*`: raw cell-days per sensor, `null` when that sensor didn't cover the month.
- `median/anomaly`: null when fewer than 3 other years exist. `anomaly_pct` is also null when the median is 0.
- Only the bbox's main countries (≥ 5% of its fire cell-days) are counted, so a neighbour with a shorter record can't create a false jump; they're listed in `meta.countries`. The map shows every cell.
- `years[].value` sums the months inside the requested range; `years[].months` says how many (12 = full year).

`meta`:

```json
{
  "stub": false, "method_version": "v2",
  "unit": "S-NPP-equivalent fire cell-days (1 km equal-area grid)",
  "reference_sensor": "viirs-snpp",
  "k": 5.95, "k_ci95": [5.3, 6.7], "k_window": "2012-2017",
  "factors": { "modis": {}, "terra": {}, "n20": {} },
  "baseline_years": [2000, 2001, 2024, 2025],
  "anomaly_basis": "median of the same calendar month in all other years of the record",
  "countries": ["Egypt"],
  "record": { "first": "2000-11", "last": "2025-12" },
  "include_static": false
}
```

Typical latency: ~0.1 s per request on the full dataset.

## `POST /api/hotspots.csv`

Same body. `text/csv` with columns `sensor, satellite, country, acq_date, acq_time, lat, lon, frp, conf_norm, type, daynight, brightness`. Cap 100 000 rows; set header `X-Row-Cap` and `X-Truncated: true|false`.

## `GET /api/map`

Query: `min_lon`, `min_lat`, `max_lon`, `max_lat`, `start`, `end`, `include_static=false`

`data`: GeoJSON FeatureCollection of cell centres, `properties: { count, frp }` where `count` = fire days in the cell. `meta: { sensor_family: "viirs" | "modis", truncated, limit }` (top 5000 cells).

## `GET /api/methodology`

`data`: `method_version, unit, grid_km, grid_deg, calibration_window, overlap_years, global_k, global_k_all_overlap, global, outage_days, plain_language`. `global_k` is the pooled 2012–2017 MODIS factor (the one applied to history).

## CORS

Allow local Vite origins: `http://localhost:5173`, `http://127.0.0.1:5173`.



