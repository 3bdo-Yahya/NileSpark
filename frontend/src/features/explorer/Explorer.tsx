import { ArrowLeft, Info } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { StudyControls } from './components/StudyControls'
import { LazyMapCanvas } from './components/LazyMapCanvas'
import { MonthDetails } from './components/MonthDetails'
import { ActivityCalendar } from './components/ActivityCalendar'
import { AnomalyPanel } from './components/AnomalyPanel'
import { QuerySummary } from './components/QuerySummary'
import { useExplorer } from './useExplorer'
import { ApiMethodDialog } from './components/ApiMethodDialog'
import type { ConnectionMode, DemoScenario } from './model/types'

export default function Explorer({ onOpenMethod }: { onOpenMethod: () => void }) {
  const state = useExplorer()
  const [methodOpen, setMethodOpen] = useState(false)
  const demo = state.connection === 'demo'
  const showMethod = () => (demo ? onOpenMethod() : setMethodOpen(true))
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto min-h-screen max-w-[1800px] px-4 pb-8 sm:px-6 lg:px-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stroke py-5">
        <a
          href="#/"
          className="font-display text-[1.8rem] font-semibold tracking-[-0.065em] no-underline"
          aria-label="BurnCal, back to Earth"
        >
          burncal<span className="text-brand">.</span>
        </a>
        <p className="eyebrow hidden lg:block">Explore / from a place to a pattern</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warning">
            {demo
              ? 'Synthetic demo'
              : state.result?.provenance === 'api-stub'
                ? 'API placeholder'
                : 'API mode'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={showMethod} startIcon={<Info />}>
            Data & method
          </Button>
          <ButtonLink variant="secondary" size="sm" href="#/" startIcon={<ArrowLeft />}>
            Back to Earth
          </ButtonLink>
        </div>
      </header>
      <div className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-control border border-brand/30 bg-brand/5 px-4 py-3">
        <p className="max-w-190 text-label text-horizon">
          {demo ? (
            <>
              <strong>Synthetic demo.</strong> All plotted records and counts are generated for
              frontend testing.
            </>
          ) : state.result?.provenance === 'api-stub' ? (
            <>
              <strong>API connected · placeholder response.</strong> The server has not supplied
              observation results. Placeholder zeros are withheld.
            </>
          ) : (
            <>
              <strong>API mode.</strong> Calendar values come from the server. Map and CSV cover all
              sensors. Coverage and units depend on the API response.
            </>
          )}
        </p>
        <label className="flex items-center gap-2 text-caption text-muted">
          Data connection
          <select
            value={state.connection}
            onChange={(event) => state.onConnection(event.target.value as ConnectionMode)}
            className="min-h-10 rounded-lg border border-stroke-strong bg-raised px-3 text-label text-paper"
          >
            <option value="api">API server</option>
            <option value="demo">Synthetic demo</option>
          </select>
        </label>
        {demo && (
          <label className="flex items-center gap-2 text-caption text-muted">
            Demo scenarios
            <select
              value={state.scenario}
              onChange={(event) => state.onScenario(event.target.value as DemoScenario)}
              className="min-h-10 rounded-lg border border-stroke-strong bg-raised px-3 text-label text-paper"
            >
              <option value="sample">Sample results</option>
              <option value="empty">No observations</option>
              <option value="error">Request failure</option>
            </select>
          </label>
        )}
      </div>
      <QuerySummary
        bounds={state.bounds}
        areaName={state.areaName}
        from={state.from}
        to={state.to}
        selected={state.selected}
        connection={state.connection}
        mode={state.mode}
        apiSensor={state.apiSensor}
        result={state.result}
        busy={state.busy}
        unapplied={state.unapplied}
      />
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
        <StudyControls {...state} />
        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="flex min-w-0 flex-col gap-3">
              <LazyMapCanvas
                bounds={state.bounds}
                drawing={state.drawing}
                observations={state.observations}
                connection={state.connection}
                cells={state.map.data?.cells ?? null}
                period={state.selected}
                onBounds={state.onMapBounds}
                onCancelDraw={state.onCancelDraw}
              />
              {!demo && (
                <div
                  className="rounded-control border border-stroke bg-panel p-3 text-label text-secondary"
                  role="status"
                >
                  {state.map.busy ? (
                    'Loading the selected month’s API map layer…'
                  ) : state.map.error ? (
                    <>
                      <p className="text-danger">
                        {state.map.error} Calendar results are preserved.
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={state.map.retry}
                      >
                        Retry map layer
                      </Button>
                    </>
                  ) : state.map.data?.stub ? (
                    'Map endpoint returned a placeholder; no observation cells are shown.'
                  ) : state.map.data ? (
                    `${state.map.data.cells.features.length} API cell centroids · all sensors · ${state.selected}. Empty geometry alone does not establish coverage or no activity.`
                  ) : (
                    'Load a calendar to request its selected month’s map cells.'
                  )}
                </div>
              )}
            </div>
            <MonthDetails
              result={state.result}
              months={state.months}
              connection={state.connection}
              apiSensor={state.apiSensor}
              selected={state.selected}
              mode={state.mode}
              busy={state.busy}
              requestError={state.requestError}
              onRetry={state.onRetry}
              onMethod={showMethod}
              onExport={state.onExport}
              exportBusy={state.exportBusy}
              exportError={state.exportError}
              onCancelExport={state.onCancelExport}
            />
          </div>
          <ActivityCalendar
            months={state.months}
            loaded={state.result !== null}
            connection={state.connection}
            from={state.from}
            to={state.to}
            mode={state.mode}
            selected={state.selected}
            busy={state.busy}
            playing={state.playing}
            onSelect={state.onSelect}
            onPlay={state.onPlay}
          />
          <AnomalyPanel
            connection={state.connection}
            result={state.result}
            selected={state.selected}
            busy={state.busy}
            onSelect={state.onSelect}
          />
          <p className="min-h-6 text-label text-muted" role="status" aria-live="polite">
            {state.notice}
          </p>
        </div>
      </div>
      <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-stroke pt-5 text-caption text-muted">
        <p>NileSpark / BurnCal · demonstration interface</p>
        <a href="#/foundations">Interface foundations ↗</a>
      </footer>
      <ApiMethodDialog open={methodOpen} onClose={() => setMethodOpen(false)} />
    </main>
  )
}
