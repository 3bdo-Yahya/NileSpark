import { Component } from 'react'
import type { ReactNode } from 'react'

export class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="section-shell grid min-h-screen place-content-center gap-5 py-16">
          <h1 className="font-display text-3xl">This view could not load.</h1>
          <p className="text-muted">Check your connection and reload the page to try again.</p>
          <button
            className="min-h-12 rounded-full bg-brand px-6 py-3 font-semibold text-on-brand"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
          <a href="#/">Back to home</a>
        </main>
      )
    return this.props.children
  }
}
