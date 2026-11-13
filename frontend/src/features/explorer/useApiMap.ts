import { useEffect, useState } from 'react'
import type { ExplorerResult } from './model/types'
import type { ApiMapData } from './services/apiAnalysis'
import { analysisApi } from './services/api'

export function useApiMap(result: ExplorerResult | null, selected: string | null) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{
    result: ExplorerResult | null
    period: string | null
    attempt: number
    data: ApiMapData | null
    error: string | null
  }>({
    result: null,
    period: null,
    attempt: 0,
    data: null,
    error: null,
  })
  const enabled = result !== null && result.provenance !== 'synthetic-demo' && selected !== null
  useEffect(() => {
    if (!result || result.provenance === 'synthetic-demo' || !selected) return
    const controller = new AbortController()
    async function load() {
      try {
        const data = await analysisApi.map(result!.query, selected!, controller.signal)
        if (!controller.signal.aborted)
          setState({ result, period: selected, attempt, data, error: null })
      } catch (reason) {
        if (!controller.signal.aborted)
          setState({
            result,
            period: selected,
            attempt,
            data: null,
            error: reason instanceof Error ? reason.message : 'The map layer could not load.',
          })
      }
    }
    void load()
    return () => controller.abort()
  }, [result, selected, attempt])
  const matches =
    enabled && state.result === result && state.period === selected && state.attempt === attempt
  return {
    busy: enabled && !matches,
    data: matches ? state.data : null,
    error: matches ? state.error : null,
    retry: () => setAttempt((value) => value + 1),
  }
}
