export class ApiError extends Error {
  readonly status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The API returned an unexpected response format.')
  return value as Record<string, unknown>
}

function errorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (typeof body.error === 'string' && body.error.trim()) return body.error
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item: unknown) => {
          if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string')
            return item.msg
          return ''
        })
        .filter(Boolean)
      if (messages.length) return messages.join('; ')
    }
  }
  if (status === 429) return 'Too many requests. Wait a moment, then retry.'
  return `The API request failed (HTTP ${status}).`
}

export function createApiClient({
  baseUrl,
  fetcher = fetch,
  timeoutMs = 15000,
}: {
  baseUrl: string
  fetcher?: typeof fetch
  timeoutMs?: number
}) {
  const base = new URL(baseUrl)
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new ApiError(
      'Configure VITE_API_BASE_URL as an HTTP(S) address without credentials or query parameters.',
    )
  const root = base.href.replace(/\/$/, '')

  async function request(path: string, signal: AbortSignal, body?: unknown, csv = false) {
    signal.throwIfAborted()
    const controller = new AbortController()
    let timedOut = false
    const abort = () => controller.abort()
    signal.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    try {
      const response = await fetcher(`${root}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          Accept: csv ? 'text/csv' : 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal,
      })
      if (!response.ok) {
        let payload: unknown
        try {
          payload = await response.json()
        } catch {
          /* Some servers return plain-text errors. */
        }
        throw new ApiError(errorMessage(payload, response.status), response.status)
      }
      if (csv) {
        if (!response.headers.get('content-type')?.toLowerCase().includes('text/csv'))
          throw new ApiError('The export endpoint did not return a CSV file.')
        const blob = await response.blob()
        signal.throwIfAborted()
        return {
          kind: 'csv' as const,
          blob,
          stub:
            response.headers.get('x-stub') === null
              ? null
              : response.headers.get('x-stub')?.toLowerCase() !== 'false',
          rowCap: response.headers.get('x-row-cap'),
        }
      }
      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new ApiError('The API did not return valid JSON.')
      }
      signal.throwIfAborted()
      const envelope = object(payload)
      if (envelope.success === false)
        throw new ApiError(errorMessage(envelope, response.status), response.status)
      if (envelope.success !== true || envelope.error != null || !('data' in envelope))
        throw new ApiError('The API returned an invalid response envelope.')
      return { kind: 'json' as const, data: envelope.data, meta: object(envelope.meta) }
    } catch (reason) {
      if (signal.aborted) throw new DOMException('Request cancelled.', 'AbortError')
      if (timedOut) throw new ApiError('The API took too long to respond. Please retry.')
      if (reason instanceof ApiError) throw reason
      throw new ApiError(
        'Could not reach the API. Check that the server is running and the connection is available.',
      )
    } finally {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
    }
  }
  return {
    async json(path: string, signal: AbortSignal, body?: unknown) {
      const result = await request(path, signal, body)
      if (result.kind !== 'json') throw new ApiError('Expected a JSON response.')
      return result
    },
    async csv(path: string, signal: AbortSignal, body: unknown) {
      const result = await request(path, signal, body, true)
      if (result.kind !== 'csv') throw new ApiError('Expected a CSV response.')
      return result
    },
  }
}
export type ApiClient = ReturnType<typeof createApiClient>
