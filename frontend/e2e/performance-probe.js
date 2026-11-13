// This probe is injected by the local lab server only; it is not imported by the product.
;(() => {
  const values = {
    lcpMs: null,
    controlsDomReadyMs: null,
    mapReadyMs: null,
    lcpElement: null,
    cls: 0,
    maxEventDurationMs: null,
    longTaskTotalMs: 0,
    longTaskMaxMs: 0,
    unsupported: [],
  }
  let sessionStart = 0
  let lastShift = 0
  let sessionValue = 0
  const shifts = []
  const node = document.createElement('output')
  node.hidden = true
  node.id = 'burncal-performance'
  node.setAttribute('data-testid', 'performance-metrics')
  const round = (n) => (n == null ? null : Math.round(n * 1000) / 1000)
  function emit() {
    const nav = performance.getEntriesByType('navigation')[0]
    const resources = performance.getEntriesByType('resource')
    node.textContent = JSON.stringify({
      ...values,
      lcpMs: round(values.lcpMs),
      cls: Math.round(values.cls * 1000000) / 1000000,
      fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
      ttfbMs: nav ? round(nav.responseStart - nav.startTime) : null,
      domContentLoadedMs: nav ? round(nav.domContentLoadedEventEnd) : null,
      loadMs: nav ? round(nav.loadEventEnd) : null,
      width: innerWidth,
      height: innerHeight,
      observationMs: round(performance.now()),
      resources: resources.map((r) => ({
        path: new URL(r.name).pathname,
        type: r.initiatorType,
        startMs: round(r.startTime),
        durationMs: round(r.duration),
        transferBytes: r.transferSize,
        encodedBytes: r.encodedBodySize,
      })),
      shifts,
    })
  }
  function observe(type, callback, options = {}) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) {
      values.unsupported.push(type)
      return
    }
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) callback(entry)
      emit()
    })
    observer.observe({ type, buffered: true, ...options })
  }
  observe('largest-contentful-paint', (entry) => {
    values.lcpMs = entry.startTime
    values.lcpElement = {
      tag: entry.element?.tagName ?? null,
      id: entry.element?.id ?? null,
      path: entry.url ? new URL(entry.url).pathname : null,
    }
  })
  observe('layout-shift', (entry) => {
    if (entry.hadRecentInput) return
    if (entry.startTime - lastShift < 1000 && entry.startTime - sessionStart < 5000)
      sessionValue += entry.value
    else {
      sessionStart = entry.startTime
      sessionValue = entry.value
    }
    lastShift = entry.startTime
    values.cls = Math.max(values.cls, sessionValue)
    shifts.push({
      atMs: round(entry.startTime),
      value: round(entry.value),
      nodes: (entry.sources ?? []).map((source) => ({
        tag: source.node?.tagName,
        id: source.node?.id,
        className:
          typeof source.node?.className === 'string' ? source.node.className.slice(0, 120) : '',
      })),
    })
  })
  observe('longtask', (entry) => {
    values.longTaskTotalMs += entry.duration
    values.longTaskMaxMs = Math.max(values.longTaskMaxMs, entry.duration)
  })
  observe(
    'event',
    (entry) => {
      if (entry.interactionId)
        values.maxEventDurationMs = Math.max(values.maxEventDurationMs ?? 0, entry.duration)
    },
    { durationThreshold: 16 },
  )
  observe('paint', () => {})
  const uiObserver = new MutationObserver(() => {
    const previousControls = values.controlsDomReadyMs
    const previousMap = values.mapReadyMs
    if (
      values.controlsDomReadyMs === null &&
      [...document.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === 'Load API calendar →',
      )
    )
      values.controlsDomReadyMs = round(performance.now())
    if (
      values.mapReadyMs === null &&
      [...document.querySelectorAll('[role="status"]')].some(
        (node) => node.textContent?.trim() === 'Geographic basemap · API cell centroids',
      )
    )
      values.mapReadyMs = round(performance.now())
    if (previousControls !== values.controlsDomReadyMs || previousMap !== values.mapReadyMs) emit()
    if (values.controlsDomReadyMs !== null && values.mapReadyMs !== null) uiObserver.disconnect()
  })
  uiObserver.observe(document.documentElement, { childList: true, subtree: true })
  function ready() {
    document.body.append(node)
    emit()
    setTimeout(() => {
      emit()
      node.setAttribute('data-ready', 'true')
      node.setAttribute('data-testid', 'performance-ready')
    }, 1500)
  }
  if (document.readyState === 'complete') ready()
  else window.addEventListener('load', ready, { once: true })
})()
