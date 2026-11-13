import assert from 'node:assert/strict'
import test from 'node:test'
import { demoAnalysis, makeDemoResult } from './demoAnalysis.ts'
import { makeMonthCsv } from './exportCsv.ts'

const query = {
  bounds: { west: 31, south: 24, east: 33, north: 26 },
  from: '2022-01-01',
  to: '2024-12-31',
  source: 'MODIS' as const,
}
test('demo records match month counts and stay inside the requested AOI/date range', () => {
  const result = makeDemoResult(query)
  assert.ok(result.months.some((month) => month.value === null))
  assert.ok(result.months.some((month) => month.value === 0))
  for (const month of result.months)
    assert.equal(
      result.observations.filter((record) => record.period === month.period).length,
      month.value ?? 0,
    )
  for (const point of result.observations) {
    assert.ok(point.latitude >= 24 && point.latitude <= 26)
    assert.ok(point.longitude >= 31 && point.longitude <= 33)
    assert.ok(
      point.acquiredAt.slice(0, 10) >= query.from && point.acquiredAt.slice(0, 10) <= query.to,
    )
    assert.equal(point.isDemo, true)
  }
})
test('CSV exports only the selected month, matches the count and declares demo provenance', () => {
  const result = makeDemoResult(query)
  const period = result.months.find((month) => month.value && month.value > 0)!.period
  const lines = makeMonthCsv(result, period).trim().split('\r\n')
  assert.equal(
    lines.length - 1,
    result.observations.filter((record) => record.period === period).length,
  )
  assert.ok(lines.slice(1).every((line) => line.startsWith('true,MODIS,') && line.endsWith(period)))
})
test('an empty fixture is unavailable rather than observed zero', () => {
  const result = makeDemoResult(query, 'empty')
  assert.equal(result.observations.length, 0)
  assert.ok(result.months.every((month) => month.value === null && month.status === 'unavailable'))
})
test('cancellation rejects with AbortError, including before starting', async () => {
  const controller = new AbortController()
  const pending = demoAnalysis.analyze(query, controller.signal, 'sample')
  controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  await assert.rejects(demoAnalysis.analyze(query, controller.signal, 'sample'), {
    name: 'AbortError',
  })
})
