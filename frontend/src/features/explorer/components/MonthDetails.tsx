import { Download, Info } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { periodLabel } from '../model/query'
import type { AnalysisResult, DataView } from '../model/types'

type Props = {
  result: AnalysisResult | null
  selected: string | null
  mode: DataView
  busy: boolean
  requestError: string | null
  onRetry: () => void
  onMethod: () => void
  onExport: () => void
}
export function MonthDetails(p: Props) {
  const month = p.result?.months.find((value) => value.period === p.selected)
  return (
    <aside
      className="flex flex-col rounded-panel border border-stroke bg-panel p-5"
      aria-labelledby="month-heading"
    >
      <p className="eyebrow mb-4">03 / Month in focus</p>
      <h2 id="month-heading" className="text-2xl tracking-tight">
        {p.busy
          ? 'Preparing the demo…'
          : p.mode === 'harmonized'
            ? 'Method under review'
            : p.requestError
              ? 'Could not load'
              : p.selected
                ? periodLabel(p.selected)
                : 'Ready to explore'}
      </h2>
      {p.busy ? (
        <div className="my-8 space-y-3 motion-safe:animate-pulse" role="status">
          <div className="h-12 w-20 rounded-lg bg-control" />
          <p className="text-label text-muted">
            Loading a synthetic fixture, not NASA observations.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 font-display text-6xl text-brand" aria-live="polite">
            {month?.value ?? '—'}
          </p>
          <p className="mt-2 text-label text-muted">
            {p.mode === 'harmonized' ? 'Metric & unit pending' : 'Synthetic records / demo only'}
          </p>
        </>
      )}
      {p.requestError && (
        <div className="mt-5 rounded-lg border border-danger/40 p-3">
          <p className="text-label text-danger" role="alert">
            {p.requestError}
          </p>
          <Button size="sm" variant="secondary" onClick={p.onRetry} className="mt-3">
            Retry sample
          </Button>
        </div>
      )}
      <dl className="my-6 space-y-3 border-y border-stroke py-5 text-label">
        <div>
          <dt className="text-caption text-muted">Source</dt>
          <dd>
            {p.result ? `${p.result.query.source.replaceAll('_', ' ')} · demo` : 'Not loaded'}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Availability</dt>
          <dd>
            {month
              ? month.status === 'unavailable'
                ? 'Unavailable in this fixture'
                : 'Simulated example only'
              : 'Not evaluated'}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Processing</dt>
          <dd>{p.mode === 'harmonized' ? 'Not connected' : 'No harmonization applied'}</dd>
        </div>
      </dl>
      <p className="mb-5 text-label text-secondary">
        {p.mode === 'harmonized'
          ? 'The approved metric, units and comparison method must come from the science team.'
          : p.result?.scenario === 'empty'
            ? 'No demo observations are available for this selection. Try Sample results in Demo scenarios.'
            : month?.value === null
              ? 'This month demonstrates a data gap. It must stay distinct from zero.'
              : month?.value === 0
                ? 'This is an observed-zero fixture for testing the UI, not a real-world result.'
                : 'Generated points and counts let you try the frontend. They are not measured hotspots.'}
      </p>
      <div className="mt-auto space-y-3">
        <Badge tone="warning">Synthetic data</Badge>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={p.onExport}
          disabled={!p.result || !p.selected || month?.value == null || p.busy}
          startIcon={<Download />}
        >
          Export month CSV
        </Button>
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
