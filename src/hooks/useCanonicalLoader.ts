import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { parseCSV } from '../lib/csv'
import { useStore } from '../lib/store'

type LoadState = 'idle' | 'loading' | 'loaded' | 'failed'

// Separate store for loading state so all components can observe it
type LoaderStore = {
  state: LoadState
  set: (s: LoadState) => void
}
export const useLoaderState = create<LoaderStore>((set) => ({
  state: 'idle',
  set: (state) => set({ state }),
}))

/**
 * On first mount, if the store is empty, fetch the bundled canonical CSV
 * from /franchise-data.csv (in public/) and load it into the store.
 */
export function useCanonicalLoader() {
  const rows = useStore((s) => s.rows)
  const setRows = useStore((s) => s.setRows)
  const setLoadState = useLoaderState((s) => s.set)
  const [tried, setTried] = useState(false)

  useEffect(() => {
    if (tried) return
    if (rows.length > 0) {
      setLoadState('loaded')
      setTried(true)
      return
    }
    setLoadState('loading')
    const url = `${import.meta.env.BASE_URL}franchise-data.csv`
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(async (text) => {
        const result = await parseCSV(text)
        if (result.rows.length > 0) {
          setRows(result.rows)
          setLoadState('loaded')
        } else {
          setLoadState('failed')
        }
      })
      .catch((err) => {
        console.warn('No canonical franchise-data.csv found:', err.message)
        setLoadState('failed')
      })
      .finally(() => setTried(true))
  }, [rows.length, setRows, setLoadState, tried])
}

export function refetchCanonical(setRows: (r: any[]) => void): Promise<{ loaded: number; error?: string }> {
  const url = `${import.meta.env.BASE_URL}franchise-data.csv`
  return fetch(url)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then(async (text) => {
      const result = await parseCSV(text)
      setRows(result.rows)
      return { loaded: result.rows.length }
    })
    .catch((err) => ({ loaded: 0, error: err.message }))
}
