# BurnCal frontend quality and performance

Verified 14 November 2026. Frontend only; existing backend, pipeline and scientific contracts were not changed. Local changes were preserved. Nothing was committed or published.

## What changed

Explorer now downloads independently of the map engine. `DeferredExplorer` caches the route module and has explicit loading/error handling. `LazyMapCanvas` reserves map space and catches a failed map-code download, leaving search, calendar and CSV available. Reload is the explicit recovery action for a failed code download. The existing geographic basemap remains the production default.

The measured route delay motivated replacing the Explorer route's Suspense reveal with explicit asynchronous loading. This is an inference from local measurements, not a claim that every React application has the same delay. The map retains its own Suspense fallback and error boundary.

Only Playwright Test was added as a development dependency; no new runtime dependency or animation library. The map chunk remains large and Vite still reports its size warning.

## Browser verification

15 shared journeys passed on desktop 1440×1000 and mobile viewport 390×844: **30 latest passing cases**. They cover:

- Landing route, blank dates, Brazil/Australia hemispheres.
- Applied AOI validation, invalid coordinates, reset and stale-result invalidation.
- Raw/Harmonized values, explicitly supplied zero, omitted month and withheld placeholder values.
- Methodology failure/retry, Escape and focus return.
- Calendar server error, rate limit and malformed payload recovery.
- Independent map request retry without losing the calendar.
- Stub, unknown and real-fixture CSV provenance; blocked downloads are asserted.
- An actual synthetic CSV download and exact leap-February date clipping for map/CSV requests.
- Cancellation, switching to demo and protection from late API responses.
- Calendar keyboard navigation across years, one grid Tab entry, page overflow and playback scroll stability.
- Failed map JavaScript download while calendar/search/export remain usable.

Execution distinction: `e2e/journeys.mjs` was executed through a native browser CUA adapter, using the same exported journeys as `e2e/explorer.spec.mjs`. The Playwright CLI registered all 30 cases with `--list`; Chromium was installed, but the full CLI runner was not launched in this session. The desktop cancellation journey needed one native-focus harness retry; its failed attempt and successful retry remain in the raw results. The latest result for every journey/viewport passed. CUA viewport tests used the system motion preference; the CLI mobile project additionally configures reduced motion.

`npm run check` passed TypeScript, ESLint, **38 unit tests**, and the production build. The fixture build passed. Dependency installation reported zero audit vulnerabilities. Browser testing used deterministic, explicitly marked fixtures, not NASA observations. A separate live check against the existing API verified its placeholder warning and withheld values.

## Re-run locally

```powershell
cd O:\NileSpark\frontend
npm.cmd ci
npm.cmd exec -- playwright install chromium
npm.cmd run check
npm.cmd run test:e2e
```

The runner builds `dist-e2e`, starts its own loopback-only fixture server on 4175, and emits failure traces/screenshots plus `test-results/playwright-results.json`. Port 4175 must be free; `reuseExistingServer` is deliberately false. It does not need the API on 8000 and does not change `.env.local`. See [Playwright webServer documentation](https://playwright.dev/docs/test-webserver).

Fixture responses use synthetic test units, explicit fixture provenance and a visible test banner. The empty local map style tests map lifecycle without depending on remote tiles. It does not verify worldwide tile coverage or scientific accuracy. The live check separately loaded the real default basemap.

## Local performance comparison

Three paired samples per page and viewport, 24 navigations total. Values below are medians, not averages. Builds are production Vite output, served with gzip/no-store over localhost in the same desktop browser context, with no CPU/network throttling. Mobile means viewport size only, not physical mobile hardware. Samples alternate before/after, and width/height and LCP presence were checked before accepting each sample.

| Viewport | Measurement            |    Before |     After |
| -------- | ---------------------- | --------: | --------: |
| desktop  | Home LCP               |  264.0 ms |  260.0 ms |
| desktop  | Explorer LCP           |  448.0 ms |  216.0 ms |
| desktop  | Search controls in DOM |  376.2 ms |  116.9 ms |
| desktop  | Map ready marker       | 1631.0 ms | 1586.2 ms |
| mobile   | Home LCP               |  252.0 ms |  172.0 ms |
| mobile   | Explorer LCP           |  440.0 ms |  184.0 ms |
| mobile   | Search controls in DOM |  382.1 ms |  124.6 ms |
| mobile   | Map ready marker       | 1626.7 ms | 1593.9 ms |

The useful gain is earlier Explorer content and controls. The roughly 1.6-second map-ready marker is similar before/after; this work does not demonstrate faster remote basemap loading. Home results show run-to-run variation. No map engine/worker request appeared in the sampled Home resource records.

LCP records the largest eligible visible content element, and is separate from a DOM-ready marker; see [LCP definition](https://web.dev/articles/lcp). The probe captures initial-load LCP/CLS with buffered observers and takes its snapshot at load + 1.5 seconds. CLS uses session windows, excludes recent user input, and is only the initial observation window, not whole-session field CLS; see [CLS methodology](https://web.dev/articles/cls). After-change maximum sampled initial CLS was 0.001575.

The probe also records navigation timings, resource transfer sizes, long tasks and event durations where available. Event-duration samples are not field INP. No Lighthouse score, field Web Vitals pass, slow-network guarantee or scientific performance claim is made. The injected observer has overhead, browser context/cache are reused, remote tiles may vary, and three samples are a small diagnostic benchmark. There is no API analysis request in these initial-load performance runs.

Production split sizes: entry ~226.3 kB, Explorer shell ~47.6 kB, map module ~1079.1 kB uncompressed; map worker remains separate. The shell can render before the heavy map code.

To reproduce the lab builds (each server in a separate terminal):

```powershell
npm.cmd run build
npm.cmd run perf:baseline
npm.cmd run perf:serve
node e2e/server.mjs --before
```

After: http://127.0.0.1:4176/ and /#/explore. Before: port 4177. `e2e/build-before.mjs` restores the saved pre-optimization App and static MapCanvas import at build time without editing product sources; it is a controlled loading-graph baseline, not a clean Git checkout. Performance servers inject `e2e/performance-probe.js`, absent from the product bundle. Read the hidden `data-testid="performance-ready"` output after each navigation; it contains the JSON snapshot. The raw accepted samples are delivered alongside this report.

## Remaining integration limits

The current API still supplies stubs. Metric/unit, coverage and harmonization must come from the science/API team. Cross-origin real CSV downloads require readable `X-Stub: false` through CORS exposed headers; see `API_INTEGRATION.md`. Current frontend behavior deliberately blocks unknown/placeholder CSVs. Backend implementation, NASA ingestion, deployment, actual mobile hardware and additional browser engines remain outside this verification.
