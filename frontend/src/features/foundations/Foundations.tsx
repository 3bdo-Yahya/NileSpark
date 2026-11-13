import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, Info, RotateCcw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Surface } from '../../components/ui/Surface'
import { TextField } from '../../components/ui/TextField'

const colors = [
  { name: 'Deep space', token: '--color-space', hex: '#060B11', className: 'bg-space' },
  { name: 'Observatory', token: '--color-panel', hex: '#0D151E', className: 'bg-panel' },
  { name: 'Signal orange', token: '--color-brand', hex: '#F3A66B', className: 'bg-brand' },
  { name: 'Warm horizon', token: '--color-horizon', hex: '#EAC8AB', className: 'bg-horizon' },
  { name: 'Paper white', token: '--color-paper', hex: '#F7F5EF', className: 'bg-paper' },
  { name: 'Focus cyan', token: '--color-focus', hex: '#91D9DF', className: 'bg-focus' },
] as const

export default function Foundations({ onOpenMethod }: { onOpenMethod: () => void }) {
  const [message, setMessage] = useState('Choose a button to preview its interaction.')
  const [areaName, setAreaName] = useState('Upper Egypt')
  const [submitted, setSubmitted] = useState(false)
  const [view, setView] = useState<'harmonized' | 'source'>('harmonized')
  const invalidName = submitted && !areaName.trim()

  return (
    <section
      className="section-shell py-[clamp(4rem,8vw,8rem)]"
      id="foundations"
      aria-labelledby="foundations-title"
    >
      <div className="flex flex-col items-start justify-between gap-6 pb-12 md:flex-row md:items-end md:gap-12 md:pb-16 [&_h2]:mt-5 [&_h2_span]:text-horizon">
        <div>
          <p className="eyebrow">BurnCal / interface foundations / 01</p>
          <h2 id="foundations-title">
            One system.
            <br />
            <span>Every detail, considered.</span>
          </h2>
        </div>
        <p className="max-w-90 text-muted">
          The colors, typography and reusable controls behind the observatory. A working UI preview,
          with no scientific data attached.
        </p>
      </div>
      <section className="border-t border-stroke pt-10 pb-12" aria-labelledby="palette-title">
        <div className="mb-8 grid gap-3 [&>p:last-child:not(.eyebrow)]:max-w-170 [&>p:last-child:not(.eyebrow)]:text-label [&>p:last-child:not(.eyebrow)]:text-muted">
          <p className="eyebrow">01 / Color language</p>
          <h3 id="palette-title">Space, warmth, clarity.</h3>
          <p>
            Orange marks an action or selection. Scientific activity colors will follow the approved
            metric.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {colors.map((color) => (
            <div
              className="min-w-0 overflow-hidden rounded-control border border-stroke [&>div:last-child]:p-4 [&_h4]:mb-2 [&_h4]:text-label [&_h4]:font-medium [&_p]:font-mono [&_p]:text-[10px] [&_p]:text-muted [&_code]:font-mono [&_code]:text-[10px] [&_code]:break-all [&_code]:text-muted"
              key={color.token}
            >
              <div className={`h-24 border-b border-stroke ${color.className}`} />
              <div>
                <h4>{color.name}</h4>
                <p>{color.hex}</p>
                <code>{color.token}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stroke pt-10 pb-12" aria-labelledby="type-title">
        <div className="mb-8 grid gap-3 [&>p:last-child:not(.eyebrow)]:max-w-170 [&>p:last-child:not(.eyebrow)]:text-label [&>p:last-child:not(.eyebrow)]:text-muted">
          <p className="eyebrow">02 / Typography</p>
          <h3 id="type-title">A human view of technical data.</h3>
        </div>
        <div className="grid gap-6 md:grid-cols-[1.15fr_1fr] [&>div]:flex [&>div]:flex-col [&>div]:items-start [&>div]:gap-6 [&_.text-muted]:text-label">
          <Surface>
            <p className="eyebrow">Space Grotesk / display</p>
            <p className="py-4 font-display text-[clamp(2rem,3.7vw,3.75rem)] leading-[1.15] font-medium tracking-[-0.05em] [&>span]:text-horizon">
              A global question.
              <br />
              <span>A local story.</span>
            </p>
            <p className="text-muted">Headlines with room to breathe.</p>
          </Surface>
          <Surface>
            <p className="eyebrow">Inter / body</p>
            <p className="text-[1.4rem] leading-relaxed">
              Follow the patterns.
              <br />
              Keep the evidence close.
            </p>
            <p className="text-muted">Readable controls, descriptions and data context.</p>
            <div className="mt-auto w-full border-t border-stroke pt-4 [&>p+p]:mt-3 [&>p+p]:font-mono [&>p+p]:text-[11px] [&>p+p]:break-words">
              <p className="eyebrow">IBM Plex Mono / labels</p>
              <p>AOI / 31°E · 24°N → 33°E · 26°N</p>
            </div>
          </Surface>
        </div>
      </section>

      <section className="border-t border-stroke pt-10 pb-12" aria-labelledby="controls-title">
        <div className="mb-8 grid gap-3 [&>p:last-child:not(.eyebrow)]:max-w-170 [&>p:last-child:not(.eyebrow)]:text-label [&>p:last-child:not(.eyebrow)]:text-muted">
          <p className="eyebrow">03 / Actions & states</p>
          <h3 id="controls-title">A clear next step.</h3>
          <p>Pointer, keyboard, focus, disabled and loading states share one component.</p>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Surface className="grid content-start gap-6">
            <div className="flex flex-col items-stretch gap-3 min-[441px]:flex-row min-[441px]:flex-wrap min-[441px]:items-center">
              <Button
                endIcon={<ArrowRight />}
                onClick={() => setMessage('Primary action activated. This is a UI component demo.')}
              >
                Primary action
              </Button>
              <Button
                variant="secondary"
                startIcon={<RotateCcw />}
                onClick={() => {
                  setMessage('Preview reset.')
                  setAreaName('Upper Egypt')
                  setSubmitted(false)
                }}
              >
                Reset preview
              </Button>
              <Button variant="ghost" endIcon={<ArrowUpRight />} onClick={onOpenMethod}>
                Data & method
              </Button>
            </div>
            <div className="flex flex-col items-stretch gap-3 min-[441px]:flex-row min-[441px]:flex-wrap min-[441px]:items-center">
              <Button size="sm" onClick={() => setMessage('Compact action activated.')}>
                Compact action
              </Button>
              <Button disabled>Unavailable</Button>
              <Button loading variant="secondary">
                Preparing…
              </Button>
            </div>
            <p
              className="flex min-h-14 items-start gap-2.5 border-t border-stroke pt-4 text-label text-muted [&>svg]:mt-1 [&>svg]:shrink-0 [&>svg]:text-brand"
              role="status"
              aria-live="polite"
            >
              <Check size={15} aria-hidden="true" />
              {message}
            </p>
          </Surface>
          <Surface>
            <p className="eyebrow">Semantic status / UI examples</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>Not connected</Badge>
              <Badge tone="info">Information</Badge>
              <Badge tone="success">Action complete</Badge>
              <Badge tone="warning">Method under review</Badge>
              <Badge tone="error">Request failed</Badge>
            </div>
            <p className="mt-6 text-label text-muted">
              Labels communicate meaning alongside color. These are component examples, not analysis
              results.
            </p>
          </Surface>
        </div>
      </section>

      <section className="border-t border-stroke pt-10 pb-12" aria-labelledby="inputs-title">
        <div className="mb-8 grid gap-3 [&>p:last-child:not(.eyebrow)]:max-w-170 [&>p:last-child:not(.eyebrow)]:text-label [&>p:last-child:not(.eyebrow)]:text-muted">
          <p className="eyebrow">04 / Inputs & surfaces</p>
          <h3 id="inputs-title">Context stays in view.</h3>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Surface>
            <form
              className="grid justify-items-start gap-6 [&>div]:w-full"
              onSubmit={(event) => {
                event.preventDefault()
                setSubmitted(true)
                if (areaName.trim())
                  setMessage(
                    `Preview label saved: ${areaName.trim()}. No analysis request was sent.`,
                  )
              }}
              noValidate
            >
              <TextField
                label="Study-area label / UI example"
                value={areaName}
                onChange={(event) => setAreaName(event.target.value)}
                maxLength={80}
                required
                hint="A display label only. Drawing an AOI will be a separate feature."
                {...(invalidName ? { error: 'Enter a label before saving.' } : {})}
              />
              <Button type="submit" variant="secondary" endIcon={<Check />}>
                Save preview label
              </Button>
            </form>
          </Surface>
          <Surface>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="eyebrow">Data view / presentation preview</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                <label className="relative cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="data-view"
                    value="harmonized"
                    checked={view === 'harmonized'}
                    onChange={() => setView('harmonized')}
                  />
                  <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stroke-strong px-3.5 py-2.5 text-caption peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus">
                    Harmonized
                  </span>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="data-view"
                    value="source"
                    checked={view === 'source'}
                    onChange={() => setView('source')}
                  />
                  <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stroke-strong px-3.5 py-2.5 text-caption peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus">
                    Source observations
                  </span>
                </label>
              </div>
            </fieldset>
            <div
              className="mt-6 flex min-h-24 gap-3 text-label text-secondary [&>svg]:mt-1 [&>svg]:shrink-0 [&>svg]:text-horizon"
              aria-live="polite"
            >
              <Info size={18} aria-hidden="true" />
              <p>
                {view === 'harmonized'
                  ? 'Comparison output will use the approved scientific method. Metric and unit are still to be defined.'
                  : 'Sensor-specific source values, before BurnCal’s additional cross-sensor processing. NASA may already have processed the source product.'}
              </p>
            </div>
            <p className="mt-6 text-label text-muted [&>span]:mr-2 [&>span]:inline-block [&>span]:font-mono [&>span]:text-xl [&>span]:text-paper">
              <span>—</span> Unavailable is different from an observed zero.
            </p>
          </Surface>
        </div>
      </section>
      <div className="mt-4 flex flex-wrap items-start gap-4 rounded-control border border-stroke bg-panel px-6 py-5 sm:items-center [&>svg]:shrink-0 [&>svg]:text-brand [&>p]:min-w-48 [&>p]:flex-1 [&>p]:text-label [&>p]:text-muted [&_strong]:font-medium [&_strong]:text-paper">
        <Info size={18} aria-hidden="true" />
        <p>
          <strong>Foundation milestone.</strong> Visual system and reusable UI only. Map drawing,
          live analysis, calendar metrics and export are separate implementation steps.
        </p>
        <Badge tone="warning">No observations loaded</Badge>
      </div>
    </section>
  )
}
