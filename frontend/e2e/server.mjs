import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { gzipSync } from 'node:zlib'

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)))
const before = process.argv.includes('--before')
const perf = before || process.argv.includes('--perf')
const port = before ? 4177 : perf ? 4176 : 4175
const origin = `http://127.0.0.1:${port}`
const root = resolve(frontend, before ? 'dist-perf-before' : perf ? 'dist' : 'dist-e2e')
const sessions = new Map()
const cases = new Set([
  'success',
  'stub',
  'calendar-error',
  'map-error',
  'rate-limit',
  'malformed',
  'slow',
  'csv-stub',
  'csv-unknown',
  'method-error',
  'map-code-error',
])
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

function send(req, res, status, data, type = 'application/json', headers = {}) {
  const body = Buffer.isBuffer(data)
    ? data
    : Buffer.from(typeof data === 'string' ? data : JSON.stringify(data))
  const zipped =
    /gzip/.test(req.headers['accept-encoding'] ?? '') &&
    body.length > 1024 &&
    /json|javascript|html|css/.test(type)
  const payload = zipped ? gzipSync(body) : body
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    Vary: 'Accept-Encoding',
    ...headers,
    ...(zipped ? { 'Content-Encoding': 'gzip' } : {}),
    'Content-Length': payload.length,
  })
  res.end(payload)
}
function envelope(data, meta = {}) {
  return { success: true, error: null, data, meta }
}
function periodList(start, end) {
  const values = []
  const d = new Date(`${start.slice(0, 7)}-01T00:00:00Z`)
  for (let i = 0; i < 120; i++) {
    const period = d.toISOString().slice(0, 7)
    if (period > end.slice(0, 7)) break
    values.push(period)
    if (period === end.slice(0, 7)) break
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return values
}
async function bodyOf(req) {
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (text.length > 100000) throw new Error('Oversize test request')
  }
  return text ? JSON.parse(text) : null
}
function sessionFor(req) {
  const id = /(?:^|; )burncal_test=([^;]+)/.exec(req.headers.cookie ?? '')?.[1] ?? 'performance'
  if (!sessions.has(id)) sessions.set(id, { scenario: 'success', requests: [], failed: new Set() })
  return sessions.get(id)
}
function html(body) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>BurnCal local test fixtures</title><body>${body}</body></html>`
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin)
    if (url.pathname === '/__test/health')
      return send(req, res, 200, {
        status: 'ok',
        mode: perf ? 'performance' : 'e2e',
        fixtures: true,
      })
    if (url.pathname.startsWith('/__test/start/')) {
      const scenario = url.pathname.split('/').at(-1)
      if (!cases.has(scenario)) return send(req, res, 404, { error: 'Unknown fixture' })
      const id = randomUUID()
      sessions.set(id, { scenario, requests: [], failed: new Set() })
      res.writeHead(302, {
        Location: '/#/explore',
        'Set-Cookie': `burncal_test=${id}; Path=/; SameSite=Strict; HttpOnly`,
        'Cache-Control': 'no-store',
      })
      return res.end()
    }
    if (url.pathname === '/__test/map-style.json')
      return send(req, res, 200, {
        version: 8,
        sources: {},
        layers: [
          { id: 'test-background', type: 'background', paint: { 'background-color': '#0D151E' } },
        ],
      })
    if (url.pathname === '/__test/requests') {
      const data = JSON.stringify(sessionFor(req).requests, null, 2)
        .replaceAll('<', '&lt;')
        .replaceAll('&', '&amp;')
      return send(
        req,
        res,
        200,
        html(
          `<h1>LOCAL TEST REQUEST LOG · synthetic fixtures only</h1><pre data-testid="fixture-requests">${data}</pre>`,
        ),
        'text/html',
      )
    }
    if (url.pathname === '/__lab/probe.js')
      return send(
        req,
        res,
        200,
        await readFile(new URL('./performance-probe.js', import.meta.url)),
        'text/javascript',
      )
    if (
      url.pathname.startsWith('/assets/MapCanvas-') &&
      url.pathname.endsWith('.js') &&
      sessionFor(req).scenario === 'map-code-error'
    )
      return send(req, res, 503, 'Fixture map module unavailable', 'text/javascript')
    if (url.pathname.startsWith('/api/')) {
      const state = sessionFor(req)
      const body = await bodyOf(req)
      state.requests.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), body })
      const once = (scenario, path) => {
        if (state.scenario !== scenario || url.pathname !== path || state.failed.has(path))
          return false
        state.failed.add(path)
        return true
      }
      if (once('calendar-error', '/api/calendar'))
        return send(req, res, 503, {
          success: false,
          data: null,
          error: 'Fixture service unavailable',
          meta: {},
        })
      if (once('rate-limit', '/api/calendar'))
        return send(req, res, 429, 'fixture rate limit', 'text/plain')
      if (once('malformed', '/api/calendar')) return send(req, res, 200, { data: [] })
      if (once('map-error', '/api/map'))
        return send(req, res, 503, {
          success: false,
          data: null,
          error: 'Fixture map unavailable',
          meta: {},
        })
      if (once('method-error', '/api/methodology'))
        return send(req, res, 503, {
          success: false,
          data: null,
          error: 'Fixture method unavailable',
          meta: {},
        })
      const stub = state.scenario === 'stub'
      if (state.scenario === 'slow' && url.pathname === '/api/calendar')
        await new Promise((resolve) => setTimeout(resolve, 1800))
      if (res.destroyed) return
      if (url.pathname === '/api/calendar') {
        const months = periodList(body.start, body.end).flatMap((period, i) =>
          i === 2
            ? []
            : [
                {
                  year: Number(period.slice(0, 4)),
                  month: Number(period.slice(5, 7)),
                  value: stub || i === 1 ? 0 : 20 + i,
                  median: i === 3 ? 0 : i === 1 ? 5 : 20 + i,
                  anomaly: i === 1 ? -5 : i === 3 ? 23 : 0,
                  anomaly_pct: i === 3 ? null : i === 1 ? -100 : 0,
                  raw_by_sensor: {
                    modis: stub || i === 1 ? 0 : 5 + i,
                    viirs: stub || i === 1 ? 0 : 10 + i,
                  },
                },
              ],
        )
        return send(
          req,
          res,
          200,
          envelope(
            { months, years: [] },
            {
              stub,
              unit: 'synthetic test units',
              method_version: 'E2E-FIXTURE',
              k: stub ? null : 2,
            },
          ),
        )
      }
      if (url.pathname === '/api/map') {
        const x =
          (Number(url.searchParams.get('min_lon')) + Number(url.searchParams.get('max_lon'))) / 2
        const y =
          (Number(url.searchParams.get('min_lat')) + Number(url.searchParams.get('max_lat'))) / 2
        return send(
          req,
          res,
          200,
          envelope(
            {
              type: 'FeatureCollection',
              features: stub
                ? []
                : [
                    {
                      type: 'Feature',
                      geometry: { type: 'Point', coordinates: [x, y] },
                      properties: { count: 7 },
                    },
                  ],
            },
            { stub },
          ),
        )
      }
      if (url.pathname === '/api/methodology')
        return send(
          req,
          res,
          200,
          envelope({
            stub,
            method_version: 'E2E-FIXTURE',
            plain_language:
              'SYNTHETIC TEST METHODOLOGY. Not NASA observations or a validated scientific method.',
            grid_deg: 0.01,
            overlap_years: [2024, 2025],
            global_k: stub ? null : 2,
          }),
        )
      if (url.pathname === '/api/hotspots.csv') {
        const csv = `sensor,is_test_fixture,acq_date,lat,lon\r\nmodis,true,${body.start},25,32\r\nviirs,true,${body.end},25,32\r\n`
        const headers = {
          'X-Row-Cap': '100000',
          ...(state.scenario === 'csv-unknown'
            ? {}
            : { 'X-Stub': String(stub || state.scenario === 'csv-stub') }),
        }
        return send(req, res, 200, csv, 'text/csv', headers)
      }
      return send(req, res, 404, { error: 'Unknown fixture endpoint' })
    }
    const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
    const path = resolve(root, '.' + requested)
    if (path !== root && !path.startsWith(root + sep))
      return send(req, res, 403, 'Forbidden', 'text/plain')
    const file = await stat(path)
      .then((value) => value.isFile())
      .catch(() => false)
    if (!file) return send(req, res, 404, 'Not found', 'text/plain')
    let data = await readFile(path)
    if (extname(path) === '.html') {
      const marker =
        '<aside style="position:fixed;bottom:0;left:0;z-index:10000;background:#fff;color:#000;font:10px monospace;padding:2px 5px">LOCAL TEST FIXTURES · NOT NASA DATA</aside>'
      data = Buffer.from(
        data
          .toString()
          .replace('</head>', (perf ? '<script src="/__lab/probe.js"></script>' : '') + '</head>')
          .replace('</body>', (perf ? '' : marker) + '</body>'),
      )
    }
    send(req, res, 200, data, mime[extname(path)] ?? 'application/octet-stream')
  } catch (error) {
    if (!res.headersSent && !res.destroyed)
      send(req, res, 500, { error: 'Local test harness error', detail: error.message })
  }
})
server.listen(port, '127.0.0.1', () =>
  process.stdout.write(`BurnCal ${perf ? 'performance lab' : 'E2E fixture server'}: ${origin}\n`),
)
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)))
