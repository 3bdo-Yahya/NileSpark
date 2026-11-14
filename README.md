# BurnCal

NASA Space Apps Cairo 2026 — Team **NileSpark**  
Challenge: *Harmonization of MODIS and VIIRS Hot Spots*

One comparable burning-activity calendar from MODIS + VIIRS FIRMS hotspots.

## Layout

```
api/                 # FastAPI (port 8000)
frontend/            # Omar — Vite React (port 5173)
pipeline/            # Salma + Maryam
data/raw/            # FIRMS CSVs (gitignored bulk)
data/processed/      # pipeline outputs
data/archives/       # original zip downloads (gitignored)
docs/                # API + pipeline contracts
docs/hackathon/      # PDFs / registration notes (local reference)
tests/
```

## Setup

```bash
# API
uv sync --extra dev
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

- API docs: http://127.0.0.1:8000/docs  
- Health: http://127.0.0.1:8000/health  
- UI: http://127.0.0.1:5173  

Opening http://127.0.0.1:8000/ redirects to `/docs`. The product UI is the Vite app, not the API root.

## Data

```bash
# 2025 worldwide: unzip the three FIRMS archives into data/raw/<sensor>/2025/
# History per country (skips files already downloaded):
scripts/fetch_history.sh Egypt modis 2000 2024
scripts/fetch_history.sh Egypt viirs-snpp 2012 2024
scripts/fetch_history.sh Egypt viirs-jpss1 2018 2024

python -m pipeline.build                  # load + harmonize (~2 min); or run the two steps:
python -m pipeline.load                   #   raw CSVs → hotspots.parquet
python -m pipeline.products               #   → celldays, monthly, factors.json, coverage.json
pytest -q
```

DuckDB is capped at 1.5 GB RAM (`BURNCAL_DUCKDB_MEMORY`, `BURNCAL_DUCKDB_THREADS`); a full build stays under 2 GB.

Currently downloaded: worldwide 2025, plus full history (MODIS 2000–, S-NPP 2012–) for Egypt, Brazil and Australia, and NOAA-20 2018– for Egypt. Other countries have 2025 only and borrow the pooled 2012–2017 `k`. Full rebuild: ~2 min, peak 1.7 GB RAM.

## Contracts

- Pipeline → API files: [docs/PIPELINE_OUTPUT.md](docs/PIPELINE_OUTPUT.md)
- Frontend ↔ API: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)

**Checkpoint:** Egypt AOI → calendar → CSV end-to-end before adding more countries.



