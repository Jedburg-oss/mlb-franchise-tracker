import { useParams, Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { groupByPlayer, getCurrentSeason, fmtAvg, fmtERA } from '../lib/stats'
import { SectionHeader } from '../components/SectionHeader'
import { ArrowLeft } from 'lucide-react'

export function TeamProfile() {
  const { name } = useParams<{ name: string }>()
  const teamName = decodeURIComponent(name || '')
  const rows = useStore((s) => s.rows)

  const players = useMemo(() => groupByPlayer(rows), [rows])
  const currentSeason = Math.max(...rows.map((r) => r.Season))

  const roster = players
    .map((p) => ({ p, season: getCurrentSeason(p) }))
    .filter((x) => x.season.Team === teamName && x.season.Season === currentSeason)
    .sort((a, b) => b.season.OVR - a.season.OVR)

  const seasonHistory = Array.from(new Set(rows.map((r) => r.Season))).sort((a, b) => b - a)
  const currentTeamWL = roster.find((r) => r.season.TeamWL)?.season.TeamWL
  const currentTeamRec = roster.find((r) => r.season.TeamRecord)?.season.TeamRecord

  return (
    <div className="space-y-6 stagger-fade">
      <Link to="/teams" className="text-text-tertiary text-xs uppercase tracking-[0.2em] font-mono hover:text-accent flex items-center gap-2 w-fit">
        <ArrowLeft size={14} /> All Teams
      </Link>

      <div className="card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
        <div className="font-mono text-[11px] text-text-tertiary uppercase tracking-[0.3em]">Franchise</div>
        <h1 className="font-display text-7xl tracking-tight uppercase text-text-primary leading-none">
          {teamName}
        </h1>
        {currentTeamRec && (
          <div className="text-sm text-text-secondary italic mt-3 max-w-2xl">{currentTeamRec}</div>
        )}
        <div className="flex gap-8 mt-6 pt-6 border-t border-border">
          {currentTeamWL && (
            <div>
              <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Record</div>
              <div className="stat-display text-4xl text-accent">{currentTeamWL}</div>
            </div>
          )}
          <div>
            <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Roster</div>
            <div className="stat-display text-4xl text-text-primary">{roster.length}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Avg OVR</div>
            <div className="stat-display text-4xl text-text-primary">
              {(roster.reduce((sum, r) => sum + r.season.OVR, 0) / Math.max(1, roster.length)).toFixed(0)}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Seasons</div>
            <div className="stat-display text-4xl text-text-primary">{seasonHistory.length}</div>
          </div>
        </div>
      </div>

      <SectionHeader title="Roster" subtitle={`Season ${currentSeason}`} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated">
            <tr>
              <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Player</th>
              <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Pos</th>
              <th className="text-right px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">OVR</th>
              <th className="text-right px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">POT</th>
              <th className="text-right px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Age</th>
              <th className="text-right px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">HR</th>
              <th className="text-right px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">AVG</th>
              <th className="text-right px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">ERA</th>
            </tr>
          </thead>
          <tbody>
            {roster.map(({ p, season }) => (
              <tr key={p.PlayerID} className="border-t border-border hover:bg-bg-elevated">
                <td className="px-3 py-3">
                  <Link to={`/player/${p.PlayerID}`} className="font-bold text-text-primary hover:text-accent transition-colors">
                    {p.Name}
                  </Link>
                  {p.Nickname && <div className="text-[10px] text-text-tertiary italic">"{p.Nickname}"</div>}
                </td>
                <td className="px-3 py-3 font-mono text-xs text-text-secondary">
                  {season.PrimaryPosition}{season.SecondaryPosition ? `/${season.SecondaryPosition}` : ''}
                </td>
                <td className="px-3 py-3 font-mono text-right text-accent font-bold">{season.OVR}</td>
                <td className="px-3 py-3 font-mono text-right text-text-secondary">{season.Potential}</td>
                <td className="px-3 py-3 font-mono text-right text-text-secondary">{season.Age}</td>
                <td className="px-3 py-3 font-mono text-right">{season.HR ?? '—'}</td>
                <td className="px-3 py-3 font-mono text-right">{season.AVG !== undefined ? fmtAvg(season.AVG) : '—'}</td>
                <td className="px-3 py-3 font-mono text-right">{season.ERA !== undefined ? fmtERA(season.ERA) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historical rosters */}
      {seasonHistory.length > 1 && (
        <>
          <SectionHeader title="Roster History" subtitle="Players by season" />
          <div className="space-y-4">
            {seasonHistory.slice(1).map((s) => {
              const histRoster = rows
                .filter((r) => r.Team === teamName && r.Season === s)
                .sort((a, b) => b.OVR - a.OVR)
              if (histRoster.length === 0) return null
              const teamWL = histRoster.find((r) => r.TeamWL)?.TeamWL
              const teamRec = histRoster.find((r) => r.TeamRecord)?.TeamRecord
              return (
                <div key={s} className="card p-4">
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                    <div className="font-display text-xl uppercase tracking-wide">Season {s}</div>
                    {teamWL && (
                      <div className="stat-display text-2xl text-accent leading-none">
                        {teamWL}
                      </div>
                    )}
                  </div>
                  {teamRec && (
                    <div className="text-xs text-text-secondary italic mb-3">{teamRec}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {histRoster.map((r) => (
                      <Link
                        key={r.PlayerID}
                        to={`/player/${r.PlayerID}`}
                        className="text-xs font-mono px-3 py-1.5 border border-border hover:border-accent hover:text-accent uppercase tracking-wider"
                      >
                        {r.Name} <span className="text-text-tertiary">{r.OVR}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
