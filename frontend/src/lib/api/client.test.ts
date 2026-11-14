import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError, createApiClient } from './client.ts'

const signal = () => new AbortController().signal
function client(fetcher: typeof fetch, timeoutMs = 100) {
  return createApiClient({ baseUrl: 'http://localhost:8000/', fetcher, timeoutMs })
}
test('client sends the envelope request and keeps the configured base path', async () => {
  const api = createApiClient({
    baseUrl: 'https://example.test/burncal/',
    fetcher: async (url, init) => {
      assert.equal(String(url), 'https://example.test/burncal/api/calendar')
      assert.equal(init?.method, 'POST')
      assert.equal(init?.body, '{"start":"2025-01-01"}')
      assert.equal(new Headers(init?.headers).get('Content-Type'), 'application/json')
      return Response.json({ success: true, data: {}, error: null, meta: { stub: true } })
    },
  })
  assert.deepEqual((await api.json('/api/calendar', signal(), { start: '2025-01-01' })).meta, {
    stub: true,
  })
})
test('HTTP validation, rate limits and success=false remain errors', async () => {
  const cases: [Response, RegExp][] = [
    [
      Response.json({ detail: [{ msg: 'Invalid bounds', input: 'not exposed' }] }, { status: 422 }),
      /Invalid bounds/,
    ],
    [new Response('rate limit', { status: 429 }), /Too many requests/],
    [Response.json({ success: false, data: null, error: 'No dataset', meta: {} }), /No dataset/],
    [new Response('server broke', { status: 500 }), /HTTP 500/],
  ]
  for (const [response, message] of cases)
    await assert.rejects(client(async () => response).json('/test', signal()), message)
})
test('malformed JSON and envelopes never become successful empty results', async () => {
  for (const response of [
    new Response('<html>error</html>'),
    Response.json({ data: [] }),
    Response.json({ success: true, data: [], error: null, meta: null }),
  ])
    await assert.rejects(client(async () => response).json('/test', signal()), ApiError)
})
test('network failure and timeout produce distinct readable errors', async () => {
  await assert.rejects(
    client(async () => {
      throw new TypeError('fetch failed')
    }).json('/test', signal()),
    /Could not reach/,
  )
  const pending: typeof fetch = async (_, init) =>
    new Promise((_, reject) => {
      init?.signal?.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      )
    })
  await assert.rejects(client(pending, 5).json('/test', signal()), /too long/)
})
test('caller cancellation, including before starting, stays AbortError', async () => {
  const controller = new AbortController()
  let called = false
  controller.abort()
  await assert.rejects(
    client(async () => {
      called = true
      return Response.json({})
    }).json('/test', controller.signal),
    { name: 'AbortError' },
  )
  assert.equal(called, false)
  const active = new AbortController()
  const api = client(
    async (_, init) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        )
        active.abort()
      }),
  )
  await assert.rejects(api.json('/test', active.signal), { name: 'AbortError' })
})
test('CSV preserves placeholder and row-cap headers; JSON exports are rejected', async () => {
  const api = client(
    async () =>
      new Response('sensor,lat,lon\n', {
        headers: { 'Content-Type': 'text/csv', 'X-Stub': 'true', 'X-Row-Cap': '100000' },
      }),
  )
  const result = await api.csv('/export', signal(), {})
  assert.equal(result.stub, true)
  assert.equal(result.rowCap, '100000')
  assert.equal(await result.blob.text(), 'sensor,lat,lon\n')
  const unknown = await client(
    async () => new Response('sensor,lat,lon\n', { headers: { 'Content-Type': 'text/csv' } }),
  ).csv('/export', signal(), {})
  assert.equal(unknown.stub, null)
  const verified = await client(
    async () =>
      new Response('sensor,lat,lon\n', {
        headers: { 'Content-Type': 'text/csv', 'X-Stub': 'false' },
      }),
  ).csv('/export', signal(), {})
  assert.equal(verified.stub, false)
  await assert.rejects(
    client(async () => Response.json({})).csv('/export', signal(), {}),
    /did not return a CSV/,
  )
})
