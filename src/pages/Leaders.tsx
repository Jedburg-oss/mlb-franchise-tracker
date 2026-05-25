import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { groupByPlayer, computeCareerTotals, fmtAvg, fmtERA } from '../lib/stats'
import type { Player, CareerTotals } from '../lib/types'
import { SectionHeader } from '../components/SectionHeader'

const HITTING_SEASON_STATS = [
  { key: 'HR', label: 'Home Runs', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'RBI', label: 'RBI', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'AVG', label: 'Batting Avg', dir: 'desc' as const, fmt: fmtAvg, min: { stat: 'AB', value: 100 } },
  { key: 'OPS', label: 'OPS', dir: 'desc' as const, fmt: (v: any) => (v ?? 0).toFixed(3).replace(/^0/, ''), min: { stat: 'AB', value: 100 } },
  { key: 'SB', label: 'Steals', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'WAR', label: 'WAR', dir: 'desc' as const, fmt: (v: any) => (v ?? 0).toFixed(1) },
  { key: 'H', label: 'Hits', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
]

const PITCHING_SEASON_STATS = [
  { key: 'W', label: 'Wins', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'ERA', label: 'ERA', dir: 'asc' as const, fmt: fmtERA, min: { stat: 'IP', value: 30 } },
  { key: 'K_Pitched', label: 'Strikeouts', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'WHIP', label: 'WHIP', dir: 'asc' as const, fmt: (v: any) => (v ?? 0).toFixed(2), min: { stat: 'IP', value: 30 } },
  { key: 'SV', label: 'Saves', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
]

const HITTING_CAREER_STATS = [
  { key: 'HR', label: 'Career HR', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'H', label: 'Career Hits', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'RBI', label: 'Career RBI', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'WAR', label: 'Career WAR', dir: 'desc' as const, fmt: (v: any) => (v ?? 0).toFixed(1) },
  { key: 'SB', label: 'Career Steals', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'AVG', label: 'Career AVG', dir: 'desc' as const, fmt: fmtAvg },
  { key: 'OPS', label: 'Career OPS', dir: 'desc' as const, fmt: (v: any) => (v ?? 0).toFixed(3).replace(/^0/, '') },
]

const PITCHING_CAREER_STATS = [
  { key: 'W', label: 'Career Wins', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'K_Pitched', label: 'Career K', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'SV', label: 'Career Saves', dir: 'desc' as const, fmt: (v: any) => v ?? 0 },
  { key: 'IP', label: 'Career IP', dir: 'desc' as const, fmt: (v: any) => (v ?? 0).toFixed(1) },
  { key: 'ERA', label: 'Career ERA', dir: 'asc' as const, fmt: fmtERA, min: { stat: 'IP', value: 50 } },
]

export function Leaders() {
  const rows = useStore((s) => s.rows)
  const allSeasons = useMemo(() => Array.from(new Set(rows.map((r) => r.Season))).sort((a, b) => b - a), [rows])
  const [scope, setScope] = useState<'season' | 'career'>('season')
  const [season, setSeason] = useState<number>(allSeasons[0] ?? 1)
  const [category, setCategory] = useState<'hitting' | 'pitching'>('hitting')

  const players = useMemo(() => groupByPlayer(rows), [rows])
  const careerData = useMemo(
    () => players.map((p) => ({ p, c: computeCareerTotals(p) })),
    [players],
  )

  const renderSeason = () => {
    const seasonRows = rows.filter((r) => r.Season === season)
    const stats = category === 'hitting' ? HITTING_SEASON_STATS : PITCHING_SEASON_STATS

    return (
      <div className="grid gap-6">
        {stats.map((stat) => {
          const filtered = seasonRows.filter((r) => {
            if ('min' in stat && stat.min) {
              return Number((r as any)[stat.min.stat] || 0) >= stat.min.value
            }
            return true
          })
          const sorted = [...filtered].sort((a, b) => {
            const va = Number((a as any)[stat.key]) || (stat.dir === 'asc' ? Infinity : 0)
            const vb = Number((b as any)[stat.key]) || (stat.dir === 'asc' ? Infinity : 0)
            return stat.dir === 'desc' ? vb - va : va - vb
          }).slice(0, 5)

          return (
            <div key={stat.key} className="card p-5">
              <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-border">
                <h3 className="font-display text-2xl uppercase tracking-wide">{stat.label}</h3>
                <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">{stat.key}</div>
              </div>
              {sorted.length === 0 ? (
                <div className="text-text-tertiary font-mono text-xs uppercase">No qualifying players</div>
              ) : (
                <div className="space-y-1">
                  {sorted.map((r, i) => (
                    <Link
                      key={r.PlayerID}
                      to={`/player/${r.PlayerID}`}
                      className="flex items-center gap-4 px-3 py-2 hover:bg-bg-elevated transition-colors group"
                    >
                      <div className="font-display text-xl text-text-tertiary w-6">{i + 1}</div>
                      <div className="flex-1">
                        <div className="font-bold text-sm group-hover:text-accent transition-colors">{r.Name}</div>
                        <div className="text-[10px] font-mono text-text-tertiary uppercase">{r.PrimaryPosition} · {r.Team}</div>
                      </div>
                      <div className={`stat-display text-2xl ${i === 0 ? 'text-accent' : 'text-text-primary'}`}>
                        {stat.fmt((r as any)[stat.key])}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderCareer = () => {
    const stats = category === 'hitting' ? HITTING_CAREER_STATS : PITCHING_CAREER_STATS

    return (
      <div className="grid gap-6">
        {stats.map((stat) => {
          const filtered = careerData.filter((d) => {
            if ('min' in stat && stat.min) {
              return Number((d.c as any)[stat.min.stat] || 0) >= stat.min.value
            }
            return true
          })
          const sorted = [...filtered].sort((a, b) => {
            const va = Number((a.c as any)[stat.key]) || (stat.dir === 'asc' ? Infinity : 0)
            const vb = Number((b.c as any)[stat.key]) || (stat.dir === 'asc' ? Infinity : 0)
            return stat.dir === 'desc' ? vb - va : va - vb
          }).slice(0, 8)

          return (
            <div key={stat.key} className="card p-5">
              <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-border">
                <h3 className="font-display text-2xl uppercase tracking-wide">{stat.label}</h3>
                <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">{stat.key}</div>
              </div>
              <div className="space-y-1">
                {sorted.map((d, i) => (
                  <Link
                    key={d.p.PlayerID}
                    to={`/player/${d.p.PlayerID}`}
                    className="flex items-center gap-4 px-3 py-2 hover:bg-bg-elevated transition-colors group"
                  >
                    <div className="font-display text-xl text-text-tertiary w-6">{i + 1}</div>
                    <div className="flex-1">
                      <div className="font-bold text-sm group-hover:text-accent transition-colors">{d.p.Name}</div>
                      <div className="text-[10px] font-mono text-text-tertiary uppercase">
                        {d.p.seasons.length} season{d.p.seasons.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className={`stat-display text-2xl ${i === 0 ? 'text-accent' : 'text-text-primary'}`}>
                      {stat.fmt((d.c as any)[stat.key])}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 stagger-fade">
      <SectionHeader
        title="League Leaders"
        subtitle={scope === 'season' ? `Season ${season}` : 'All-time career'}
        right={
          <div className="flex gap-2 flex-wrap">
            <div className="flex border border-border">
              {(['season', 'career'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-mono ${
                    scope === s ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {scope === 'season' && (
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="px-3 py-2 bg-bg-input border border-border text-sm font-mono uppercase tracking-wider"
              >
                {allSeasons.map((s) => <option key={s} value={s}>Season {s}</option>)}
              </select>
            )}
            <div className="flex border border-border">
              {(['hitting', 'pitching'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-mono ${
                    category === c ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        }
      />
      {scope === 'season' ? renderSeason() : renderCareer()}
    </div>
  )
}
