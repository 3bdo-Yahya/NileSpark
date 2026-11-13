import { Pause, Play } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { periodLabel } from '../model/query'
import type { AnalysisResult, DataView } from '../model/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function cellColor(value: number | null | undefined): string {
  if (value == null) return 'border-dashed border-stroke bg-space text-muted'
  if (value === 0) return 'border-stroke bg-control text-secondary'
  if (value <= 5) return 'border-[#6D5140] bg-[#4C3C32] text-paper'
  if (value <= 10) return 'border-[#A57350] bg-[#865B3E] text-paper'
  return 'border-brand bg-brand text-on-brand'
}
type Props = {
  result: AnalysisResult | null
  from: string
  to: string
  mode: DataView
  selected: string | null
  busy: boolean
  playing: boolean
  onSelect: (period: string) => void
  onPlay: () => void
}

export function ActivityCalendar(p: Props) {
  const start = Math.min(2025, Math.max(2022, Number(p.from.slice(0, 4)) || 2024))
  const end = Math.min(2025, Math.max(start, Number(p.to.slice(0, 4)) || start))
  const years = Array.from({ length: end - start + 1 }, (_, index) => start + index)
  return (
    <section
      className="min-w-0 rounded-panel border border-stroke bg-panel p-4 sm:p-6"
      aria-labelledby="calendar-heading"
      aria-busy={p.busy}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Through time / calendar</p>
          <h2 id="calendar-heading" className="text-2xl tracking-tight sm:text-3xl">
            Every month, a different signal.
          </h2>
          <p className="mt-2 text-label text-muted">
            {p.mode === 'harmonized'
              ? 'Metric and unit await scientific approval.'
              : 'Synthetic records per month · one demo source at a time.'}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={p.onPlay}
          disabled={!p.result || p.mode === 'harmonized'}
          startIcon={p.playing ? <Pause /> : <Play />}
        >
          {p.playing ? 'Pause season' : 'Play season'}
        </Button>
      </div>
      <div className="max-w-full overflow-x-auto pb-2">
        <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-1.5">
          <caption className="sr-only">
            Monthly synthetic record counts. A dash is unavailable; zero is a generated
            observed-zero example.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="w-14 text-left font-mono text-caption font-normal text-muted"
              >
                Year
              </th>
              {MONTHS.map((month) => (
                <th
                  key={month}
                  scope="col"
                  className="font-mono text-caption font-normal text-muted"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <th scope="row" className="text-left font-mono text-label font-normal">
                  {year}
                </th>
                {MONTHS.map((_, index) => {
                  const period = `${year}-${String(index + 1).padStart(2, '0')}`
                  const month = p.result?.months.find((value) => value.period === period)
                  const selected = p.selected === period
                  const label = `${periodLabel(period)}: ${month ? (month.value === null ? 'demo data unavailable' : `${month.value} synthetic records`) : 'not loaded'}`
                  return (
                    <td key={period}>
                      <button
                        type="button"
                        disabled={!month || p.busy}
                        onClick={() => p.onSelect(period)}
                        aria-label={label}
                        aria-pressed={selected}
                        className={`min-h-11 w-full rounded-lg border font-mono text-label transition-colors enabled:hover:outline-2 enabled:hover:outline-horizon disabled:cursor-default ${cellColor(month?.value)} ${selected ? 'outline-2 outline-offset-2 outline-horizon' : ''}`}
                      >
                        {month?.value ?? '—'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-caption text-muted">
        {p.mode === 'harmonized' ? (
          <span>The scientific color scale will be defined with the approved metric and unit.</span>
        ) : (
          <>
            <span>Demo count: 0 · 1–5 · 6–10 · &gt;10</span>
            <span>— Unavailable</span>
            <span>0 Generated zero, not a claim about real fires</span>
          </>
        )}
      </div>
      <p className="mt-3 text-caption text-muted">
        {p.result
          ? 'Select a month to update the map and detail panel.'
          : 'Choose a study area and run the source demo to populate this layout.'}
        <span className="block sm:hidden">
          Scroll the calendar horizontally to see every month.
        </span>
      </p>
    </section>
  )
}
