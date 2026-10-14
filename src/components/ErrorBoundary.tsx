import { Component, type ReactNode } from 'react'

/** Last-resort screen. Deliberately logs nothing: errors could carry personal data. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-lg text-slate-700">Please hand the device to Bay Venues staff.</p>
        <button
          onClick={() => window.location.reload()}
          className="h-16 rounded-xl bg-bv-blue text-lg font-bold text-white"
        >
          Start again
        </button>
      </main>
    )
  }
}
