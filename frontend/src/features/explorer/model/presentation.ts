import type { ApiSensor, DataView, ExplorerResult, MonthValue } from './types.ts'

export function calendarMonths(
  result: ExplorerResult | null,
  mode: DataView,
  sensor: ApiSensor,
): MonthValue[] {
  if (!result) return []
  if (result.provenance === 'synthetic-demo') return mode === 'source' ? result.months : []
  return result.months.map((month) => {
    const value = mode === 'source' ? (month.rawBySensor[sensor] ?? null) : month.harmonized
    return { period: month.period, value, status: value === null ? 'unavailable' : 'available' }
  })
}
