# BurnCal · NileSpark frontend

React + TypeScript + Vite + Tailwind CSS v4. Cinematic Earth landing, geographic Explorer and reusable UI foundations.

## التشغيل

Node.js 22.13+ from branch 22, or 24+, and npm 10+.

```powershell
cd O:\NileSpark\frontend
npm.cmd ci
npm.cmd run dev
```

Website: http://127.0.0.1:5173. Start the existing API separately from the repository root, as described in the root README.

```powershell
npm.cmd run check
npm.cmd run format:check
```

Check runs TypeScript, ESLint, 41 tests and the production build.

## الاتصال بالبيانات

Explorer defaults to API server mode. Calendar, selected-month map, methodology and CSV requests are connected to the existing endpoints. Set VITE_API_BASE_URL through .env.local if needed; see .env.example. It is public configuration, never a secret.

Data connection → Synthetic demo runs the original fixture without an API. Generated records are clearly labeled and never substituted automatically when the server fails.

The current API returns placeholders. The frontend explicitly shows API placeholder and withholds its zero values. Placeholder CSVs are not downloaded. Raw and Harmonized views are wired to the response model; this does not mean scientific harmonization is complete.

## الوظائف

- AOI rectangle by two corners, manual keyboard bounds and Reset.
- Inclusive UTC dates: up to 120 months in API mode; fixture limited to 2022–2025.
- Raw MODIS/VIIRS family calendar or the API-reported harmonized series.
- Selected-month map cell centroids and CSV clipped to the applied dates, all sensors, static detections excluded.
- Source/methodology dialog fetched from the server, with loading/error/retry.
- Request cancellation, timeout, readable errors, independent map retry and preserved inputs.
- Responsive layout, local fonts, visible focus, reduced motion and UI gallery at #/foundations.

A dash means no supplied value, not zero. No scientific unit or color scale is assumed. Map and CSV have no sensor filter in the current contract. CSV requires readable X-Stub provenance headers; see docs/API_INTEGRATION.md for backend handoff details.

## التنظيم والأداء

app → features → shared UI. src/lib/api owns HTTP, services/apiAnalysis converts wire data, model/presentation selects display values, and hooks orchestrate requests and cancellation. No backend code is changed.

Explorer and its map worker load on demand; fonts and WebP art are local. The map bundle still triggers Vite's size warning. A local before/after benchmark and browser verification are recorded in docs/E2E_AND_PERFORMANCE.md; no Lighthouse or field Web Vitals pass is claimed.

See docs/ARCHITECTURE.md, docs/API_INTEGRATION.md, docs/VERIFICATION.md and docs/ATTRIBUTION.md.

Latest UI regression fixes: docs/BUGFIX_VERIFICATION.md.

## Browser regression tests

```powershell
npm.cmd exec -- playwright install chromium
npm.cmd run test:e2e
```

16 shared journeys × two Chromium viewport projects. The test server uses marked synthetic fixtures on loopback port 4175; no backend is needed. See [E2E and performance verification](docs/E2E_AND_PERFORMANCE.md) for actual execution evidence, limitations and benchmark reproduction.

Anomaly UI and pending science/API decisions: [Anomaly handoff](docs/ANOMALY_HANDOFF.md).
