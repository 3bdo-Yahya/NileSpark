import { MapPin, RotateCcw, Scan, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { coordinateKeys, DEMO_FROM, DEMO_TO } from '../model/query'
import { PRESETS } from '../model/types'
import type { Bounds, CoordinateDraft, DataView, ObservationSource } from '../model/types'

type Props = {
  areaName: string
  bounds: Bounds | null
  draft: CoordinateDraft
  from: string
  to: string
  source: ObservationSource
  mode: DataView
  drawing: boolean
  busy: boolean
  unapplied: boolean
  error: string | null
  onPreset: (id: string) => void
  onCoordinate: (key: keyof Bounds, value: string) => void
  onApply: () => void
  onDate: (key: 'from' | 'to', value: string) => void
  onSource: (source: ObservationSource) => void
  onMode: (mode: DataView) => void
  onDraw: () => void
  onReset: () => void
  onAnalyze: () => void
  onCancel: () => void
}
const selectClass =
  'mt-2 min-h-12 w-full rounded-lg border border-stroke-strong bg-raised px-3 text-label text-paper'

export function StudyControls(p: Props) {
  return (
    <aside className="min-w-0 rounded-panel border border-stroke bg-panel">
      <details open className="group">
        <summary className="cursor-pointer list-none border-b border-stroke px-5 py-5 [&::-webkit-details-marker]:hidden">
          <span className="eyebrow">01 / Your study area</span>
          <span className="mt-2 flex items-center justify-between gap-3 font-display text-2xl">
            <span>{p.areaName}</span>
            <MapPin size={18} className="shrink-0 text-brand" aria-hidden="true" />
          </span>
          <span className="mt-2 block text-caption text-muted lg:hidden">
            Tap to collapse or expand controls
          </span>
        </summary>
        <div className="space-y-5 px-5 py-5">
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.id}
                size="sm"
                variant={p.areaName === preset.name ? 'primary' : 'secondary'}
                onClick={() => p.onPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={p.drawing ? 'primary' : 'secondary'}
              size="sm"
              onClick={p.onDraw}
              startIcon={p.drawing ? <X /> : <Scan />}
            >
              {p.drawing ? 'Cancel drawing' : 'Draw rectangle'}
            </Button>
            <Button variant="ghost" size="sm" onClick={p.onReset} startIcon={<RotateCcw />}>
              Reset
            </Button>
          </div>
          <p className="text-caption leading-relaxed text-muted" role="status">
            {p.drawing
              ? 'Click two opposite corners on the map. Press Escape to cancel.'
              : 'Draw on the map, or enter bounds below for keyboard access.'}
          </p>
          <details className="rounded-lg border border-stroke px-3 py-3">
            <summary className="cursor-pointer text-label text-secondary">
              Coordinates / manual input
            </summary>
            <p className="mt-3 font-mono text-[10px] text-muted">
              {p.bounds
                ? `W ${p.bounds.west} · S ${p.bounds.south} · E ${p.bounds.east} · N ${p.bounds.north}`
                : 'No AOI selected'}
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                p.onApply()
              }}
              noValidate
              className="mt-3 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                {coordinateKeys.map((key) => (
                  <TextField
                    key={key}
                    label={`${key} (°)`}
                    type="number"
                    step="any"
                    min={key === 'west' || key === 'east' ? -180 : -85}
                    max={key === 'west' || key === 'east' ? 180 : 85}
                    value={p.draft[key]}
                    onChange={(event) => p.onCoordinate(key, event.target.value)}
                  />
                ))}
              </div>
              <Button variant="secondary" size="sm" type="submit" className="w-full">
                Apply coordinates
              </Button>
              {p.unapplied && (
                <p className="text-caption text-warning">
                  Apply the edited coordinates before running the demo.
                </p>
              )}
            </form>
          </details>
          <div className="border-t border-stroke pt-5">
            <p className="eyebrow mb-4">02 / Time & source</p>
            <div className="grid gap-3">
              <TextField
                label="From"
                type="date"
                value={p.from}
                min={DEMO_FROM}
                max={DEMO_TO}
                onChange={(event) => p.onDate('from', event.target.value)}
              />
              <TextField
                label="To"
                type="date"
                value={p.to}
                min={DEMO_FROM}
                max={DEMO_TO}
                onChange={(event) => p.onDate('to', event.target.value)}
              />
            </div>
            <p className="mt-3 text-caption text-muted">
              Synthetic demo: 2022–2025. Dates are inclusive, in UTC.
            </p>
            <label className="eyebrow mt-5 block" htmlFor="observation-source">
              Source / demo only
            </label>
            <select
              id="observation-source"
              value={p.source}
              className={selectClass}
              onChange={(event) => p.onSource(event.target.value as ObservationSource)}
            >
              <option value="VIIRS_NOAA20">VIIRS NOAA-20 · demo</option>
              <option value="MODIS">MODIS · demo</option>
            </select>
          </div>
          <fieldset className="min-w-0 border-t border-stroke pt-5">
            <legend className="eyebrow pt-4">Data view</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['source', 'harmonized'] as const).map((mode) => (
                <label className="relative cursor-pointer" key={mode}>
                  <input
                    className="peer sr-only"
                    name="explorer-data-view"
                    type="radio"
                    checked={p.mode === mode}
                    onChange={() => p.onMode(mode)}
                  />
                  <span className="flex min-h-11 items-center rounded-lg border border-stroke-strong px-3 text-caption peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus">
                    {mode === 'source' ? 'Source demo' : 'Harmonized · pending'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {p.error && (
            <p
              className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-label text-danger"
              role="alert"
            >
              {p.error}
            </p>
          )}
          <Button
            className="w-full"
            onClick={p.onAnalyze}
            loading={p.busy}
            disabled={!p.bounds || p.unapplied || p.mode === 'harmonized'}
          >
            {p.busy ? 'Preparing demo…' : 'Run source demo →'}
          </Button>
          {p.busy && (
            <Button className="w-full" variant="ghost" size="sm" onClick={p.onCancel}>
              Cancel request
            </Button>
          )}
          <p className="text-caption text-muted">
            {p.mode === 'harmonized'
              ? 'Scientific metric, unit and harmonization are not connected.'
              : 'All generated records are synthetic. No NASA analysis is requested.'}
          </p>
        </div>
      </details>
    </aside>
  )
}
