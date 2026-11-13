import assert from 'node:assert/strict'
import test from 'node:test'
import { createApiClient } from '../../../lib/api/client.ts'
import {
  calendarBody,
  createAnalysisApi,
  decodeCalendar,
  decodeMap,
  decodeMethodology,
  monthQuery,
} from './apiAnalysis.ts'
import { calendarMonths } from '../model/presentation.ts'
import { periodsBetween, validateQuery } from '../model/query.ts'
import type { AnalysisQuery } from '../model/types.ts'

const query: AnalysisQuery = {
  bounds: { west: 31, south: 24, east: 33, north: 26 },
  from: '2024-02-10',
  to: '2024-03-05',
  source: 'VIIRS_NOAA20',
}
test('API body uses longitude/latitude bbox order and no unsupported source filter', () => {
  assert.deepEqual(periodsBetween('9999-12-01', '9999-12-31'), ['9999-12'])
  assert.match(validateQuery({ ...query, from: '0000-01-01' }, 'api')!, /valid start/)
  assert.deepEqual(calendarBody(query), {
    aoi: { bbox: [31, 24, 33, 26] },
    start: '2024-02-10',
    end: '2024-03-05',
    include_static: false,
  })
  assert.equal(validateQuery({ ...query, from: '2010-01-01', to: '2010-12-31' }, 'api'), null)
  assert.match(
    validateQuery({ ...query, from: '2000-01-01', to: '2025-12-31' }, 'api')!,
    /120 months/,
  )
})
test('selected month clips both boundaries and handles leap day; out-of-range export fails', () => {
  assert.deepEqual(monthQuery(query, '2024-02'), { ...query, from: '2024-02-10', to: '2024-02-29' })
  assert.deepEqual(monthQuery(query, '2024-03'), { ...query, from: '2024-03-01', to: '2024-03-05' })
  assert.throws(() => monthQuery(query, '2024-04'), /outside/)
})
test('missing API months and sensor values remain null while an explicit zero survives', () => {
  const result = decodeCalendar(
    { months: [{ year: 2024, month: 2, value: 1.5, raw_by_sensor: { modis: 0 } }] },
    {},
    query,
  )
  assert.equal(result.months[1]?.value, null)
  assert.equal(calendarMonths(result, 'source', 'modis')[0]?.value, 0)
  assert.equal(calendarMonths(result, 'source', 'viirs')[0]?.value, null)
  assert.equal(calendarMonths(result, 'harmonized', 'viirs')[0]?.value, 1.5)
  assert.equal(result.meta.unit, null)
})
test('stub zeros are withheld in raw and harmonized views', () => {
  const result = decodeCalendar(
    { months: [{ year: 2024, month: 2, value: 0, raw_by_sensor: { modis: 0, viirs: 0 } }] },
    { stub: true, method_version: 'v1' },
    query,
  )
  assert.equal(result.provenance, 'api-stub')
  for (const mode of ['source', 'harmonized'] as const)
    assert.ok(calendarMonths(result, mode, 'modis').every((month) => month.value === null))
})
test('invalid or duplicate months and non-finite values reject the entire response', () => {
  for (const months of [
    [{ year: 2024, month: 13, value: 0 }],
    [
      { year: 2024, month: 2, value: 1 },
      { year: 2024, month: 2, value: 2 },
    ],
    [{ year: 2024, month: 2, value: Number.NaN }],
    [{ year: 2024, month: 2, value: '12' }],
  ])
    assert.throws(() => decodeCalendar({ months }, {}, query))
})
test('map decoder accepts count centroids, withholds stubs and rejects individual-point mismatches', () => {
  const cells = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [32, 25] },
        properties: { count: 7 },
      },
    ],
  }
  assert.equal(decodeMap(cells, {}).cells.features[0]?.properties.count, 7)
  assert.equal(decodeMap(cells, { stub: true }).cells.features.length, 0)
  assert.throws(() =>
    decodeMap(
      { ...cells, features: [{ ...cells.features[0], properties: { detections: 7 } }] },
      {},
    ),
  )
  assert.throws(() =>
    decodeMap(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [999, 25] },
            properties: { count: 1 },
          },
        ],
      },
      {},
    ),
  )
})
test('map and CSV endpoints use the same clipped month, all sensors and static=false', async () => {
  const calls: { url: URL; body: unknown }[] = []
  const api = createAnalysisApi(
    createApiClient({
      baseUrl: 'http://localhost:8000',
      fetcher: async (url, init) => {
        const parsed = new URL(String(url))
        calls.push({ url: parsed, body: init?.body ? JSON.parse(String(init.body)) : null })
        if (parsed.pathname.endsWith('.csv'))
          return new Response('sensor,lat,lon\n', { headers: { 'Content-Type': 'text/csv' } })
        return Response.json({
          success: true,
          error: null,
          data: { type: 'FeatureCollection', features: [] },
          meta: {},
        })
      },
    }),
  )
  const signal = new AbortController().signal
  await api.map(query, '2024-02', signal)
  await api.exportMonth(query, '2024-02', signal)
  assert.equal(calls[0]?.url.searchParams.get('start'), '2024-02-10')
  assert.equal(calls[0]?.url.searchParams.get('end'), '2024-02-29')
  assert.equal(calls[0]?.url.searchParams.get('include_static'), 'false')
  assert.deepEqual(calls[1]?.body, calendarBody(monthQuery(query, '2024-02')))
})
test('methodology reports placeholder flags without treating a factor as applied to the AOI', () => {
  const result = decodeMethodology(
    {
      stub: true,
      method_version: 'v1',
      plain_language: 'Placeholder',
      grid_deg: 0.01,
      global_k: null,
      overlap_years: [],
    },
    {},
  )
  assert.equal(result.stub, true)
  assert.equal(result.globalFactor, null)
  assert.throws(() => decodeMethodology({ overlap_years: ['2024'] }, {}))
})
