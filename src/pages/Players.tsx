import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { useStore } from '../lib/store'
import { groupByPlayer, getCurrentSeason, getOVRDelta } from '../lib/stats'
import { SectionHeader } from '../components/SectionHeader'

export function Players() {
  const rows = useStore((s) => s.rows)
  const [query, setQuery] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'OVR' | 'POT' | 'NAME'>('OVR')

  const players = useMemo(() => groupByPlayer(rows), [rows])

  const teams = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => set.add(r.Team))
    return Array.from(set).sort()
  }, [rows])

  const positions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      set.add(r.PrimaryPosition)
      if (r.SecondaryPosition) set.add(r.SecondaryPosition)
    })
    return Array.from(set).sort()
  }, [rows])

  const filtered = players
    .map((p) => ({ p, season: getCurrentSeason(p), delta: getOVRDelta(p) }))
    .filter(({ p, season }) => {
      const q = query.toLowerCase()
      if (q && !(p.Name.toLowerCase().includes(q) || (p.Nickname || '').toLowerCase().includes(q))) return false
      if (posFilter !== 'ALL' && season.PrimaryPosition !== posFilter && season.SecondaryPosition !== posFilter) return false
      if (teamFilter !== 'ALL' && season.Team !== teamFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'OVR') return b.season.OVR - a.season.OVR
      if (sortBy === 'POT') return b.season.Potential - a.season.Potential
      return a.p.Name.localeCompare(b.p.Name)
    })

  return (
    <div className="space-y-6 stagger-fade">
      <SectionHeader
        title="Players"
        subtitle={`${filtered.length} of ${players.length}`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border focus:border-accent outline-none text-sm font-mono uppercase tracking-wider"
          />
        </div>
        <select
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
          className="px-3 py-2 bg-bg-input border border-border text-sm font-mono uppercase tracking-wider focus:border-accent outline-none"
        >
          <option value="ALL">All Positions</option>
          {positions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-3 py-2 bg-bg-input border border-border text-sm font-mono uppercase tracking-wider focus:border-accent outline-none"
        >
          <option value="ALL">All Teams</option>
          {teams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 bg-bg-input border border-border text-sm font-mono uppercase tracking-wider focus:border-accent outline-none"
        >
          <option value="OVR">Sort: OVR</option>
          <option value="POT">Sort: POT</option>
          <option value="NAME">Sort: Name</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(({ p, season, delta }) => (
          <Link
            to={`/player/${p.PlayerID}`}
            key={p.PlayerID}
            className="card card-hover p-4 group relative"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-text-primary group-hover:text-accent transition-colors">
                  {p.Name}
                </div>
                {p.Nickname && (
                  <div className="text-text-tertiary text-xs italic">"{p.Nickname}"</div>
                )}
                <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em] mt-1">
                  {season.PrimaryPosition}{season.SecondaryPosition ? ` / ${season.SecondaryPosition}` : ''} · {season.Team}
                </div>
              </div>
              <div className="text-right">
                <div className="stat-display text-3xl text-accent leading-none">{season.OVR}</div>
                {delta !== null && (
                  <div className={`mono text-xs font-bold ${delta > 0 ? 'text-positive' : delta < 0 ? 'text-negative' : 'text-text-tertiary'}`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs font-mono pt-3 border-t border-border">
              <div>
                <span className="text-text-tertiary uppercase tracking-wider">POT </span>
                <span className="text-text-secondary">{season.Potential}</span>
              </div>
              <div>
                <span className="text-text-tertiary uppercase tracking-wider">B/T </span>
                <span className="text-text-secondary">{p.Bats}/{p.Throws}</span>
              </div>
              <div>
                <span className="text-text-tertiary uppercase tracking-wider">AGE </span>
                <span className="text-text-secondary">{season.Age}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-tertiary font-mono uppercase">
          No players match your filters.
        </div>
      )}
    </div>
  )
}
