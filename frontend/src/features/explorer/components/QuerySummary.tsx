import { MapPin, Calendar, Eye, AlertTriangle } from 'lucide-react'
import type { Bounds, ConnectionMode, DataView, ApiSensor, ExplorerResult } from '../model/types'
import { periodLabel } from '../model/query'
import { formatBounds, formatDateRange, querySummary } from '../model/querySummary'

type Props = {
  bounds: Bounds | null
  areaName: string
  from: string
  to: string
  selected: string | null
  connection: ConnectionMode
  mode: DataView
  apiSensor: ApiSensor
  result: ExplorerResult | null
  busy: boolean
  unapplied: boolean
}

export function QuerySummary(p: Props) {
  const summary = querySummary(p)
  const demo = p.connection === 'demo'
  const stub = p.result?.provenance === 'api-stub'

  return (
    <div
      className="mb-5 flex flex-wrap items-start gap-x-5 gap-y-2 rounded-control border border-stroke bg-panel/80 px-4 py-3 text-label"
      role="region"
      aria-label="Query summary"
    >
      <span className="font-mono text-caption text-muted">{summary.status}</span>
      {/* Area */}
      <span className="inline-flex items-center gap-1.5 text-secondary">
        <MapPin size={14} className="shrink-0 text-brand" aria-hidden="true" />
        {summary.bounds ? (
          <span>
            <span className="text-paper">{p.areaName}</span>
            <span className="ml-1.5 font-mono text-caption text-muted">
              {formatBounds(summary.bounds)}
            </span>
          </span>
        ) : (
          <span className="text-muted">No area selected</span>
        )}
      </span>

      {/* Period */}
      <span className="inline-flex items-center gap-1.5 text-secondary">
        <Calendar size={14} className="shrink-0 text-brand" aria-hidden="true" />
        <span className="text-paper">{formatDateRange(summary.from, summary.to)}</span>
        <span className="font-mono text-caption text-muted">UTC</span>
      </span>

      {/* Selected month */}
      {summary.loaded && p.selected && (
        <span className="inline-flex items-center gap-1.5 text-secondary">
          <Eye size={14} className="shrink-0 text-focus" aria-hidden="true" />
          <span className="text-paper">{periodLabel(p.selected)}</span>
        </span>
      )}

      {/* Data mode */}
      <span className="font-mono text-caption text-muted">
        {demo
          ? 'Synthetic demo'
          : stub
            ? 'API placeholder'
            : summary.loaded
              ? `API · ${p.mode === 'source' ? `Raw ${p.apiSensor.toUpperCase()}` : 'Harmonized'}`
              : `API mode · ${p.mode === 'source' ? `Raw ${p.apiSensor.toUpperCase()}` : 'Harmonized'}`}
      </span>

      {/* Unapplied warning */}
      {summary.warning && (
        <span className="inline-flex items-center gap-1.5 font-mono text-caption text-warning">
          <AlertTriangle size={12} aria-hidden="true" />
          {summary.warning}
        </span>
      )}
    </div>
  )
}
