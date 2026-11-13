import { ArrowLeft, Info } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { StudyControls } from './components/StudyControls'
import { MapCanvas } from './components/MapCanvas'
import { MonthDetails } from './components/MonthDetails'
import { ActivityCalendar } from './components/ActivityCalendar'
import { useExplorer } from './useExplorer'
import type { DemoScenario } from './model/types'

export default function Explorer({ onOpenMethod }: { onOpenMethod: () => void }) {
  const state = useExplorer()
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
          <Badge tone="warning">Synthetic demo</Badge>
          <Button variant="ghost" size="sm" onClick={onOpenMethod} startIcon={<Info />}>
            Data & method
          </Button>
          <ButtonLink variant="secondary" size="sm" href="#/" startIcon={<ArrowLeft />}>
            Back to Earth
          </ButtonLink>
        </div>
      </header>
      <div className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-control border border-brand/30 bg-brand/5 px-4 py-3">
        <p className="max-w-190 text-label text-horizon">
          <strong>Frontend demo.</strong> The basemap is real; all plotted records and counts are
          synthetic. No NASA observations or harmonized results are connected.
        </p>
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
      </div>
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
        <StudyControls {...state} />
        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
            <MapCanvas
              bounds={state.bounds}
              drawing={state.drawing}
              observations={state.observations}
              onBounds={state.onMapBounds}
              onCancelDraw={state.onCancelDraw}
            />
            <MonthDetails
              result={state.result}
              selected={state.selected}
              mode={state.mode}
              busy={state.busy}
              requestError={state.requestError}
              onRetry={state.onRetry}
              onMethod={onOpenMethod}
              onExport={state.onExport}
            />
          </div>
          <ActivityCalendar
            result={state.result}
            from={state.from}
            to={state.to}
            mode={state.mode}
            selected={state.selected}
            busy={state.busy}
            playing={state.playing}
            onSelect={state.onSelect}
            onPlay={state.onPlay}
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
    </main>
  )
}
