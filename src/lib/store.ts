import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlayerSeason } from './types'

type State = {
  rows: PlayerSeason[]
  setRows: (r: PlayerSeason[]) => void
  mergeRows: (r: PlayerSeason[]) => void
  updateSeason: (playerId: string, season: number, patch: Partial<PlayerSeason>) => void
  changeTeam: (playerId: string, season: number, newTeam: string) => void
  deletePlayer: (playerId: string) => void
  clearAll: () => void
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      rows: [],
      setRows: (rows) => set({ rows }),
      mergeRows: (incoming) =>
        set((state) => {
          // Deduplicate by PlayerID + Season — incoming wins
          const map = new Map<string, PlayerSeason>()
          for (const r of state.rows) {
            map.set(`${r.PlayerID}_${r.Season}`, r)
          }
          for (const r of incoming) {
            map.set(`${r.PlayerID}_${r.Season}`, r)
          }
          return { rows: Array.from(map.values()) }
        }),
      updateSeason: (playerId, season, patch) =>
        set((state) => ({
          rows: state.rows.map((r) =>
            r.PlayerID === playerId && r.Season === season ? { ...r, ...patch } : r,
          ),
        })),
      changeTeam: (playerId, season, newTeam) =>
        set((state) => ({
          rows: state.rows.map((r) =>
            r.PlayerID === playerId && r.Season === season ? { ...r, Team: newTeam } : r,
          ),
        })),
      deletePlayer: (playerId) =>
        set((state) => ({ rows: state.rows.filter((r) => r.PlayerID !== playerId) })),
      clearAll: () => set({ rows: [] }),
    }),
    { name: 'mlb-tracker-data' },
  ),
)
