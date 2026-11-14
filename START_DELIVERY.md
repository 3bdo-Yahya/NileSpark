# BurnCal Egypt delivery

Extract the entire archive into one directory. Use Python 3.11+ with uv installed. From the directory containing pyproject.toml run:

```powershell
uv sync --frozen
uv run uvicorn release:app --host 127.0.0.1 --port 8080
```

Open http://127.0.0.1:8080/#/explore . The archive includes the built frontend and the five processed Egypt data files. The website and API share one origin. The geographic basemap needs internet access. On a source-only checkout, build the frontend with npm ci and npm run build in frontend, and supply the processed data before starting.

Select Egypt (Upper Egypt bounding box), leave 2025 selected and load the API calendar. Select December, switch to Harmonized, then open the anomaly view and download the month CSV. The monthly series counts fire cell-days, map counts are distinct fire days per cell, and the CSV contains QC-passed individual detections. The map chooses VIIRS when present, otherwise MODIS. Calendar includes overlapping whole months. Map and CSV use the exact dates.

Inputs are NASA FIRMS Egypt country files for MODIS (2000–2025), S-NPP (2012–2025) and NOAA-20 (2018–2025). Team pipeline version v2 performs filtering, spatial aggregation, calibration and historical comparison. Egypt is the included geographic coverage. Other regions require corresponding processed data. See docs/API_CONTRACT.md and docs/PIPELINE_OUTPUT.md for the current method and data interface.
