import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { periodLabel } from '../model/query'
import { anomalyForMonth } from '../model/anomaly'
import type { ConnectionMode, ExplorerResult } from '../model/types'

const format = (value: number | null, signed = false) =>
  value === null
    ? '—'
    : new Intl.NumberFormat('en', {
        maximumFractionDigits: 3,
        signDisplay: signed ? 'exceptZero' : 'auto',
      }).format(value)

export function AnomalyPanel({
  result,
  connection,
  selected,
  busy,
  onSelect,
}: {
  result: ExplorerResult | null
  connection: ConnectionMode
  selected: string | null
  busy: boolean
  onSelect: (period: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const item = anomalyForMonth(result, selected)
  const api = result?.provenance === 'api' ? result : null
  const years = api?.meta.baselineYears ?? []
  return (
    <section
      className="min-w-0 rounded-panel border border-stroke bg-panel p-5"
      aria-labelledby="anomaly-heading"
      aria-busy={busy}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Compared with history</p>
          <h2 id="anomaly-heading" className="text-2xl">
            Monthly anomaly
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          aria-expanded={expanded}
          aria-controls="anomaly-months"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide anomaly view' : 'Show anomaly view'}
        </Button>
      </div>
      <p className="mt-3 text-label text-secondary" role="status">
        {busy
          ? 'Waiting for calendar results.'
          : connection === 'demo'
            ? 'Anomalies are unavailable in the synthetic demo.'
            : (item.reason ?? `API-reported comparison for ${periodLabel(selected!)}.`)}
      </p>
      <dl className="my-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-caption text-muted">Historical median</dt>
          <dd className="mt-1 font-mono text-2xl">{format(busy ? null : item.median)}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Difference from median</dt>
          <dd className="mt-1 font-mono text-2xl text-brand">
            {format(busy ? null : item.anomaly, true)}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Difference (%)</dt>
          <dd className="mt-1 font-mono text-2xl">
            {item.percentage === null || busy ? '—' : `${format(item.percentage, true)}%`}
          </dd>
        </div>
      </dl>
      {item.median === 0 && !busy && (
        <p className="mb-3 text-label text-muted">
          Percentage is undefined for a zero historical median.
        </p>
      )}
      <p className="text-caption text-muted">
        Unit: {api?.meta.unit ?? 'not supplied'}. Baseline years:{' '}
        {years.length ? years.join(', ') : 'not supplied'}.
      </p>
      <p className="mt-2 text-caption text-muted">
        Series basis: {api?.meta.anomalyBasis ?? 'not supplied by API'}. Raw sensor selection does
        not change these server-reported comparisons. Positive = above median; negative = below. No
        significance threshold or AI score is assumed.
      </p>
      <div id="anomaly-months" hidden={!expanded} className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-label">
          <caption className="pb-3 text-left text-muted">
            API anomaly values by month. A dash means unavailable; supplied zero remains zero.
          </caption>
          <thead>
            <tr className="border-b border-stroke">
              <th scope="col" className="p-2">
                Month
              </th>
              <th scope="col" className="p-2">
                Median
              </th>
              <th scope="col" className="p-2">
                Difference
              </th>
              <th scope="col" className="p-2">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {(result?.months ?? []).map((month) => {
              const row = anomalyForMonth(result, month.period)
              return (
                <tr key={month.period} className="border-b border-stroke">
                  <th scope="row" className="p-2">
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={selected === month.period}
                      className="min-h-11 rounded-lg px-2 text-horizon hover:bg-control"
                      onClick={() => onSelect(month.period)}
                    >
                      {periodLabel(month.period)}
                    </button>
                  </th>
                  <td className="p-2">{format(busy ? null : row.median)}</td>
                  <td className="p-2">{format(busy ? null : row.anomaly, true)}</td>
                  <td className="p-2">
                    {row.percentage === null || busy ? '—' : `${format(row.percentage, true)}%`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
