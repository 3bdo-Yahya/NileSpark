import type { FeatureCollection, Point } from 'geojson'
import { ApiError, object } from '../../../lib/api/client.ts'
import type { ApiClient } from '../../../lib/api/client.ts'
import { periodsBetween, validateQuery } from '../model/query.ts'
import type { AnalysisQuery, ApiAnalysisResult, ApiMonth } from '../model/types.ts'

export type ApiMapData = {
  cells: FeatureCollection<Point, { count: number }>
  stub: boolean
}
export type Methodology = {
  stub: boolean
  methodVersion: string | null
  plainLanguage: string | null
  gridDegrees: number | null
  overlapYears: number[]
  globalFactor: number | null
}
function numeric(value: unknown): number | null {
  if (value == null) return null
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new ApiError('The API returned an invalid numeric value.')
  return value
}
function text(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string') throw new ApiError('The API returned an invalid text value.')
  return value.trim() || null
}
function isStub(meta: Record<string, unknown>): boolean {
  if (meta.stub !== undefined && typeof meta.stub !== 'boolean')
    throw new ApiError('The API returned an invalid placeholder flag.')
  return meta.stub === true
}
export function calendarBody(query: AnalysisQuery) {
  const error = validateQuery(query, 'api')
  if (error) throw new ApiError(error)
  const b = query.bounds
  return {
    aoi: { bbox: [b.west, b.south, b.east, b.north] },
    start: query.from,
    end: query.to,
    include_static: false,
  }
}
export function monthQuery(query: AnalysisQuery, period: string): AnalysisQuery {
  if (!periodsBetween(query.from, query.to).includes(period))
    throw new ApiError('The selected month is outside the applied period.')
  const last = new Date(`${period}-01T00:00:00Z`)
  last.setUTCMonth(last.getUTCMonth() + 1)
  last.setUTCDate(0)
  return {
    ...query,
    from: [query.from, `${period}-01`].sort().at(-1)!,
    to: [query.to, last.toISOString().slice(0, 10)].sort()[0]!,
  }
}
export function decodeCalendar(
  data: unknown,
  meta: Record<string, unknown>,
  query: AnalysisQuery,
): ApiAnalysisResult {
  const body = object(data)
  if (!Array.isArray(body.months))
    throw new ApiError('The calendar response is missing its monthly series.')
  const stub = isStub(meta)
  const rows = new Map<string, ApiMonth>()
  for (const value of body.months) {
    const row = object(value)
    if (
      !Number.isInteger(row.year) ||
      !Number.isInteger(row.month) ||
      Number(row.year) < 1 ||
      Number(row.year) > 9999 ||
      Number(row.month) < 1 ||
      Number(row.month) > 12
    )
      throw new ApiError('The calendar response contains an invalid month.')
    const period = `${String(row.year).padStart(4, '0')}-${String(row.month).padStart(2, '0')}`
    if (rows.has(period)) throw new ApiError('The calendar response contains duplicate months.')
    const median = numeric(row.median)
    const anomaly = numeric(row.anomaly)
    const anomalyPct = numeric(row.anomaly_pct)
    const harmonized = numeric(row.value)
    const raw = row.raw_by_sensor == null ? {} : object(row.raw_by_sensor)
    const modis = numeric(raw.modis)
    const viirs = numeric(raw.viirs)
    rows.set(period, {
      period,
      value: stub ? null : harmonized,
      status: !stub && harmonized !== null ? 'available' : 'unavailable',
      median: stub ? null : median,
      anomaly: stub ? null : anomaly,
      anomalyPct: stub ? null : anomalyPct,
      harmonized: stub ? null : harmonized,
      rawBySensor: stub ? {} : { modis, viirs },
    })
  }
  const baselineYears = meta.baseline_years ?? []
  if (
    !Array.isArray(baselineYears) ||
    baselineYears.some((year) => !Number.isInteger(year) || year < 1 || year > 9999)
  )
    throw new ApiError('The API returned invalid baseline years.')
  return {
    query: { ...query, bounds: { ...query.bounds } },
    provenance: stub ? 'api-stub' : 'api',
    months: periodsBetween(query.from, query.to).map(
      (period) =>
        rows.get(period) ?? {
          period,
          value: null,
          status: 'unavailable',
          harmonized: null,
          rawBySensor: {},
        },
    ),
    meta: {
      methodVersion: text(meta.method_version),
      unit: text(meta.unit),
      k: numeric(meta.k),
      baselineYears: stub ? [] : baselineYears,
      anomalyBasis: stub ? null : text(meta.anomaly_basis),
    },
  }
}
export function decodeMap(data: unknown, meta: Record<string, unknown>): ApiMapData {
  const body = object(data)
  if (body.type !== 'FeatureCollection' || !Array.isArray(body.features))
    throw new ApiError('The map response is not a GeoJSON FeatureCollection.')
  const stub = isStub(meta)
  const features: ApiMapData['cells']['features'] = []
  for (const value of body.features) {
    const feature = object(value)
    const geometry = object(feature.geometry)
    const properties = object(feature.properties)
    if (
      feature.type !== 'Feature' ||
      geometry.type !== 'Point' ||
      !Array.isArray(geometry.coordinates)
    )
      throw new ApiError('The map endpoint must return cell centroids as GeoJSON Points.')
    const [lng, lat] = geometry.coordinates
    const count = numeric(properties.count)
    if (
      typeof lng !== 'number' ||
      typeof lat !== 'number' ||
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      Math.abs(lng) > 180 ||
      Math.abs(lat) > 90 ||
      count === null ||
      count < 0
    )
      throw new ApiError('The map endpoint returned an invalid centroid or count.')
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { count },
    })
  }
  return { cells: { type: 'FeatureCollection', features: stub ? [] : features }, stub }
}
export function decodeMethodology(data: unknown, meta: Record<string, unknown>): Methodology {
  const body = object(data)
  const stub = isStub(meta) || isStub(body)
  const years = body.overlap_years ?? []
  if (
    !Array.isArray(years) ||
    !years.every((year) => Number.isInteger(year) && year >= 1 && year <= 9999)
  )
    throw new ApiError('The methodology returned invalid overlap years.')
  return {
    stub,
    methodVersion: text(body.method_version),
    plainLanguage: text(body.plain_language),
    gridDegrees: numeric(body.grid_deg),
    overlapYears: years,
    globalFactor: numeric(body.global_k),
  }
}
export function createAnalysisApi(client: ApiClient) {
  return {
    async calendar(query: AnalysisQuery, signal: AbortSignal) {
      const result = await client.json('/api/calendar', signal, calendarBody(query))
      return decodeCalendar(result.data, result.meta, query)
    },
    async map(query: AnalysisQuery, period: string, signal: AbortSignal) {
      const selected = monthQuery(query, period)
      const body = calendarBody(selected)
      const b = selected.bounds
      const params = new URLSearchParams({
        min_lon: String(b.west),
        min_lat: String(b.south),
        max_lon: String(b.east),
        max_lat: String(b.north),
        start: body.start,
        end: body.end,
        include_static: 'false',
      })
      const result = await client.json(`/api/map?${params}`, signal)
      return decodeMap(result.data, result.meta)
    },
    async methodology(signal: AbortSignal) {
      const result = await client.json('/api/methodology', signal)
      return decodeMethodology(result.data, result.meta)
    },
    async exportMonth(query: AnalysisQuery, period: string, signal: AbortSignal) {
      return client.csv('/api/hotspots.csv', signal, calendarBody(monthQuery(query, period)))
    },
  }
}
