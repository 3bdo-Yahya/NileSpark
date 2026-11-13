import { periodsBetween, validateQuery } from '../model/query.ts'
import type {
  AnalysisAdapter,
  AnalysisQuery,
  AnalysisResult,
  DemoObservation,
  DemoScenario,
} from '../model/types.ts'

function abortError(): DOMException {
  return new DOMException('The preview was cancelled.', 'AbortError')
}
function wait(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }
    const abort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, 650)
    signal.addEventListener('abort', abort, { once: true })
  })
}

/** A frontend-only fixture adapter. No NASA requests, approved metric or harmonization. */
export function makeDemoResult(
  query: AnalysisQuery,
  scenario: 'sample' | 'empty' = 'sample',
): AnalysisResult {
  const error = validateQuery(query)
  if (error) throw new Error(error)
  const seed =
    Math.abs(Math.round(Object.values(query.bounds).reduce((sum, value) => sum + value, 0) * 100)) +
    (query.source === 'MODIS' ? 9 : 3)
  const observations: DemoObservation[] = []
  const months = periodsBetween(query.from, query.to).map((period, index) => {
    if (scenario === 'empty' || index % 17 === 6)
      return { period, status: 'unavailable' as const, value: null }
    const count = index % 11 === 3 ? 0 : ((seed + index * 7) % 16) + 1
    const first = Math.max(
      Date.parse(`${period}-01T00:00:00Z`),
      Date.parse(`${query.from}T00:00:00Z`),
    )
    const next = new Date(`${period}-01T00:00:00Z`)
    next.setUTCMonth(next.getUTCMonth() + 1)
    const last = Math.min(next.getTime() - 86400000, Date.parse(`${query.to}T00:00:00Z`))
    for (let point = 0; point < count; point++) {
      const fx = (((seed + index * 13 + point * 37) % 83) + 8) / 100
      const fy = (((seed + index * 29 + point * 19) % 83) + 8) / 100
      const day =
        first + Math.floor(((last - first) / 86400000) * ((point + 1) / (count + 1))) * 86400000
      observations.push({
        id: `demo-${query.source}-${period}-${point}`,
        longitude: Number(
          (query.bounds.west + (query.bounds.east - query.bounds.west) * fx).toFixed(5),
        ),
        latitude: Number(
          (query.bounds.south + (query.bounds.north - query.bounds.south) * fy).toFixed(5),
        ),
        acquiredAt: new Date(day + 12 * 3600000).toISOString(),
        period,
        source: query.source,
        isDemo: true,
      })
    }
    return { period, status: 'available' as const, value: count }
  })
  return {
    query: { ...query, bounds: { ...query.bounds } },
    provenance: 'synthetic-demo',
    metric: 'demo-record-count',
    unit: 'synthetic records',
    months,
    observations,
    scenario,
  }
}
export const demoAnalysis: AnalysisAdapter = {
  async analyze(query: AnalysisQuery, signal: AbortSignal, scenario: DemoScenario) {
    await wait(signal)
    if (signal.aborted) throw abortError()
    if (scenario === 'error')
      throw new Error(
        'The demo request failed. Your inputs are preserved; retry to load the sample.',
      )
    return makeDemoResult(query, scenario)
  },
}
