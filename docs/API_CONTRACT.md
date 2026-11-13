# API contract (BurnCal)

**Owners:** Ali (implement) · Omar (consume) · Abdelrahman (review)

Base URL (local): `http://127.0.0.1:8000`

All JSON responses use this envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

On failure: `success=false`, `data=null`, `error` is a short string, HTTP 4xx/5xx.

## `GET /health`

```json
{ "success": true, "data": { "status": "ok" }, "error": null, "meta": {} }
```

## `POST /api/calendar`

Body:

```json
{
  "aoi": { "bbox": [29.5, 22.0, 33.0, 31.5] },
  "start": "2025-01-01",
  "end": "2025-12-31",
  "include_static": false
}
```

- `aoi.bbox`: `[minLon, minLat, maxLon, maxLat]` (WGS84)
- `aoi.polygon`: GeoJSON Polygon (phase 2; same mutual exclusion as bbox)
- Dates are inclusive ISO `YYYY-MM-DD`

`data`:

```json
{
  "months": [
    {
      "year": 2025,
      "month": 3,
      "value": 120.0,
      "raw_by_sensor": { "modis": 8.0, "viirs": 118.0 },
      "median": 90.0,
      "anomaly": 30.0,
      "anomaly_pct": 33.3
    }
  ],
  "years": [{ "year": 2025, "value": 900.0 }]
}
```

`meta`: `{ "k": 14.2, "baseline_years": [2001, 2024], "method_version": "v1", "country_hint": "Egypt" }`

## `POST /api/hotspots.csv`

Same body as `/api/calendar`. Response: `text/csv` stream with columns matching `hotspots.parquet` (+ `sensor`). Soft row cap in `meta` / header `X-Row-Cap`.

## `GET /api/map`

Query: `min_lon`, `min_lat`, `max_lon`, `max_lat`, `start`, `end`, `include_static=false`

`data.features`: GeoJSON FeatureCollection of cell centroids with `count` property.

## `GET /api/methodology`

`data`: contents of `factors.json` plus `plain_language`.

## CORS

Allow local Vite origins: `http://localhost:5173`, `http://127.0.0.1:5173`.
