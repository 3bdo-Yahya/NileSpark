# Frontend API integration verification

Validated locally on 13 November 2026, Node 22.20.0.

## Automated

- TypeScript project checks, ESLint with zero warnings, Vite build and Prettier check passed in O:/NileSpark/frontend.
- All 21 tests passed: existing AOI/date/demo tests plus API request envelopes, bbox order, month clipping/leap day, non-stub zero versus missing values, placeholder suppression, raw/harmonized projection, schema rejection, count centroids, methodology, HTTP errors, network failures, timeout, cancellation and CSV provenance.
- npm installation reported zero vulnerabilities.
- git diff --check passed. Changes are confined to frontend; no backend code or shared API contract was modified.
- Frontend .gitattributes now pins LF, matching .editorconfig, so Git's Windows CRLF checkout setting does not break formatting checks.

## Browser against the actual local API

- API calendar POST succeeded, with an explicit placeholder badge. Stub zeros remained unavailable in raw and harmonized views.
- Selecting a month requested its map endpoint with that month's inclusive dates. Stub geometry stayed empty and labeled; cell layers are separate from synthetic detections.
- CSV POST succeeded; the known placeholder response produced a status message and no observation download.
- Methodology loaded from the server and displayed its placeholder status, explanation, version and grid spacing.
- Stopping the local API caused a map error with the calendar preserved. A separate calendar request showed a readable error with inputs retained. Restarting the API and using Retry API request recovered.
- Switching to synthetic mode populated the fixture calendar again; returning to API cleared the synthetic result.
- Desktop 1440 × 1000 and mobile 390 × 844 checked. No page-level horizontal overflow. Mobile controls collapsed and the map refitted its AOI.
- A fresh final browser tab recorded no console warnings or errors.
- Both dev servers remain running on 127.0.0.1:5173 and 127.0.0.1:8000.

The live backend currently supplies placeholders. Non-stub response shapes, explicit zeros, missing sensor keys, centroid validation and CSV header variations were verified with injected unit-test responses, not live NASA data. Browser timeout/429 and non-stub observation downloads have not been tested against a real populated backend. Scientific harmonization is not verified by these checks.

## Asset observations

Approximately 74.1 kB gzip entry JS, 307.6 kB gzip Explorer JS, 8.5 kB entry CSS and 10.4 kB map CSS. The separate worker is 519 kB uncompressed. Existing local fonts and responsive 201 kB/59 kB WebP art remain.

Vite still warns about the large minified map route; it is lazy-loaded, and the warning threshold has not been raised. No Lighthouse or Web Vitals measurement is claimed.

See API_INTEGRATION.md for unresolved unit/coverage semantics and cross-origin CSV provenance headers.
