export type Bounds = { west: number; south: number; east: number; north: number }
export type CoordinateDraft = Record<keyof Bounds, string>
export type ObservationSource = 'VIIRS_NOAA20' | 'MODIS'
export type DataView = 'source' | 'harmonized'
export type DemoScenario = 'sample' | 'empty' | 'error'
export type ConnectionMode = 'api' | 'demo'
export type ApiSensor = 'modis' | 'viirs'
export type ApiMonth = MonthValue & {
  harmonized: number | null
  rawBySensor: Partial<Record<ApiSensor, number | null>>
}
export type ApiAnalysisResult = {
  query: AnalysisQuery
  provenance: 'api' | 'api-stub'
  months: ApiMonth[]
  meta: { methodVersion: string | null; unit: string | null; k: number | null }
}
export type ExplorerResult = AnalysisResult | ApiAnalysisResult

export type AnalysisQuery = {
  bounds: Bounds
  from: string
  to: string
  source: ObservationSource
}
export type MonthValue = {
  period: string
  status: 'available' | 'unavailable'
  value: number | null
}
export type DemoObservation = {
  id: string
  longitude: number
  latitude: number
  acquiredAt: string
  period: string
  source: ObservationSource
  isDemo: true
}
export type AnalysisResult = {
  query: AnalysisQuery
  provenance: 'synthetic-demo'
  metric: 'demo-record-count'
  unit: 'synthetic records'
  months: MonthValue[]
  observations: DemoObservation[]
  scenario: 'sample' | 'empty'
}
export interface AnalysisAdapter {
  analyze(
    query: AnalysisQuery,
    signal: AbortSignal,
    scenario: DemoScenario,
  ): Promise<AnalysisResult>
}

export const PRESETS = [
  {
    id: 'egypt',
    name: 'Upper Egypt',
    label: 'Egypt',
    bounds: { west: 31, south: 24, east: 33, north: 26 },
  },
  {
    id: 'brazil',
    name: 'Central Brazil',
    label: 'Brazil',
    bounds: { west: -56, south: -15, east: -50, north: -9 },
  },
  {
    id: 'australia',
    name: 'Eastern Australia',
    label: 'Australia',
    bounds: { west: 143, south: -31, east: 149, north: -25 },
  },
] as const
