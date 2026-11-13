# BurnCal frontend fixes — 14 November 2026

The four issues from the Claude delivery review have been fixed in O:\NileSpark\frontend. Existing API behavior, data provenance, demo mode and the other local changes are preserved.

## Changes

- QuerySummary now safely formats empty, partial and impossible dates. Native From/To editing no longer throws Invalid time value; loading an invalid range displays the existing validation message.
- Hemisphere labels follow the sign of each coordinate. Egypt, Brazil, Australia and zero coordinates are covered.
- Summary status distinguishes current search inputs, loading, loaded queries and placeholder queries. A loaded result uses its own query snapshot. Edited coordinates require applying and reloading; no previous result is claimed to remain visible after invalidation.
- Calendar selection reveals months only inside its horizontal container. Reduced-motion requests use instant scrolling. Playback and initial selection do not scroll the document automatically.
- Arrow navigation is retained, with a single calendar Tab entry and normal focus visibility. Boundary arrows do not wrap into unloaded months.

## Validation

- TypeScript, ESLint, production build and Prettier check passed.
- All 38 tests passed, including 11 new regression tests covering date formatting, coordinate signs, query snapshots, cleared results, calendar navigation, scoped scrolling and reduced motion.
- git diff --check passed.
- Browser: clearing both From and To kept Explorer usable and displayed a date validation error.
- Browser: verified signed coordinates for Egypt/Brazil/Australia and loaded-result invalidation after manual coordinate editing.
- Browser: ArrowDown/ArrowUp navigated January 2025 to January 2026 and back. Tab exited the grid in one step.
- Browser: demo playback advanced while document scrollY stayed at 0. At 390 × 844 the calendar scrolled internally, and the page did not overflow horizontally.
- Final browser console contained no warnings or errors. The instant reduced-motion branch is covered by unit tests.

The API still returns placeholders; real scientific results and the CSV response-header agreement remain pending as described in API_INTEGRATION.md. No dependencies were added and no backend files were changed.
