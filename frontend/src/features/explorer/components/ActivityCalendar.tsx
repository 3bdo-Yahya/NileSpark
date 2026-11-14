import { Pause, Play } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { periodLabel } from '../model/query'
import type { ConnectionMode, DataView, MonthValue } from '../model/types'
import { adjacentPeriod, revealCalendarMonth } from './calendarNavigation'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ACTIVITY_COLORS = [
  'border-[#6D5140] bg-[#4C3C32] text-paper',
  'border-[#A57350] bg-[#865B3E] text-paper',
  'border-brand bg-brand text-on-brand',
  'border-[#FFE0C4] bg-[#FFE0C4] text-on-brand',
]
function cellColor(value: number | null | undefined, maximum: number): string {
  if (value == null) return 'border-dashed border-stroke bg-space text-muted'
  if (value <= 0 || maximum <= 0) return 'border-stroke bg-control text-secondary'
  const level = Math.min(3, Math.max(0, Math.ceil((value / maximum) * 4) - 1))
  return ACTIVITY_COLORS[level]!
}

type Props = {
  months: MonthValue[]
  loaded: boolean
  from: string
  to: string
  connection: ConnectionMode
  mode: DataView
  selected: string | null
  busy: boolean
  playing: boolean
  onSelect: (period: string) => void
  onPlay: () => void
}
export function ActivityCalendar(p: Props) {
  const start = Math.min(9999, Math.max(1, Number(p.from.slice(0, 4)) || 2025))
  const end = Math.min(9999, start + 10, Math.max(start, Number(p.to.slice(0, 4)) || start))
  const years = Array.from({ length: end - start + 1 }, (_, index) => start + index)
  const maximum = Math.max(0, ...p.months.map((month) => month.value ?? 0))
  const playable = p.months.some((month) => month.value !== null)
  const gridRef = useRef<HTMLTableElement>(null)
  const focusPeriod = p.months.some((month) => month.period === p.selected)
    ? p.selected
    : p.months[0]?.period

  // Keyboard navigation within the calendar grid
  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (!p.loaded || p.busy) return
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)
    )
      return
    const target = event.target
    if (!(target instanceof HTMLButtonElement)) return
    const period = target.getAttribute('data-period')
    if (!period) return

    const allPeriods = p.months.map((m) => m.period)
    event.preventDefault()
    const nextPeriod = adjacentPeriod(allPeriods, period, event.key)
    if (nextPeriod) {
      const nextButton = gridRef.current?.querySelector(
        `[data-period="${nextPeriod}"]`,
      ) as HTMLButtonElement | null
      if (nextButton && !nextButton.disabled) {
        nextButton.focus()
        p.onSelect(nextPeriod)
      }
    }
  }

  // Keep overflowed months visible without scrolling the page or stealing focus.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!p.selected || !scrollRef.current) return
    const btn = scrollRef.current.querySelector(
      `[data-period="${p.selected}"][aria-pressed="true"]`,
    ) as HTMLElement | null
    if (btn) {
      revealCalendarMonth(
        scrollRef.current,
        btn,
        matchMedia('(prefers-reduced-motion: reduce)').matches,
      )
    }
  }, [p.selected])

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
            {p.mode === 'source' ? 'Raw sensor values' : 'Harmonized values'} · color intensity
            relative to the highest displayed month.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={p.onPlay}
          disabled={!playable || p.busy}
          startIcon={p.playing ? <Pause /> : <Play />}
        >
          {p.playing ? 'Pause season' : 'Play season'}
        </Button>
      </div>
      <div className="max-w-full overflow-x-auto pb-2" ref={scrollRef}>
        <table
          ref={gridRef}
          className="w-full min-w-[720px] table-fixed border-separate border-spacing-1.5"
          onKeyDown={onKeyDown}
          role="grid"
          aria-label="Monthly activity calendar grid. Use arrow keys to navigate between months."
        >
          <caption className="sr-only">
            Monthly values. A dash means no value was supplied; zero is displayed only when
            explicitly returned by a non-placeholder source.
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
                  const period = `${String(year).padStart(4, '0')}-${String(index + 1).padStart(2, '0')}`
                  const month = p.months.find((value) => value.period === period)
                  const label = `${periodLabel(period)}: ${month ? (month.value === null ? 'value unavailable' : `${month.value} API value`) : p.loaded ? 'outside the loaded series' : 'not loaded'}`
                  return (
                    <td key={period}>
                      <button
                        type="button"
                        data-period={period}
                        tabIndex={period === focusPeriod ? 0 : -1}
                        disabled={!month || p.busy}
                        onClick={() => p.onSelect(period)}
                        aria-label={label}
                        aria-pressed={p.selected === period}
                        className={`min-h-11 w-full rounded-lg border font-mono text-label transition-[background-color,border-color,outline-offset] duration-150 ease-gentle enabled:hover:outline-2 enabled:hover:outline-horizon disabled:cursor-default motion-reduce:transition-none ${cellColor(month?.value, maximum)} ${p.selected === period ? 'outline-2 outline-offset-2 outline-horizon' : ''}`}
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
        <span>0</span>
        <span className="inline-flex items-center gap-1" aria-hidden="true">
          <span className="h-3 w-4 rounded-sm border border-stroke bg-control" />
          {ACTIVITY_COLORS.map((color) => (
            <span key={color} className={`h-3 w-4 rounded-sm border ${color}`} />
          ))}
        </span>
        <span>Highest displayed value: {maximum.toLocaleString()}</span>
        <span>Relative scale resets when area, dates, sensor or data view changes.</span>
        <span>— Value unavailable</span>
      </div>
      <p className="mt-3 text-caption text-muted">
        {p.loaded
          ? 'Select a month to update its map layer and details. Use arrow keys to navigate the calendar.'
          : 'Choose a study area and load its calendar.'}
        <span className="block sm:hidden">
          Scroll the calendar horizontally to see every month.
        </span>
      </p>
    </section>
  )
}
