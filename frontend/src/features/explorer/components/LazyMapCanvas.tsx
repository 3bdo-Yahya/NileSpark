import { Component, lazy, Suspense } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from '../../../components/ui/Button'
import type { MapCanvas as MapCanvasComponent } from './MapCanvas'

const MapCanvas = lazy(() =>
  import('./MapCanvas').then((module) => ({ default: module.MapCanvas })),
)
type MapProps = ComponentProps<typeof MapCanvasComponent>

class MapCodeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-[450px] flex-1 place-content-center gap-4 rounded-panel border border-stroke bg-panel p-6 text-center lg:min-h-[540px]">
        <h2 className="text-2xl">Map code unavailable</h2>
        <p className="max-w-80 text-label text-muted">
          The map code could not download. Search controls, calendar results and CSV remain
          available.
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload to retry map
        </Button>
      </div>
    )
  }
}

export function LazyMapCanvas(props: MapProps) {
  return (
    <MapCodeBoundary>
      <Suspense
        fallback={
          <div
            className="grid min-h-[450px] flex-1 place-content-center rounded-panel border border-stroke bg-panel p-6 text-label text-muted lg:min-h-[540px]"
            role="status"
          >
            Loading interactive map…
          </div>
        }
      >
        <MapCanvas {...props} />
      </Suspense>
    </MapCodeBoundary>
  )
}
