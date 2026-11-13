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

## Contracts

- Pipeline → API files: [docs/PIPELINE_OUTPUT.md](docs/PIPELINE_OUTPUT.md)
- Frontend ↔ API: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)

**Checkpoint:** Egypt AOI → calendar → CSV end-to-end before adding more countries.
