import assert from 'node:assert/strict'
import test from 'node:test'
import { boundsMatch, parseBounds, periodsBetween, validateBounds, validateQuery } from './query.ts'

const bounds = { west: 31, south: 24, east: 33, north: 26 }
test('blank coordinates do not silently become zero', () => {
  assert.equal(parseBounds({ west: '', south: '24', east: '33', north: '26' }), null)
  assert.equal(boundsMatch({ west: '31', south: '24', east: '33', north: '26' }, bounds), true)
})
test('rejects reversed, zero-width and unsupported polar bounds', () => {
  assert.ok(validateBounds({ ...bounds, west: 34 }))
  assert.ok(validateBounds({ ...bounds, east: 31 }))
  assert.ok(validateBounds({ ...bounds, north: 89 }))
  assert.equal(validateBounds(bounds), null)
})
test('validates inclusive dates, leap days and the explicit fixture range', () => {
  const query = { bounds, source: 'MODIS' as const, from: '2024-02-29', to: '2024-02-29' }
  assert.equal(validateQuery(query), null)
  assert.ok(validateQuery({ ...query, from: '2023-02-29' }))
  assert.ok(validateQuery({ ...query, to: '2024-01-01' }))
  assert.ok(validateQuery({ ...query, from: '2001-01-01' }))
  assert.deepEqual(periodsBetween('2023-12-31', '2024-02-01'), ['2023-12', '2024-01', '2024-02'])
})
