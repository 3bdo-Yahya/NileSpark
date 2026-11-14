import { Download, Info } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { periodLabel } from '../model/query'
import type {
  ApiSensor,
  ConnectionMode,
  DataView,
  ExplorerResult,
  MonthValue,
} from '../model/types'

type Props = {
  result: ExplorerResult | null
  months: MonthValue[]
  selected: string | null
  mode: DataView
  connection: ConnectionMode
  apiSensor: ApiSensor
  busy: boolean
  requestError: string | null
  exportBusy: boolean
  exportError: string | null
  onRetry: () => void
  onMethod: () => void
  onExport: () => void
  onCancelExport: () => void
}
export function MonthDetails(p: Props) {
  const month = p.months.find((value) => value.period === p.selected)
  const demo = p.connection === 'demo'
  const stub = p.result?.provenance === 'api-stub'
  const api = p.result && p.result.provenance !== 'synthetic-demo' ? p.result : null
  const pending = demo && p.mode === 'harmonized'

  // Extract both raw sensor values for the selected month when in API mode
  const apiMonth = api && p.selected ? api.months.find((m) => m.period === p.selected) : null

  const rawModis = apiMonth?.rawBySensor.modis ?? null
  const rawViirs = apiMonth?.rawBySensor.viirs ?? null
  const harmonizedValue = apiMonth?.harmonized ?? null

  return (
    <aside
      className="flex flex-col rounded-panel border border-stroke bg-panel p-5"
      aria-labelledby="month-heading"
    >
      <p className="eyebrow mb-4">03 / Month in focus</p>
      <h2 id="month-heading" className="text-2xl tracking-tight">
        {p.busy
          ? 'Loading calendar…'
          : p.requestError
            ? 'Could not load'
            : pending
              ? 'Method under review'
              : p.selected
                ? periodLabel(p.selected)
                : 'Ready to explore'}
      </h2>
      {p.busy ? (
        <div className="my-8 space-y-3 motion-safe:animate-pulse" role="status">
          <div className="h-12 w-20 rounded-lg bg-control" />
          <p className="text-label text-muted">
            {demo ? 'Loading a synthetic fixture.' : 'Waiting for the API response.'}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 break-words font-display text-6xl text-brand" aria-live="polite">
            {month?.value == null
              ? '—'
              : new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(month.value)}
          </p>
          <p className="mt-2 text-label text-muted">
            {pending
              ? 'Metric & unit pending'
              : demo
                ? 'Synthetic records / demo only'
                : p.mode === 'source' && api?.meta.methodVersion === 'v2'
                  ? 'Fire cell-days'
                  : (api?.meta.unit ?? 'Unit not supplied by API')}
          </p>

          {/* Display which view is active: Raw sensor or Harmonized */}
          {api && !stub && p.selected && (
            <div className="mt-3 rounded-lg border border-stroke bg-space/40 px-3 py-2.5">
              <p className="mb-2 font-mono text-caption text-muted uppercase">
                {p.mode === 'source' ? 'Showing: raw sensor value' : 'Showing: harmonized series'}
              </p>
              {p.mode === 'source' ? (
                <p className="text-label text-secondary">
                  <span className="text-paper">{p.apiSensor.toUpperCase()}</span> family ={' '}
                  {rawModis !== null || rawViirs !== null ? (
                    <span className="font-mono text-brand">
                      {p.apiSensor === 'modis'
                        ? rawModis !== null
                          ? new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(
                              rawModis,
                            )
                          : '—'
                        : rawViirs !== null
                          ? new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(
                              rawViirs,
                            )
                          : '—'}
                    </span>
                  ) : (
                    <span className="text-muted">no value supplied</span>
                  )}
                </p>
              ) : (
                <p className="text-label text-secondary">
                  Server-reported value ={' '}
                  {harmonizedValue !== null ? (
                    <span className="font-mono text-brand">
                      {new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(
                        harmonizedValue,
                      )}
                    </span>
                  ) : (
                    <span className="text-muted">no value supplied</span>
                  )}
                </p>
              )}

              {/* Show both sensors side-by-side for context */}
              {p.mode === 'source' && (rawModis !== null || rawViirs !== null) && (
                <div className="mt-2 flex flex-wrap gap-3 border-t border-stroke/50 pt-2 font-mono text-caption text-muted">
                  <span>
                    MODIS:{' '}
                    {rawModis !== null
                      ? new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(rawModis)
                      : '—'}
                  </span>
                  <span>
                    VIIRS:{' '}
                    {rawViirs !== null
                      ? new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(rawViirs)
                      : '—'}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {p.requestError && (
        <div className="mt-5 rounded-lg border border-danger/40 p-3">
          <p className="text-label text-danger" role="alert">
            {p.requestError}
          </p>
          <Button size="sm" variant="secondary" onClick={p.onRetry} className="mt-3">
            {demo ? 'Retry sample' : 'Retry API request'}
          </Button>
        </div>
      )}
      <dl className="my-6 space-y-3 border-y border-stroke py-5 text-label">
        <div>
          <dt className="text-caption text-muted">Source</dt>
          <dd>
            {!p.result
              ? 'Not loaded'
              : p.result.provenance === 'synthetic-demo'
                ? `${p.result.query.source.replaceAll('_', ' ')} · demo`
                : p.mode === 'source'
                  ? `${p.apiSensor === 'viirs' ? 'VIIRS S-NPP' : 'MODIS'} · raw cell-days`
                  : 'API harmonized series'}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Availability</dt>
          <dd>
            {stub
              ? 'API placeholder; values withheld'
              : !month
                ? 'Not evaluated'
                : demo
                  ? month.value === null
                    ? 'Unavailable in this fixture'
                    : 'Simulated example only'
                  : month.value === null
                    ? 'No value supplied for this month'
                    : 'Value supplied; coverage not reported'}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Processing</dt>
          <dd>
            {api
              ? (api.meta.methodVersion ?? 'Method version not supplied')
              : !demo
                ? 'Not loaded'
                : pending
                  ? 'Not connected'
                  : 'No harmonization applied'}
          </dd>
        </div>
        {api && (
          <div>
            <dt className="text-caption text-muted">MODIS conversion factor</dt>
            <dd>{stub ? 'Placeholder withheld' : (api.meta.k ?? 'Not supplied')}</dd>
          </div>
        )}
      </dl>
      <p className="mb-5 text-label text-secondary">
        {stub
          ? 'The server is connected but its response is a stub. Placeholder zeros are not evidence of no activity.'
          : pending
            ? 'The approved metric, units and comparison method must come from the science team.'
            : !demo
              ? 'Raw and harmonized values follow the API contract. Missing values do not establish coverage or absence of fire.'
              : month?.value === null
                ? 'This fixture is unavailable; it must stay distinct from zero.'
                : month?.value === 0
                  ? 'Generated zero for UI testing, not a real-world result.'
                  : 'Generated points and counts demonstrate the frontend. They are not NASA observations.'}
      </p>
      <div className="mt-auto space-y-3">
        <Badge tone="warning">
          {demo
            ? 'Synthetic data'
            : !p.result
              ? 'Awaiting API'
              : stub
                ? 'API placeholder'
                : 'API response'}
        </Badge>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={p.onExport}
          loading={p.exportBusy}
          disabled={!p.result || !p.selected || p.busy || pending || (demo && month?.value == null)}
          startIcon={<Download />}
        >
          {p.exportBusy ? 'Exporting…' : 'Export month CSV'}
        </Button>
        {!demo && (
          <p className="text-caption text-muted">
            All sensors, clipped to this month and your applied dates. Placeholder exports are not
            downloaded.
          </p>
        )}
        {p.exportBusy && (
          <Button variant="ghost" size="sm" onClick={p.onCancelExport}>
            Cancel CSV request
          </Button>
        )}
        {p.exportError && (
          <p role="alert" className="text-label text-danger">
            {p.exportError}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={p.onMethod}
          startIcon={<Info />}
        >
          Data & method
        </Button>
      </div>
    </aside>
  )
}
