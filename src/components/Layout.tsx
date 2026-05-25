import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-[1400px] w-full px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 mt-8">
        <div className="mx-auto max-w-[1400px] px-6 text-text-tertiary text-xs uppercase tracking-[0.2em] flex justify-between font-mono">
          <span>Franchise Tracker</span>
          <span>Local-only · Your data stays in your browser</span>
        </div>
      </footer>
    </div>
  )
}
