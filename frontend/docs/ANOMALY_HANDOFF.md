# BurnCal anomaly frontend handoff

Implemented 14 November 2026. This is a frontend integration, not a scientific computation or a confirmed agreement with Ali.

The Explorer now has a Monthly anomaly section with a selected-month comparison and an expandable monthly table. Selecting a month in the table updates the existing calendar, map and export month. It displays the server's historical median, absolute anomaly and percentage independently of the raw sensor display selector.

## Consumed calendar fields

The existing `POST /api/calendar` envelope and request body are unchanged. Per-month fields already present in the repository contract are now decoded:

```json
{
  "year": 2025,
  "month": 3,
  "value": 4,
  "raw_by_sensor": { "modis": 1, "viirs": 4 },
  "median": 8,
  "anomaly": -4,
  "anomaly_pct": -50
}
```

Numbers above are an illustrative contract example, not NASA observations. Missing/null fields show a dash, explicit zero remains zero, and `meta.stub: true` withholds all comparison values. Invalid numeric fields reject the response. Percentage is withheld when the historical median is zero; the frontend never calculates an alternative percentage or an anomaly from raw/harmonized values.

`meta.unit`, `meta.method_version` and `meta.baseline_years` are consumed. Baseline years are shown as supplied, without assuming that two entries define a continuous range. The optional additive field `meta.anomaly_basis` is a proposed plain-language series description (e.g. harmonized cell-days); the app shows “not supplied by API” when absent. It requires confirmation by Ali and Mariam. Existing API responses remain compatible when comparison fields are absent.

## Confirm before the real-data checkpoint

- Ali: return per-month comparison fields with finite numbers or null, and `meta.stub: false` only for actual processed data.
- Mariam: confirm the baseline years, exclusion of the target month/year, minimum history, partial-month handling and the exact series used for median/anomaly. Confirm behavior at zero median. Current UI does not assume these decisions.
- Salma/Mariam: provide the actual unit and method version; distinguish calibration factor from the historical anomaly baseline. No constant 18× conversion or 73% filter percentage is hardcoded in the frontend.
- AI scoring: not implemented because no score scale, schema, QC flags or explanation contract was supplied. Statistical anomaly values are not presented as AI output or significance/risk judgments.
- CSV: cross-origin downloads still require readable `X-Stub: false` and the appropriate CORS expose headers. Existing methodology panel continues to consume `/api/methodology`.

## Verification

41 unit tests, TypeScript, ESLint and the production build passed. The shared browser journey for the new feature passed at 1440×1000 and 390×844 through the CUA native browser adapter, using marked synthetic fixtures. It checks negative and zero values, a missing month, zero historical median, month selection, placeholder withholding, demo switching and horizontal overflow. It is registered in Playwright alongside the existing journeys (16 journeys × two viewport projects); the full CLI suite was not run in this session. The live API remains a placeholder, so actual science-data validation is pending.

No backend, pipeline or root API contract files were changed. No remote push or pull request was created for this change.
