import assert from 'node:assert/strict'
import test from 'node:test'
import { formatBounds, formatDateRange, querySummary } from './querySummary.ts'
import type { ApiAnalysisResult } from './types.ts'

const bounds = { west: 31, south: 24, east: 33, north: 26 }
const inputs = {
  bounds,
  from: '2025-01-01',
  to: '2025-12-31',
  result: null,
  busy: false,
  unapplied: false,
}
const result: ApiAnalysisResult = {
  query: { bounds, from: '2024-02-10', to: '2024-03-05', source: 'VIIRS_NOAA20' },
  provenance: 'api',
  months: [],
  meta: { methodVersion: null, unit: null, k: null },
}

test('cleared and partially edited date inputs render placeholders without throwing', () => {
  for (const value of ['', '2025-', '2025-01', 'not-a-date', '0000-01-01']) {
    assert.match(formatDateRange(value, inputs.to), /^Choose a valid start date – Dec 31, 2025$/)
    assert.match(formatDateRange(inputs.from, value), /^Jan 1, 2025 – Choose a valid end date$/)
  }
  assert.equal(formatDateRange('', ''), 'Choose a valid start date – Choose a valid end date')
})

test('date summaries reject impossible dates but preserve a real leap day in UTC', () => {
  assert.equal(formatDateRange('2024-02-29', '2024-03-01'), 'Feb 29, 2024 – Mar 1, 2024')
  assert.match(
    formatDateRange('2025-02-29', '2025-04-31'),
    /Choose a valid start date – Choose a valid end date/,
  )
})

test('bounds use hemisphere from coordinate sign, including Brazil, Australia and zero', () => {
  assert.equal(formatBounds(bounds), 'Longitude 31°E – 33°E · Latitude 24°N – 26°N')
  assert.equal(
    formatBounds({ west: -56, east: -50, south: -15, north: -9 }),
    'Longitude 56°W – 50°W · Latitude 15°S – 9°S',
  )
  assert.equal(
    formatBounds({ west: 143, east: 149, south: -31, north: -25 }),
    'Longitude 143°E – 149°E · Latitude 31°S – 25°S',
  )
  assert.equal(
    formatBounds({ west: -1, east: 0, south: -0, north: 1 }),
    'Longitude 1°W – 0° · Latitude 0° – 1°N',
  )
})

test('only loaded results use their applied query snapshot', () => {
  const loaded = querySummary({ ...inputs, bounds: { ...bounds, west: 30 }, result })
  assert.equal(loaded.status, 'Loaded query')
  assert.deepEqual(loaded.bounds, result.query.bounds)
  assert.equal(loaded.from, result.query.from)
  assert.equal(loaded.to, result.query.to)
  const stub = querySummary({ ...inputs, result: { ...result, provenance: 'api-stub' } })
  assert.equal(stub.status, 'Loaded placeholder query')
})

test('editing coordinates after invalidation does not claim previous results are visible', () => {
  const summary = querySummary({ ...inputs, unapplied: true })
  assert.equal(summary.loaded, false)
  assert.equal(summary.status, 'Search inputs · no result loaded')
  assert.equal(summary.warning, 'Apply edited coordinates, then load the calendar again.')
  assert.deepEqual(summary.bounds, inputs.bounds)
  assert.equal(querySummary(inputs).warning, null)
})

test('loading and cleared date drafts use current inputs without calling them loaded', () => {
  const draft = querySummary({ ...inputs, from: '' })
  assert.equal(draft.from, '')
  assert.equal(draft.loaded, false)
  const loading = querySummary({ ...inputs, busy: true, result })
  assert.equal(loading.from, inputs.from)
  assert.equal(loading.loaded, false)
  assert.equal(loading.status, 'Loading query')
})
