# Frontend architecture

Dependency direction: app → features → shared UI. Shared controls do not import domain features, maps or HTTP.

```text
src/
  app/                       hash routes, Home, route boundary
  components/ui/             Button, Dialog, Badge, Surface, TextField
  features/
    explorer/
      Explorer.tsx           view composition
      useExplorer.ts         state/request orchestration
      components/            controls, map, calendar, details
      model/                 typed model, bounds/date validation
      services/              synthetic adapter, CSV export
    method/                  science limitations dialog
    foundations/             design-system gallery
  styles/                    Tailwind v4 tokens, fonts, shared styles
public/
  images/                    responsive concept artwork
  licenses/                  fonts, icons, map notices
```

## Boundaries and state

Keep map/calendar/analysis in one implemented feature. No empty layers, dependency injection or global store are needed. Model/services have no React imports. Components accept typed values and callbacks. MapCanvas owns MapLibre, layers, popups, resize and cleanup.

The synthetic adapter accepts AbortSignal. The hook aborts on query changes, cancel and unmount; request identity prevents stale updates. Query changes clear old results, selected month, playback and errors. Calendar and selected-month map records derive from one result. Inclusive dates use UTC; null is unavailable, 0 is explicit generated zero.

Manual coordinate edits must be applied. Validation rejects blank, reversed and zero-area bounds: longitude ±180°, latitude ±85°, west < east, south < north. Dateline crossing is unsupported. The fixture supports 2022–2025 only.

AnalysisAdapter describes the current fixture, not an agreed backend contract. A future adapter must convert real payloads and expose approved metric/unit, sensor, coverage, processing version and limits. No FIRMS fetch or credential belongs in a UI component.

## Performance and cleanup

Home is the entry route. Explorer and MapLibre load on demand; the worker is separate. GeoJSON WebGL layers avoid individual DOM markers. Resize refits the AOI; changing month/query closes stale popups. Cleanup removes map instances, listeners, observers, requests and playback timers.

Tailwind is the primary style system. Small unlayered CSS handles MapLibre controls and container positioning. Fonts and responsive WebP art are local. Motion respects reduced motion, with no animation framework or continuous 3D globe. Map bundle sizes and the remaining Vite warning are documented in VERIFICATION.md; they are not Web Vitals scores.

The transitive minimatch override pins patched 11.0.1 for GHSA-g3hv-75wg-m249; lint checks compatibility. Revisit when upstream tooling adopts the patch.

Omar owns the frontend. Scientific metric/unit and harmonization remain team decisions. This milestone implements no backend or NASA ingestion.
