# Frontend demo verification

Validated locally on 13 November 2026 with Node 22.20.0.

## Automated

- TypeScript checks and ESLint with zero warnings.
- Seven Node tests: blank/reversed/polar bounds; inclusive dates/leap days/fixture range; record/count/date/AOI consistency; selected-month CSV provenance; unavailable versus zero; cancellation.
- Vite production build and Prettier check.
- Dependency audit after installation: zero reported vulnerabilities.

## Browser

Local production preview checked on desktop and 390 × 844 mobile.

- Real geographic basemap, selected AOI and synthetic points loaded.
- Two-corner drawing committed a custom area and synchronized coordinate inputs.
- Invalid manual bounds showed an error; Reset cleared the area and disabled Run.
- Keyboard date editing cleared old results; start-after-end showed an error.
- Calendar selection updated details and map. Zero and unavailable remained distinct; unavailable export was disabled.
- Export downloaded January 2022 CSV with 12 records, matching its count, each is_demo=true.
- Request failure preserved inputs; Retry sample recovered. Empty fixture displayed unavailable values rather than zero.
- Harmonized mode disabled Run and showed pending metric/unit messaging.
- Play advanced a month; Pause stopped playback.
- Home/Explorer navigation and map recreation worked. Skip to content focused main without changing the route.
- Mobile controls collapsed/expanded. No page-level horizontal overflow; the calendar scrolls in its own container.
- Final fresh preview captured no console warnings/errors.

Foundation QA also covered local fonts/image variants, dialog Escape/focus return, visible focus and reduced-motion styles. No Lighthouse/Web Vitals measurement was run. Offline/WebGL fallback is implemented but was not tested by blocking network access.

## Production assets

Approximate gzip: entry JS 74.1 kB, Explorer JS 302.3 kB, foundations 3.3 kB, entry CSS 8.3 kB, map CSS 10.4 kB. Separate worker: 519 kB uncompressed. Hero WebP: 201 kB and mobile variant 59 kB.

Vite warns that the minified map route exceeds 500 kB. Explorer is lazy-loaded so Home does not eagerly load it. The warning remains visible; its threshold has not been raised.

This is a working frontend demonstration with synthetic records. Real NASA data, approved science, harmonization and backend integration are pending.
