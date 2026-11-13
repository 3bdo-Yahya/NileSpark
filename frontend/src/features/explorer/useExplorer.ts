import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { boundsMatch, parseBounds, toDraft, validateQuery } from './model/query'
import { calendarMonths } from './model/presentation'
import { PRESETS } from './model/types'
import type {
  ApiSensor,
  Bounds,
  ConnectionMode,
  DataView,
  DemoScenario,
  ExplorerResult,
  ObservationSource,
} from './model/types'
import { demoAnalysis } from './services/demoAnalysis'
import { analysisApi } from './services/api'
import { downloadBlob, downloadMonthCsv } from './services/exportCsv'
import { useApiMap } from './useApiMap'

export function useExplorer() {
  const [bounds, setBounds] = useState<Bounds | null>({ ...PRESETS[0].bounds })
  const [draft, setDraft] = useState(toDraft(PRESETS[0].bounds))
  const [areaName, setAreaName] = useState<string>(PRESETS[0].name)
  const [from, setFrom] = useState('2025-01-01')
  const [to, setTo] = useState('2025-12-31')
  const [connection, setConnection] = useState<ConnectionMode>('api')
  const [source, setSource] = useState<ObservationSource>('VIIRS_NOAA20')
  const [apiSensor, setApiSensor] = useState<ApiSensor>('viirs')
  const [mode, setMode] = useState<DataView>('source')
  const [scenario, setScenario] = useState<DemoScenario>('sample')
  const [drawing, setDrawing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [result, setResult] = useState<ExplorerResult | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [notice, setNotice] = useState('Choose an area and request its calendar from the API.')
  const active = useRef<AbortController | null>(null)
  const exportActive = useRef<AbortController | null>(null)

  const invalidate = useCallback(() => {
    active.current?.abort()
    active.current = null
    exportActive.current?.abort()
    exportActive.current = null
    setBusy(false)
    setExportBusy(false)
    setExportError(null)
    setResult(null)
    setSelected(null)
    setPlaying(false)
    setError(null)
    setRequestError(null)
    setNotice('Selection changed. Run the analysis to refresh the result.')
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
  useEffect(
    () => () => {
      active.current?.abort()
      exportActive.current?.abort()
    },
    [],
  )
  useEffect(() => {
    if (!playing || !result) return
    const timer = setInterval(
      () =>
        setSelected((previous) => {
          const index = result.months.findIndex((month) => month.period === previous)
          return result.months[(index + 1) % result.months.length]?.period ?? null
        }),
      result.provenance === 'synthetic-demo' ? 1100 : 3500,
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
    if (connection === 'demo' && mode === 'harmonized') {
      setError('Harmonization is not simulated. Select Source demo.')
      return
    }
    const query = { bounds, from, to, source }
    const validation = validateQuery(query, connection)
    if (validation) {
      setError(validation)
      return
    }
    active.current?.abort()
    exportActive.current?.abort()
    exportActive.current = null
    setExportBusy(false)
    setExportError(null)
    const controller = new AbortController()
    active.current = controller
    if (override) setScenario(override)
    setBusy(true)
    setResult(null)
    setSelected(null)
    setDrawing(false)
    setNotice(
      connection === 'api' ? 'Requesting the API calendar…' : 'Preparing the synthetic demo…',
    )
    try {
      const output =
        connection === 'api'
          ? await analysisApi.calendar(query, controller.signal)
          : await demoAnalysis.analyze(query, controller.signal, override ?? scenario)
      if (controller.signal.aborted || active.current !== controller) return
      setResult(output)
      const values = calendarMonths(output, mode, apiSensor)
      setSelected(
        values.find((month) => month.value !== null)?.period ?? output.months[0]?.period ?? null,
      )
      setNotice(
        output.provenance === 'api-stub'
          ? 'API connected. The server returned a placeholder; its zero values are withheld.'
          : output.provenance === 'api'
            ? 'API calendar received. Missing months remain unavailable. Map and CSV include all sensors.'
            : 'Synthetic demo loaded. No NASA observations are represented.',
      )
    } catch (reason) {
      if (controller.signal.aborted || active.current !== controller) return
      setRequestError(reason instanceof Error ? reason.message : 'The request could not complete.')
      setNotice('Request failed. Your inputs are preserved; retry when ready.')
    } finally {
      if (active.current === controller) {
        setBusy(false)
        active.current = null
      }
    }
  }
  const months = useMemo(() => calendarMonths(result, mode, apiSensor), [result, mode, apiSensor])
  const observations = useMemo(
    () =>
      result?.provenance === 'synthetic-demo' && mode === 'source'
        ? result.observations.filter((record) => record.period === selected)
        : [],
    [result, selected, mode],
  )
  const map = useApiMap(result, selected)

  async function exportMonth() {
    if (!result || !selected) return
    if (result.provenance === 'synthetic-demo') {
      downloadMonthCsv(result, selected)
      setNotice(`Downloaded DEMO CSV for ${selected}: ${observations.length} synthetic records.`)
      return
    }
    exportActive.current?.abort()
    const controller = new AbortController()
    exportActive.current = controller
    setExportBusy(true)
    setExportError(null)
    try {
      const output = await analysisApi.exportMonth(result.query, selected, controller.signal)
      if (controller.signal.aborted || exportActive.current !== controller) return
      if (output.stub || result.provenance === 'api-stub') {
        setNotice('The API export is a placeholder. No observation file was downloaded.')
      } else if (output.stub === null) {
        setExportError(
          'CSV placeholder status is not readable. The API must expose X-Stub: false for an observation export.',
        )
      } else {
        downloadBlob(output.blob, `burncal-API-all-sensors-${selected}.csv`)
        setNotice(
          `Downloaded API CSV for ${selected}, clipped to the applied dates. All sensors included.${output.rowCap ? ` Server row cap: ${output.rowCap}.` : ''}`,
        )
      }
    } catch (reason) {
      if (controller.signal.aborted || exportActive.current !== controller) return
      setExportError(reason instanceof Error ? reason.message : 'CSV export failed.')
    } finally {
      if (exportActive.current === controller) {
        exportActive.current = null
        setExportBusy(false)
      }
    }
  }
  const cancelExport = () => {
    if (!exportActive.current) return
    exportActive.current?.abort()
    exportActive.current = null
    setExportBusy(false)
    setNotice('CSV request cancelled.')
  }
  const selectPeriod = (period: string) => {
    cancelExport()
    setExportError(null)
    setSelected(period)
    setPlaying(false)
    setNotice(`Selected ${period}. Map and export use this month within the applied dates.`)
  }
  return {
    bounds,
    draft,
    areaName,
    from,
    to,
    connection,
    source,
    apiSensor,
    mode,
    scenario,
    drawing,
    busy,
    error,
    requestError,
    result,
    months,
    selected,
    playing,
    notice,
    observations,
    map,
    exportBusy,
    exportError,
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
    onApiSensor: (value: ApiSensor) => {
      setApiSensor(value)
      setPlaying(false)
    },
    onConnection: (value: ConnectionMode) => {
      invalidate()
      setConnection(value)
      setMode('source')
      setDrawing(false)
    },
    onMode: (value: DataView) => {
      setPlaying(false)
      setMode(value)
      setError(null)
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
      setNotice('Area cleared. Draw a rectangle or enter coordinates.')
    },
    onCancel: () => {
      invalidate()
      setNotice('Request cancelled.')
    },
    onAnalyze: () => {
      void analyze()
    },
    onRetry: () => {
      void analyze(connection === 'demo' ? 'sample' : undefined)
    },
    onSelect: selectPeriod,
    onPlay: () => {
      cancelExport()
      setPlaying((value) => !value)
    },
    onExport: () => {
      setPlaying(false)
      void exportMonth()
    },
    onCancelExport: cancelExport,
  }
}
