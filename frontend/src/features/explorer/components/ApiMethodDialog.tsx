import { useEffect, useState } from 'react'
import { Dialog } from '../../../components/ui/Dialog'
import { Button } from '../../../components/ui/Button'
import { analysisApi } from '../services/api'
import type { Methodology } from '../services/apiAnalysis'

export function ApiMethodDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{
    busy: boolean
    data: Methodology | null
    error: string | null
  }>({ busy: false, data: null, error: null })
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    async function load() {
      setState({ busy: true, data: null, error: null })
      try {
        const data = await analysisApi.methodology(controller.signal)
        if (!controller.signal.aborted) setState({ busy: false, data, error: null })
      } catch (reason) {
        if (!controller.signal.aborted)
          setState({
            busy: false,
            data: null,
            error: reason instanceof Error ? reason.message : 'Methodology could not load.',
          })
      }
    }
    void load()
    return () => controller.abort()
  }, [open, attempt])
  return (
    <Dialog open={open} onClose={onClose} title="Data and method from the API">
      <p>
        Source values retain sensor-specific meaning. Harmonization and its scientific
        interpretation belong to the science team. A missing month is not an observed zero.
      </p>
      {state.busy && <p role="status">Loading API methodology…</p>}
      {state.error && (
        <div>
          <p role="alert" className="text-danger">
            {state.error}
          </p>
          <Button onClick={() => setAttempt((value) => value + 1)} size="sm" variant="secondary">
            Retry methodology
          </Button>
        </div>
      )}
      {state.data && (
        <>
          <p
            className={
              state.data.stub
                ? 'rounded-lg border border-brand/40 bg-brand/5 p-3 text-horizon'
                : 'text-secondary'
            }
          >
            {state.data.stub
              ? 'API placeholder methodology. These parameters are not a validated scientific result.'
              : 'Methodology reported by the API; it is not independent scientific validation.'}
          </p>
          <p>{state.data.plainLanguage ?? 'No plain-language explanation supplied.'}</p>
          <dl className="grid grid-cols-2 gap-3 text-label">
            <dt>Method version</dt>
            <dd>{state.data.methodVersion ?? 'Not supplied'}</dd>
            <dt>Grid spacing</dt>
            <dd>
              {state.data.gridDegrees === null
                ? 'Not supplied'
                : `${state.data.gridDegrees}° (API-reported)`}
            </dd>
            <dt>Overlap years</dt>
            <dd>{state.data.overlapYears.join(', ') || 'Not supplied'}</dd>
            <dt>Global factor</dt>
            <dd>
              {state.data.stub
                ? 'Placeholder withheld'
                : (state.data.globalFactor ?? 'Not supplied')}
            </dd>
          </dl>
          <p>
            The applied AOI factor, when supplied, is shown with the calendar. A global factor is
            not automatically applied by this frontend.
          </p>
        </>
      )}
      <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noreferrer">
        NASA FIRMS source reference ↗
      </a>
    </Dialog>
  )
}
