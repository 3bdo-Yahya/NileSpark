import { useEffect, useRef, useState } from 'react'
import { Map as LibreMap, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl'
import type { GeoJSONSource } from 'maplibre-gl'
import type { FeatureCollection, Point, Polygon } from 'geojson'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Button } from '../../../components/ui/Button'
import type { Bounds, DemoObservation } from '../model/types'
import { validateBounds } from '../model/query'
import './map.css'

setWorkerUrl(workerUrl)
const empty: FeatureCollection = { type: 'FeatureCollection', features: [] }
function areaData(bounds: Bounds | null): FeatureCollection<Polygon> {
  return {
    type: 'FeatureCollection',
    features: bounds
      ? [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [bounds.west, bounds.south],
                  [bounds.east, bounds.south],
                  [bounds.east, bounds.north],
                  [bounds.west, bounds.north],
                  [bounds.west, bounds.south],
                ],
              ],
            },
          },
        ]
      : [],
  }
}
function pointData(points: DemoObservation[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      properties: { date: point.acquiredAt, source: point.source, isDemo: true },
      geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
    })),
  }
}
function updateSource(map: LibreMap, id: string, data: FeatureCollection): void {
  const source = map.getSource(id) as GeoJSONSource | undefined
  source?.setData(data)
}
function fitArea(map: LibreMap, bounds: Bounds | null): void {
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550
  if (bounds)
    map.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      { padding: 65, duration, maxZoom: 9 },
    )
  else map.flyTo({ center: [15, 15], zoom: 1.3, duration })
}
type Props = {
  bounds: Bounds | null
  drawing: boolean
  observations: DemoObservation[]
  onBounds: (bounds: Bounds) => void
  onCancelDraw: () => void
}

export function MapCanvas(p: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LibreMap | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const firstCorner = useRef<[number, number] | null>(null)
  const live = useRef(p)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    live.current = p
  }, [p])

  useEffect(() => {
    if (!container.current) return
    let map: LibreMap | null = null
    let disposed = false
    let resize: ResizeObserver | undefined
    const fail = () => {
      if (!disposed) setStatus('failed')
    }
    const timer = setTimeout(() => {
      if (!map?.isStyleLoaded()) fail()
    }, 18000)
    try {
      map = new LibreMap({
        container: container.current,
        style: 'https://tiles.openfreemap.org/styles/dark',
        center: [32, 25],
        zoom: 5.4,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: false,
      })
      const current = map
      mapRef.current = current
      current.setMissingStyleImageResolver((id) => {
        if (id !== 'circle-11' || current.hasImage(id)) return
        const size = 11
        const pixels = new Uint8Array(size * size * 4)
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const offset = (y * size + x) * 4
            pixels[offset] = 255
            pixels[offset + 1] = 255
            pixels[offset + 2] = 255
            pixels[offset + 3] = Math.hypot(x - 5, y - 5) <= 4 ? 255 : 0
          }
        current.addImage(id, { width: size, height: size, data: pixels }, { sdf: true })
      })
      current.addControl(new NavigationControl({ showCompass: false }), 'top-right')
      current.on('load', () => {
        if (disposed) return
        clearTimeout(timer)
        current.addSource('selected-area', { type: 'geojson', data: areaData(live.current.bounds) })
        current.addLayer({
          id: 'area-fill',
          type: 'fill',
          source: 'selected-area',
          paint: { 'fill-color': '#F3A66B', 'fill-opacity': 0.09 },
        })
        current.addLayer({
          id: 'area-outline',
          type: 'line',
          source: 'selected-area',
          paint: { 'line-color': '#F3A66B', 'line-width': 2, 'line-dasharray': [3, 2] },
        })
        current.addSource('demo-records', {
          type: 'geojson',
          data: pointData(live.current.observations),
        })
        current.addLayer({
          id: 'demo-points',
          type: 'circle',
          source: 'demo-records',
          paint: {
            'circle-color': '#F3A66B',
            'circle-radius': 5,
            'circle-stroke-color': '#FFE0C4',
            'circle-stroke-width': 1,
            'circle-opacity': 0.85,
          },
        })
        current.addSource('draw-corner', { type: 'geojson', data: empty })
        current.addLayer({
          id: 'draw-corner-point',
          type: 'circle',
          source: 'draw-corner',
          paint: {
            'circle-radius': 7,
            'circle-color': '#91D9DF',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#060B11',
          },
        })
        fitArea(current, live.current.bounds)
        current.getCanvas().style.cursor = live.current.drawing ? 'crosshair' : ''
        setStatus('ready')
      })
      current.on('click', (event) => {
        if (!live.current.drawing || !current.getSource('selected-area')) return
        if (!firstCorner.current) {
          firstCorner.current = [event.lngLat.lng, event.lngLat.lat]
          updateSource(current, 'draw-corner', {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: { type: 'Point', coordinates: firstCorner.current },
              },
            ],
          })
          return
        }
        const [lng, lat] = firstCorner.current
        const bounds: Bounds = {
          west: Math.min(lng, event.lngLat.lng),
          east: Math.max(lng, event.lngLat.lng),
          south: Math.min(lat, event.lngLat.lat),
          north: Math.max(lat, event.lngLat.lat),
        }
        const rounded = Object.fromEntries(
          Object.entries(bounds).map(([key, value]) => [key, Number(value.toFixed(4))]),
        ) as Bounds
        if (validateBounds(rounded)) return
        firstCorner.current = null
        updateSource(current, 'draw-corner', empty)
        live.current.onBounds(rounded)
      })
      current.on('click', 'demo-points', (event) => {
        if (live.current.drawing || !event.features?.[0]) return
        const feature = event.features[0]
        if (feature.geometry.type !== 'Point') return
        const lng = feature.geometry.coordinates[0]
        const lat = feature.geometry.coordinates[1]
        if (lng === undefined || lat === undefined) return
        popupRef.current?.remove()
        popupRef.current = new Popup()
          .setLngLat([lng, lat])
          .setText(
            `SYNTHETIC DEMO RECORD · ${String(feature.properties?.source)} · ${String(feature.properties?.date)}`,
          )
          .addTo(current)
      })
      current.on('error', () => {
        if (!current.isStyleLoaded()) {
          /* Loading feedback is handled by the timeout; individual tile errors are not a fatal analysis error. */
        }
      })
      resize = new ResizeObserver(() => {
        current.resize()
        if (current.getSource('selected-area') && !live.current.drawing)
          fitArea(current, live.current.bounds)
      })
      resize.observe(container.current)
    } catch (reason) {
      console.error('Basemap initialization failed:', reason)
      fail()
    }
    return () => {
      disposed = true
      clearTimeout(timer)
      resize?.disconnect()
      popupRef.current?.remove()
      popupRef.current = null
      map?.remove()
      mapRef.current = null
      firstCorner.current = null
    }
  }, [attempt])
  useEffect(() => {
    const map = mapRef.current
    if (!map?.getSource('selected-area')) return
    updateSource(map, 'selected-area', areaData(p.bounds))
    fitArea(map, p.bounds)
  }, [p.bounds])
  useEffect(() => {
    popupRef.current?.remove()
    popupRef.current = null
    const map = mapRef.current
    if (map?.getSource('demo-records')) updateSource(map, 'demo-records', pointData(p.observations))
  }, [p.observations])
  useEffect(() => {
    const map = mapRef.current
    if (map) map.getCanvas().style.cursor = p.drawing ? 'crosshair' : ''
    if (!p.drawing) {
      firstCorner.current = null
      if (map?.getSource('draw-corner')) updateSource(map, 'draw-corner', empty)
    }
  }, [p.drawing])
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && live.current.drawing) live.current.onCancelDraw()
    }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [])
  return (
    <div className="relative min-h-[450px] overflow-hidden rounded-panel border border-stroke bg-space lg:min-h-[540px]">
      <div
        ref={container}
        className="burncal-map absolute inset-0"
        aria-label="Interactive geographic map. Use coordinate inputs as a keyboard alternative to drawing."
      />
      <div
        className="pointer-events-none absolute top-3 left-3 z-10 max-w-[calc(100%-5rem)] rounded-lg border border-stroke bg-panel/95 px-3 py-2 text-caption text-secondary"
        role="status"
      >
        {status === 'failed'
          ? 'Basemap unavailable'
          : status === 'loading'
            ? 'Loading the geographic basemap…'
            : p.drawing
              ? 'Drawing · choose two opposite corners'
              : 'Real geography · synthetic demo points'}
      </div>
      {status === 'failed' && (
        <div className="absolute inset-0 z-20 grid place-content-center gap-4 bg-space/95 p-8 text-center">
          <p className="font-display text-2xl">The basemap could not load.</p>
          <p className="max-w-80 text-label text-muted">
            An internet connection and WebGL are required. You can still use coordinate inputs and
            the calendar.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setStatus('loading')
              setAttempt((value) => value + 1)
            }}
          >
            Retry basemap
          </Button>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-10 left-3 z-10 rounded-lg border border-stroke bg-panel/95 px-3 py-2 text-caption text-secondary">
        <span className="mr-2 inline-block h-3 w-4 border border-dashed border-brand bg-brand/10" />
        Selected AOI
        <span className="ml-4 mr-2 inline-block size-2 rounded-full bg-brand" />
        Demo record
      </div>
    </div>
  )
}
