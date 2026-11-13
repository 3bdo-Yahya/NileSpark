import type { Bounds, ExplorerResult } from './types.ts'

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value: string, fallback: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1) return fallback
  const date = new Date(`${value}T00:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return fallback
  return dateFormatter.format(date)
}

export function formatDateRange(from: string, to: string): string {
  return `${formatDate(from, 'Choose a valid start date')} – ${formatDate(to, 'Choose a valid end date')}`
}

function coordinate(value: number, positive: string, negative: string): string {
  return value === 0 ? '0°' : `${Math.abs(value)}°${value > 0 ? positive : negative}`
}

export function formatBounds(bounds: Bounds): string {
  return `Longitude ${coordinate(bounds.west, 'E', 'W')} – ${coordinate(bounds.east, 'E', 'W')} · Latitude ${coordinate(bounds.south, 'N', 'S')} – ${coordinate(bounds.north, 'N', 'S')}`
}

export function querySummary(input: {
  bounds: Bounds | null
  from: string
  to: string
  result: ExplorerResult | null
  busy: boolean
  unapplied: boolean
}) {
  const loaded = input.result !== null && !input.busy
  const query = loaded ? input.result!.query : input
  return {
    bounds: query.bounds,
    from: query.from,
    to: query.to,
    loaded,
    status: input.busy
      ? 'Loading query'
      : loaded
        ? input.result?.provenance === 'api-stub'
          ? 'Loaded placeholder query'
          : 'Loaded query'
        : 'Search inputs · no result loaded',
    warning: input.unapplied ? 'Apply edited coordinates, then load the calendar again.' : null,
  }
}
