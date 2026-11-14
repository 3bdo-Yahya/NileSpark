import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarMonths } from './presentation.ts'
import type { ApiAnalysisResult, AnalysisResult, ApiMonth } from './types.ts'

const query = {
  bounds: { west: 31, south: 24, east: 33, north: 26 },
  from: '2024-01-01',
  to: '2024-03-31',
  source: 'VIIRS_NOAA20' as const,
}

function makeApiResult(
  months: ApiMonth[],
  provenance: 'api' | 'api-stub' = 'api',
): ApiAnalysisResult {
  return {
    query,
    provenance,
    months,
    meta: { methodVersion: 'v1', unit: 'cell-days', k: null },
  }
}

function makeDemoResult(): AnalysisResult {
  return {
    query,
    provenance: 'synthetic-demo',
    metric: 'demo-record-count',
    unit: 'synthetic records',
    months: [
      { period: '2024-01', value: 5, status: 'available' },
      { period: '2024-02', value: null, status: 'unavailable' },
      { period: '2024-03', value: 0, status: 'available' },
    ],
    observations: [],
    scenario: 'sample',
  }
}

test('calendarMonths returns empty array for null result', () => {
  assert.deepEqual(calendarMonths(null, 'source', 'modis'), [])
  assert.deepEqual(calendarMonths(null, 'harmonized', 'viirs'), [])
})

test('calendarMonths returns demo months in source mode and empty in harmonized mode', () => {
  const demo = makeDemoResult()
  const source = calendarMonths(demo, 'source', 'modis')
  assert.equal(source.length, 3)
  assert.equal(source[0]?.value, 5)
  assert.equal(source[1]?.value, null)
  assert.equal(source[2]?.value, 0)
  const harmonized = calendarMonths(demo, 'harmonized', 'modis')
  assert.equal(harmonized.length, 0)
})

test('calendarMonths projects correct sensor in raw mode', () => {
  const apiMonths: ApiMonth[] = [
    {
      period: '2024-01',
      value: 10,
      status: 'available',
      harmonized: 10,
      rawBySensor: { modis: 3, viirs: 7 },
    },
    {
      period: '2024-02',
      value: 5,
      status: 'available',
      harmonized: 5,
      rawBySensor: { modis: null, viirs: 5 },
    },
    {
      period: '2024-03',
      value: null,
      status: 'unavailable',
      harmonized: null,
      rawBySensor: {},
    },
  ]
  const result = makeApiResult(apiMonths)

  const modis = calendarMonths(result, 'source', 'modis')
  assert.equal(modis[0]?.value, 3)
  assert.equal(modis[1]?.value, null) // MODIS is null for Feb
  assert.equal(modis[2]?.value, null) // no raw at all for Mar

  const viirs = calendarMonths(result, 'source', 'viirs')
  assert.equal(viirs[0]?.value, 7)
  assert.equal(viirs[1]?.value, 5)
  assert.equal(viirs[2]?.value, null)
})

test('calendarMonths projects harmonized values in harmonized mode', () => {
  const apiMonths: ApiMonth[] = [
    {
      period: '2024-01',
      value: 10,
      status: 'available',
      harmonized: 10,
      rawBySensor: { modis: 3, viirs: 7 },
    },
    {
      period: '2024-02',
      value: null,
      status: 'unavailable',
      harmonized: null,
      rawBySensor: { modis: 2 },
    },
  ]
  const result = makeApiResult(apiMonths)
  const harm = calendarMonths(result, 'harmonized', 'modis')
  assert.equal(harm[0]?.value, 10)
  assert.equal(harm[1]?.value, null)
})

test('calendarMonths marks status correctly based on value', () => {
  const apiMonths: ApiMonth[] = [
    {
      period: '2024-01',
      value: 0,
      status: 'available',
      harmonized: 0,
      rawBySensor: { modis: 0, viirs: 0 },
    },
  ]
  const result = makeApiResult(apiMonths)
  const modis = calendarMonths(result, 'source', 'modis')
  assert.equal(modis[0]?.value, 0)
  assert.equal(modis[0]?.status, 'available') // explicit zero is available
})

test('stub API result withholds all values', () => {
  const apiMonths: ApiMonth[] = [
    {
      period: '2024-01',
      value: null,
      status: 'unavailable',
      harmonized: null,
      rawBySensor: {},
    },
  ]
  const result = makeApiResult(apiMonths, 'api-stub')
  const modis = calendarMonths(result, 'source', 'modis')
  assert.equal(modis[0]?.value, null)
  assert.equal(modis[0]?.status, 'unavailable')

  const harm = calendarMonths(result, 'harmonized', 'viirs')
  assert.equal(harm[0]?.value, null)
})
