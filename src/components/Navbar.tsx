import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Users, GitCompareArrows, Shield, Trophy,
  Award, Search,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { groupByPlayer, getCurrentSeason } from '../lib/stats'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/players', label: 'Players', icon: Users },
  { to: '/teams', label: 'Teams', icon: Shield },
  { to: '/leaders', label: 'Leaders', icon: Trophy },
  { to: '/trophies', label: 'Trophies', icon: Award },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
  { to: '/upload', label: 'Upload', icon: Upload },
]

export function Navbar() {
  const rows = useStore((s) => s.rows)
  const seasonsTracked = new Set(rows.map((r) => r.Season)).size
  const playersCount = new Set(rows.map((r) => r.PlayerID)).size

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 flex items-center h-16 gap-3 md:gap-6">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 bg-accent flex items-center justify-center font-display text-xl text-white group-hover:bg-accent-bright transition-colors">
            ⚾
          </div>
          <div className="leading-none hidden sm:block">
            <div className="font-display text-xl tracking-wide text-text-primary">FRANCHISE</div>
            <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Tracker</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-accent text-text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <QuickSearch />

        <div className="ml-auto hidden md:flex items-center gap-6">
          <div className="text-right">
            <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Seasons</div>
            <div className="stat-display text-2xl text-accent leading-none">{seasonsTracked}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Players</div>
            <div className="stat-display text-2xl text-text-primary leading-none">{playersCount}</div>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2 border-t border-border">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `shrink-0 px-3 py-2 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                isActive
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            <item.icon size={12} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

function QuickSearch() {
  const rows = useStore((s) => s.rows)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const players = useMemo(() => groupByPlayer(rows), [rows])

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return players
      .filter((p) =>
        p.Name.toLowerCase().includes(q) ||
        (p.Nickname || '').toLowerCase().includes(q),
      )
      .slice(0, 6)
  }, [query, players])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(playerId: string) {
    navigate(`/player/${playerId}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative flex-1 max-w-xs" ref={containerRef}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        <input
          type="text"
          placeholder="Find player..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches[0]) handleSelect(matches[0].PlayerID)
            if (e.key === 'Escape') setOpen(false)
          }}
          className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border focus:border-accent outline-none text-xs font-mono uppercase tracking-wider"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 card z-50 max-h-80 overflow-y-auto">
          {matches.map((p) => {
            const cur = getCurrentSeason(p)
            return (
              <button
                key={p.PlayerID}
                onClick={() => handleSelect(p.PlayerID)}
                className="w-full text-left px-3 py-2 hover:bg-bg-elevated flex items-center gap-3 border-b border-border last:border-0"
              >
                <div className="stat-display text-xl text-accent w-10">{cur.OVR}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-text-primary truncate">{p.Name}</div>
                  <div className="font-mono text-[10px] text-text-tertiary uppercase truncate">
                    {cur.PrimaryPosition} · {cur.Team}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
