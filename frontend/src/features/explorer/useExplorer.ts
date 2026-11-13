import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { boundsMatch, parseBounds, toDraft, validateQuery } from './model/query'
import { PRESETS } from './model/types'
import type {
  AnalysisResult,
  Bounds,
  DataView,
  DemoScenario,
  ObservationSource,
} from './model/types'
import { demoAnalysis } from './services/demoAnalysis'
import { downloadMonthCsv } from './services/exportCsv'

export function useExplorer() {
  const [bounds, setBounds] = useState<Bounds | null>({ ...PRESETS[0].bounds })
  const [draft, setDraft] = useState(toDraft(PRESETS[0].bounds))
  const [areaName, setAreaName] = useState<string>(PRESETS[0].name)
  const [from, setFrom] = useState('2022-01-01')
  const [to, setTo] = useState('2024-12-31')
  const [source, setSource] = useState<ObservationSource>('VIIRS_NOAA20')
  const [mode, setMode] = useState<DataView>('source')
  const [scenario, setScenario] = useState<DemoScenario>('sample')
  const [drawing, setDrawing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [notice, setNotice] = useState('Choose a region, then run the synthetic source demo.')
  const active = useRef<AbortController | null>(null)

  const invalidate = useCallback(() => {
    active.current?.abort()
    active.current = null
    setBusy(false)
    setResult(null)
    setSelected(null)
    setPlaying(false)
    setError(null)
    setRequestError(null)
    setNotice('Selection changed. Run the demo to refresh the result.')
  }, [])
  const setArea = useCallback(
    (value: Bounds, name: string) => {
      invalidate()
      setBounds(value)
      setDraft(toDraft(value))
      setAreaName(name)
      setDrawing(false)
      setNotice(`Selected ${name}. No analysis has been run for this selection.`)
    },
    [invalidate],
  )
  const onMapBounds = useCallback((value: Bounds) => setArea(value, 'Custom area'), [setArea])
  const onCancelDraw = useCallback(() => setDrawing(false), [])
  useEffect(() => () => active.current?.abort(), [])
  useEffect(() => {
    if (!playing || !result) return
    const timer = setInterval(
      () =>
        setSelected((previous) => {
          const index = result.months.findIndex((month) => month.period === previous)
          return result.months[(index + 1) % result.months.length]?.period ?? null
        }),
      1100,
    )
    return () => clearInterval(timer)
  }, [playing, result])

  async function analyze(override?: DemoScenario) {
    setError(null)
    setRequestError(null)
    setPlaying(false)
    if (!bounds || !boundsMatch(draft, bounds)) {
      setError('Choose an area and apply its coordinates first.')
      return
    }
    if (mode === 'harmonized') {
      setError('The harmonization method is not connected. Select Source demo.')
      return
    }
    const query = { bounds, from, to, source }
    const validation = validateQuery(query)
    if (validation) {
      setError(validation)
      return
    }
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    const selectedScenario = override ?? scenario
    if (override) setScenario(override)
    setBusy(true)
    setResult(null)
    setSelected(null)
    setDrawing(false)
    setNotice('Preparing the synthetic demo…')
    try {
      const output = await demoAnalysis.analyze(query, controller.signal, selectedScenario)
      if (controller.signal.aborted || active.current !== controller) return
      setResult(output)
      setSelected(
        output.months.find((month) => month.value !== null && month.value > 0)?.period ??
          output.months[0]?.period ??
          null,
      )
      setNotice(
        output.scenario === 'empty'
          ? 'No observations are available in this synthetic fixture.'
          : 'Synthetic demo loaded. Select a month to inspect its generated records.',
      )
    } catch (reason) {
      if (controller.signal.aborted || active.current !== controller) return
      setRequestError(reason instanceof Error ? reason.message : 'The demo could not load.')
      setNotice('The demo request failed. Your inputs are preserved.')
    } finally {
      if (active.current === controller) {
        setBusy(false)
        active.current = null
      }
    }
  }
  const observations = useMemo(
    () => result?.observations.filter((record) => record.period === selected) ?? [],
    [result, selected],
  )

  return {
    bounds,
    draft,
    areaName,
    from,
    to,
    source,
    mode,
    scenario,
    drawing,
    busy,
    error,
    requestError,
    result,
    selected,
    playing,
    notice,
    observations,
    unapplied: !boundsMatch(draft, bounds) && bounds !== null,
    onMapBounds,
    onCancelDraw,
    onPreset: (id: string) => {
      const preset = PRESETS.find((value) => value.id === id)
      if (preset) setArea({ ...preset.bounds }, preset.name)
    },
    onCoordinate: (key: keyof Bounds, value: string) => {
      invalidate()
      setDraft((previous) => ({ ...previous, [key]: value }))
    },
    onApply: () => {
      const parsed = parseBounds(draft)
      if (!parsed) {
        setError('Enter valid bounds: west < east, south < north; longitude ±180°, latitude ±85°.')
        return
      }
      setArea(parsed, 'Custom area')
    },
    onDate: (key: 'from' | 'to', value: string) => {
      invalidate()
      if (key === 'from') setFrom(value)
      else setTo(value)
    },
    onSource: (value: ObservationSource) => {
      invalidate()
      setSource(value)
    },
    onMode: (value: DataView) => {
      invalidate()
      setMode(value)
    },
    onScenario: (value: DemoScenario) => {
      invalidate()
      setScenario(value)
    },
    onDraw: () => {
      if (!drawing) invalidate()
      setDrawing((value) => !value)
    },
    onReset: () => {
      invalidate()
      setBounds(null)
      setDraft(toDraft(null))
      setAreaName('Choose a region')
      setDrawing(false)
      setNotice('Area cleared. Draw a new rectangle or enter coordinates.')
    },
    onCancel: () => {
      invalidate()
      setNotice('Demo request cancelled.')
    },
    onAnalyze: () => {
      void analyze()
    },
    onRetry: () => {
      void analyze('sample')
    },
    onSelect: (period: string) => {
      setSelected(period)
      setPlaying(false)
    },
    onPlay: () => setPlaying((value) => !value),
    onExport: () => {
      if (result && selected) {
        downloadMonthCsv(result, selected)
        setNotice(`Downloaded DEMO CSV for ${selected}: ${observations.length} synthetic records.`)
      }
    },
  }
}
