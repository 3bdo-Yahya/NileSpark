import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { Home } from './Home'
import { RouteBoundary } from './RouteBoundary'
import { MethodDialog } from '../features/method/MethodDialog'
import { ButtonLink } from '../components/ui/Button'

const Explorer = lazy(() => import('../features/explorer/Explorer'))
const Foundations = lazy(() => import('../features/foundations/Foundations'))
function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
function snapshot() {
  return window.location.hash
}

export function App() {
  const hash = useSyncExternalStore(subscribe, snapshot, () => '')
  const route = hash.startsWith('#/explore')
    ? 'explore'
    : hash.startsWith('#/foundations')
      ? 'foundations'
      : 'home'
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
        <Suspense
          fallback={
            <main className="section-shell grid min-h-screen place-content-center" role="status">
              <p className="font-display text-2xl">Opening the observatory…</p>
            </main>
          }
        >
          {route === 'home' ? (
            <Home onOpenMethod={() => setMethodOpen(true)} />
          ) : route === 'explore' ? (
            <Explorer onOpenMethod={() => setMethodOpen(true)} />
          ) : (
            <main id="main" tabIndex={-1}>
              <header className="section-shell flex justify-between gap-4 border-b border-stroke py-5">
                <p className="font-display text-2xl">BurnCal / UI foundations</p>
                <ButtonLink href="#/" size="sm" variant="secondary">
                  Back to Earth
                </ButtonLink>
              </header>
              <Foundations onOpenMethod={() => setMethodOpen(true)} />
            </main>
          )}
        </Suspense>
      </RouteBoundary>
      <MethodDialog open={methodOpen} onClose={() => setMethodOpen(false)} />
    </>
  )
}
