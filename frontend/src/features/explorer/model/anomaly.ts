import type { ExplorerResult } from './types.ts'

/** Project server values only; never derive science or substitute synthetic comparisons. */
export function anomalyForMonth(result: ExplorerResult | null, selected: string | null) {
  const empty = { median: null, anomaly: null, percentage: null }
  if (!result) return { ...empty, reason: 'Load an API calendar to view historical comparisons.' }
  if (result.provenance === 'synthetic-demo')
    return { ...empty, reason: 'Anomalies are unavailable in the synthetic demo.' }
  if (result.provenance === 'api-stub')
    return { ...empty, reason: 'API placeholder; anomaly values are withheld.' }
  const month = result.months.find((row) => row.period === selected)
  const median = month?.median ?? null
  const anomaly = month?.anomaly ?? null
  const percentage = median === 0 ? null : (month?.anomalyPct ?? null)
  return {
    median,
    anomaly,
    percentage,
    reason:
      median === null && anomaly === null && percentage === null
        ? 'Historical comparison not supplied for this month.'
        : null,
  }
}
