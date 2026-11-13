# Frontend architecture

Dependency direction: app → features → shared UI. Shared controls do not import domain features, maps or HTTP.

```text
src/
  app/                         routes, Home, route boundary
  components/ui/               typed UI primitives
  lib/api/
    client.ts                  HTTP/envelopes, timeout, cancellation, errors
    config.ts                  public VITE_API_BASE_URL configuration
  features/explorer/
    Explorer.tsx               composition and connection controls
    useExplorer.ts             query/calendar/export state and cancellation
    useApiMap.ts               independently cancellable monthly map request
    components/                controls, map, calendar, details, methodology dialog
    model/                     typed model, validation, raw/harmonized projection
    services/apiAnalysis.ts    wire decoding and clipped month requests
    services/demoAnalysis.ts   isolated synthetic fixture
    services/exportCsv.ts      browser download helper and demo CSV
  features/method/             demo limitations dialog
  features/foundations/        design-system gallery
  styles/                      Tailwind tokens, fonts, shared styles
```

## Data boundaries

API and synthetic results are distinct types with provenance. The HTTP client is injectable for tests and has no Vite dependency. The wire adapter validates envelopes, dates, month uniqueness, numbers and GeoJSON cell centroids. API placeholders cannot become observed zeros. Missing months and raw sensor keys remain null. No synthetic fallback is performed on network failure.

Calendar display projects raw_by_sensor for the selected API sensor or the reported harmonized value. API map and CSV are all-sensor endpoints; the raw calendar selector does not alter their meaning. Both use the same inclusive, month-clipped date helper. Demo-specific NOAA-20 labels do not leak into API family labels.

Query changes abort work and clear stale values. Request identity guards calendar/export responses; map state is keyed by result, month and retry attempt so older layers cannot flash under new inputs. Map failure has independent retry and does not erase a successful calendar. Methodology loads on dialog open and aborts when it closes.

Model/service modules have no React imports. MapCanvas exclusively owns MapLibre, sources, layers, popups, resize and cleanup. Synthetic detections and API cell counts are separate layers. No extra global store or dependency-injection framework is needed.

## Performance and limits

Home is the entry route. DeferredExplorer loads and caches the Explorer route with explicit loading/error handling. LazyMapCanvas then loads MapLibre independently, reserving layout space and containing failed map-code downloads. Its worker remains separate. GeoJSON WebGL rendering avoids one DOM element per point. Resize refits the AOI and changing selected data closes popups. All observers, timers, requests and map instances are cleaned up.

Manual edits must be applied. Longitude ±180° and latitude ±85°, west < east, south < north; dateline crossing is unsupported. API requests are limited to 120 months by the UI. Slower API playback leaves headroom under the existing per-endpoint rate limit.

Tailwind is the primary style system; small unlayered CSS handles MapLibre integration. Local fonts and responsive WebP art remain unchanged. The substantial map chunk still triggers a Vite warning; see VERIFICATION.md. A small local loading-graph comparison is documented in E2E_AND_PERFORMANCE.md; it is not a field Web Vitals pass.

The minimatch override pins patched 11.0.1 for GHSA-g3hv-75wg-m249 and is checked by lint. Backend/scientific decisions and the CSV header handoff are recorded in API_INTEGRATION.md.
