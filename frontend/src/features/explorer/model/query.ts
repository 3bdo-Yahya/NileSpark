import type { AnalysisQuery, Bounds, CoordinateDraft } from './types.ts'

export const DEMO_FROM = '2022-01-01'
export const DEMO_TO = '2025-12-31'
export const coordinateKeys = ['west', 'south', 'east', 'north'] as const

export function toDraft(bounds: Bounds | null): CoordinateDraft {
  return {
    west: bounds ? String(bounds.west) : '',
    south: bounds ? String(bounds.south) : '',
    east: bounds ? String(bounds.east) : '',
    north: bounds ? String(bounds.north) : '',
  }
}
export function parseBounds(draft: CoordinateDraft): Bounds | null {
  if (coordinateKeys.some((key) => !draft[key].trim())) return null
  const bounds = Object.fromEntries(
    coordinateKeys.map((key) => [key, Number(draft[key])]),
  ) as Bounds
  return validateBounds(bounds) ? null : bounds
}
export function validateBounds(bounds: Bounds): string | null {
  if (!Object.values(bounds).every(Number.isFinite)) return 'Enter four valid coordinates.'
  if (bounds.west < -180 || bounds.east > 180 || bounds.east < -180 || bounds.west > 180)
    return 'Longitude must be between −180° and 180°.'
  if (bounds.south < -85 || bounds.north > 85 || bounds.north < -85 || bounds.south > 85)
    return 'This map supports latitudes between −85° and 85°.'
  if (bounds.west >= bounds.east)
    return 'West must be less than east. Select areas across the date line separately.'
  if (bounds.south >= bounds.north) return 'South must be less than north.'
  return null
}
export function boundsMatch(draft: CoordinateDraft, bounds: Bounds | null): boolean {
  return (
    bounds !== null &&
    coordinateKeys.every((key) => draft[key].trim() !== '' && Number(draft[key]) === bounds[key])
  )
}
function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function validateQuery(query: AnalysisQuery): string | null {
  const boundsError = validateBounds(query.bounds)
  if (boundsError) return boundsError
  if (!validDate(query.from) || !validDate(query.to)) return 'Choose a valid start and end date.'
  if (query.from > query.to) return 'The start date must be on or before the end date.'
  if (query.from < DEMO_FROM || query.to > DEMO_TO)
    return 'The synthetic demo supports 2022–2025. This is not a statement of NASA data availability.'
  return null
}
export function periodsBetween(from: string, to: string): string[] {
  const start = new Date(`${from.slice(0, 7)}-01T00:00:00Z`)
  const end = to.slice(0, 7)
  const periods: string[] = []
  for (let i = 0; i < 48; i++) {
    const period = start.toISOString().slice(0, 7)
    if (period > end) break
    periods.push(period)
    start.setUTCMonth(start.getUTCMonth() + 1)
  }
  return periods
}
export function periodLabel(period: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${period}-01T00:00:00Z`),
  )
}
