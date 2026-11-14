import { useEffect, useState } from 'react'
import type { ComponentProps } from 'react'
import type ExplorerComponent from '../features/explorer/Explorer'

type ExplorerPage = typeof ExplorerComponent
let cached: ExplorerPage | null = null
let pending: Promise<ExplorerPage> | null = null

function loadExplorer(): Promise<ExplorerPage> {
  pending ??= import('../features/explorer/Explorer')
    .then((module) => {
      cached = module.default
      return cached
    })
    .catch((error) => {
      pending = null
      throw error
    })
  return pending
}

/** Load the route independently of Suspense reveal throttling; keep its explicit loading/error UI. */
export function DeferredExplorer(props: ComponentProps<ExplorerPage>) {
  const [loaded, setLoaded] = useState<{ Page: ExplorerPage | null; error: Error | null }>(() => ({
    Page: cached,
    error: null,
  }))
  useEffect(() => {
    if (loaded.Page) return
    let active = true
    void loadExplorer().then(
      (Page) => {
        if (active) setLoaded({ Page, error: null })
      },
      (reason) => {
        if (active)
          setLoaded({
            Page: null,
            error: reason instanceof Error ? reason : new Error('Explorer could not load.'),
          })
      },
    )
    return () => {
      active = false
    }
  }, [loaded.Page])
  if (loaded.error) throw loaded.error
  const Page = loaded.Page
  return Page ? (
    <Page {...props} />
  ) : (
    <main
      id="main"
      tabIndex={-1}
      className="section-shell grid min-h-screen place-content-center"
      role="status"
    >
      <p className="font-display text-2xl">Opening the observatory…</p>
    </main>
  )
}
