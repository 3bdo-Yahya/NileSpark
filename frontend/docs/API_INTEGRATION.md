# Frontend API integration

Implemented in the frontend only. The existing backend and shared contracts were not edited.

## Connection and requests

Explorer defaults to API mode. Switch Data connection to Synthetic demo to run fixtures independently of the backend. API requests never fall back silently to synthetic values.

Development defaults to http://127.0.0.1:8000. Set VITE_API_BASE_URL in frontend/.env.local to change it, then restart Vite. See .env.example. Production defaults to the website origin, unless configured at build time. VITE_ settings are public browser configuration, not secrets.

The client validates response envelopes and data, handles HTTP/network/timeout failures, and forwards cancellation. The timeout covers response body consumption too. Query changes cancel calendar, map and CSV work. Failed map requests leave the calendar intact and offer a separate retry.

| User action      | Endpoint               | Scope                                           |
| ---------------- | ---------------------- | ----------------------------------------------- |
| Load calendar    | POST /api/calendar     | Applied AOI and inclusive UTC dates             |
| Select month     | GET /api/map           | Month clipped to applied start/end; all sensors |
| Data & method    | GET /api/methodology   | Server explanation and parameters               |
| Export month CSV | POST /api/hotspots.csv | Same clipped month as the map; all sensors      |

Bounding boxes use west, south, east, north order. include_static is false. Selecting MODIS or VIIRS changes raw_by_sensor presentation only: the current contract has no sensor filter for the map or CSV. API VIIRS is a family, not specifically NOAA-20.

API date queries allow up to 120 months per request. This is an interface limit, not a claim about available NASA data. The synthetic fixture still supports 2022–2025. Calendar playback runs more slowly in API mode to leave headroom below the current map endpoint's 30 requests/minute limit.

## Truthful presentation

- meta.stub=true withholds calendar placeholder values, including zeros.
- Missing months, nulls and missing sensor keys stay unavailable; an explicit non-stub zero remains zero.
- API maps consume GeoJSON Point cell centroids with count. They use a separate cyan layer and count popup, not the synthetic detection layer.
- A map placeholder is empty and labeled as such. Empty geometry is not evidence of coverage or absence of fire.
- API numeric values use a neutral presentation. No scientific color scale or unit is invented; meta.unit is shown only when supplied.
- Methodology is loaded independently and clearly labels placeholder responses. A global factor is never automatically applied to an AOI in the frontend.

## Remaining backend/contract decisions

1. Supply real data and reliable coverage/missing-month semantics. Omitted months currently display unavailable rather than fabricated zero.
2. Confirm metric/unit and send unit metadata, plus coverage information where available. Shared docs propose cell-days; the UI does not treat this as scientific approval.
3. CSV must send X-Stub: true for placeholders and X-Stub: false for observation exports. Cross-origin responses must expose X-Stub and X-Row-Cap through Access-Control-Expose-Headers. The existing backend does not expose these custom headers to browser JavaScript. A known placeholder calendar or export never downloads; an unreadable CSV placeholder flag also blocks the download with a clear message. This prevents a header-only placeholder being presented as observations.
4. Confirm whether the API's VIIRS family, all-sensor map/CSV, and month-bounded export are the intended final product behavior. No unsupported sensor request parameter is sent.

No backend implementation, scientific harmonization, raw data ingestion or remote publication is part of this change.
