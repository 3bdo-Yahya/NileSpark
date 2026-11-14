import { useEffect, useState, useSyncExternalStore } from 'react'
import { Home } from './Home'
import { DeferredExplorer } from './DeferredExplorer'
import { RouteBoundary } from './RouteBoundary'
import { MethodDialog } from '../features/method/MethodDialog'
function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
function snapshot() {
  return window.location.hash
}

export function App() {
  const hash = useSyncExternalStore(subscribe, snapshot, () => '')
  const route = hash.startsWith('#/explore') ? 'explore' : 'home'
  const [methodOpen, setMethodOpen] = useState(false)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])
  return (
    <>
      {route !== 'home' && (
        <button
          type="button"
          className="fixed top-4 left-4 z-50 -translate-y-[180%] rounded-lg bg-brand px-4 py-3 text-on-brand focus:translate-y-0"
          onClick={() => document.getElementById('main')?.focus()}
        >
          Skip to content
        </button>
      )}
      <RouteBoundary key={route}>
        {route === 'home' ? (
          <Home onOpenMethod={() => setMethodOpen(true)} />
        ) : (
          <DeferredExplorer />
        )}
      </RouteBoundary>
      <MethodDialog open={methodOpen} onClose={() => setMethodOpen(false)} />
    </>
  )
}
