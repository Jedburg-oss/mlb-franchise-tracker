import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { groupByPlayer, getCurrentSeason } from '../lib/stats'
import { SectionHeader } from '../components/SectionHeader'
import { Shield } from 'lucide-react'

export function Teams() {
  const rows = useStore((s) => s.rows)

  const teamData = useMemo(() => {
    const players = groupByPlayer(rows)
    const currentSeason = Math.max(...rows.map((r) => r.Season))
    const teams = new Map<string, { name: string; players: number; avgOVR: number; topOVR: number; topPlayer: string }>()

    for (const p of players) {
      const cur = getCurrentSeason(p)
      if (cur.Season !== currentSeason) continue
      if (!teams.has(cur.Team)) {
        teams.set(cur.Team, { name: cur.Team, players: 0, avgOVR: 0, topOVR: 0, topPlayer: '' })
      }
      const t = teams.get(cur.Team)!
      t.players++
      t.avgOVR += cur.OVR
      if (cur.OVR > t.topOVR) {
        t.topOVR = cur.OVR
        t.topPlayer = p.Name
      }
    }
    for (const t of teams.values()) {
      t.avgOVR = t.avgOVR / t.players
    }
    return Array.from(teams.values()).sort((a, b) => b.avgOVR - a.avgOVR)
  }, [rows])

  return (
    <div className="space-y-6 stagger-fade">
      <SectionHeader title="Teams" subtitle={`${teamData.length} active`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamData.map((t, i) => (
          <Link
            key={t.name}
            to={`/team/${encodeURIComponent(t.name)}`}
            className="card card-hover p-5 group relative"
          >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield size={48} />
            </div>
            <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em] mb-1">
              Rank #{i + 1}
            </div>
            <h3 className="font-display text-3xl uppercase tracking-tight text-text-primary group-hover:text-accent transition-colors">
              {t.name}
            </h3>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
              <div>
                <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Players</div>
                <div className="stat-display text-2xl text-text-primary">{t.players}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Avg OVR</div>
                <div className="stat-display text-2xl text-accent">{t.avgOVR.toFixed(0)}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Top</div>
                <div className="stat-display text-2xl text-text-primary">{t.topOVR}</div>
              </div>
            </div>
            <div className="font-mono text-[11px] text-text-secondary uppercase tracking-wider mt-3">
              ★ {t.topPlayer}
            </div>
          </Link>
        ))}
      </div>

      {teamData.length === 0 && (
        <div className="text-center py-16 text-text-tertiary font-mono uppercase">
          No teams. Upload a season CSV first.
        </div>
      )}
    </div>
  )
}
