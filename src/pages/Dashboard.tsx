import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { groupByPlayer, getCurrentSeason, getOVRDelta, isPlayerPitcher, fmtAvg, fmtERA } from '../lib/stats'
import { StatCard } from '../components/StatCard'
import { SectionHeader } from '../components/SectionHeader'
import { ArrowRight, TrendingUp, Trophy, Upload, Crown } from 'lucide-react'
import { useLoaderState } from '../hooks/useCanonicalLoader'

export function Dashboard() {
  const rows = useStore((s) => s.rows)
  const loadState = useLoaderState((s) => s.state)

  if (rows.length === 0) {
    if (loadState === 'loading' || loadState === 'idle') {
      return (
        <div className="py-24 flex flex-col items-center text-center">
          <div className="font-display text-6xl text-accent mb-4 animate-pulse">⚾</div>
          <p className="text-text-secondary text-lg mb-2">Loading franchise data...</p>
        </div>
      )
    }
    return (
      <div className="py-24 flex flex-col items-center text-center">
        <div className="font-display text-6xl text-accent mb-4">⚾ NO DATA</div>
        <p className="text-text-secondary text-lg mb-2">No franchise data yet.</p>
        <p className="text-text-tertiary mb-8 max-w-md">
          Upload a season CSV to start tracking your franchise.
        </p>
        <Link
          to="/upload"
          className="bg-accent text-white px-6 py-3 font-bold uppercase tracking-wider hover:bg-accent-bright transition-colors flex items-center gap-2"
        >
          <Upload size={18} /> Upload First Season
        </Link>
      </div>
    )
  }

  const players = groupByPlayer(rows)
  const seasons = Array.from(new Set(rows.map((r) => r.Season))).sort((a, b) => a - b)
  const currentSeason = seasons[seasons.length - 1]

  // Top OVR
  const topOVR = [...players]
    .map((p) => ({ p, season: getCurrentSeason(p) }))
    .filter((x) => x.season.Season === currentSeason)
    .sort((a, b) => b.season.OVR - a.season.OVR)
    .slice(0, 8)

  // Trending up
  const trending = [...players]
    .map((p) => ({ p, delta: getOVRDelta(p) }))
    .filter((x) => x.delta !== null)
    .sort((a, b) => (b.delta || 0) - (a.delta || 0))
    .slice(0, 6)

  // MVP race - top WAR among hitters
  const mvpRace = rows
    .filter((r) => r.Season === currentSeason && !isPlayerPitcher({ seasons: [r] } as any))
    .sort((a, b) => (b.WAR || 0) - (a.WAR || 0))
    .slice(0, 5)

  // Cy Young - top pitcher WAR/K
  const cyRace = rows
    .filter((r) => r.Season === currentSeason && (isPlayerPitcher({ seasons: [r] } as any) || (r.IP ?? 0) > 0))
    .sort((a, b) => (b.K_Pitched || 0) - (a.K_Pitched || 0))
    .slice(0, 5)

  // League leaders
  const leadersHR = [...rows].filter((r) => r.Season === currentSeason).sort((a, b) => (b.HR || 0) - (a.HR || 0))[0]
  const leadersAVG = [...rows].filter((r) => r.Season === currentSeason && (r.AB || 0) >= 100).sort((a, b) => (b.AVG || 0) - (a.AVG || 0))[0]
  const leadersERA = [...rows].filter((r) => r.Season === currentSeason && (r.IP || 0) >= 30).sort((a, b) => (a.ERA || 99) - (b.ERA || 99))[0]
  const leadersK = [...rows].filter((r) => r.Season === currentSeason).sort((a, b) => (b.K_Pitched || 0) - (a.K_Pitched || 0))[0]

  // Count World Series titles
  const wsCount = new Set(
    rows
      .filter((r) => r.TeamRecord && /WORLD SERIES CHAMPIONS/i.test(r.TeamRecord))
      .map((r) => r.Season)
  ).size

  return (
    <div className="space-y-10 stagger-fade">
      <div>
        <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">
          Season {currentSeason} · {rows.find((r) => r.Season === currentSeason)?.Year ?? ''}
        </div>
        <h1 className="font-display text-6xl tracking-tight uppercase text-text-primary mt-1">
          Franchise <span className="text-accent">Pulse</span>
        </h1>
      </div>

      {/* Dynasty banner */}
      {wsCount > 0 && (
        <Link
          to="/trophies"
          className="card group relative overflow-hidden p-6 block transition-all hover:border-accent"
          style={{
            background: 'linear-gradient(135deg, rgba(255,45,45,0.12) 0%, rgba(255,45,45,0.01) 70%)',
            borderColor: 'rgba(255,45,45,0.35)',
          }}
        >
          <div className="absolute -right-6 -top-6 opacity-10">
            <Crown size={120} />
          </div>
          <div className="relative flex items-center gap-6">
            <div>
              <div className="font-mono text-[10px] text-accent uppercase tracking-[0.3em]">Dynasty Era</div>
              <div className="flex items-baseline gap-3 mt-1">
                <div className="stat-display text-6xl text-accent leading-none">{wsCount}</div>
                <div className="font-display text-2xl uppercase tracking-wide text-text-primary">
                  World Series Title{wsCount === 1 ? '' : 's'}
                </div>
              </div>
            </div>
            <ArrowRight size={24} className="ml-auto text-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="HR Leader"
          value={leadersHR?.HR ?? '—'}
          sub={leadersHR?.Name}
          accent
        />
        <StatCard
          label="Batting Avg"
          value={leadersAVG ? fmtAvg(leadersAVG.AVG || 0) : '—'}
          sub={leadersAVG?.Name}
        />
        <StatCard
          label="ERA Leader"
          value={leadersERA ? fmtERA(leadersERA.ERA || 0) : '—'}
          sub={leadersERA?.Name}
        />
        <StatCard
          label="K Leader"
          value={leadersK?.K_Pitched ?? '—'}
          sub={leadersK?.Name}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top OVR */}
        <div className="lg:col-span-2">
          <SectionHeader title="Top Overalls" subtitle={`Season ${currentSeason}`} />
          <div className="grid gap-2">
            {topOVR.map(({ p, season }, i) => (
              <Link
                to={`/player/${p.PlayerID}`}
                key={p.PlayerID}
                className="card card-hover px-4 py-3 flex items-center gap-4 group"
              >
                <div className="font-display text-2xl text-text-tertiary w-8">{i + 1}</div>
                <div className="flex-1">
                  <div className="font-bold text-text-primary group-hover:text-accent transition-colors">
                    {p.Name}
                    {p.Nickname && <span className="text-text-tertiary font-normal ml-2 text-xs">"{p.Nickname}"</span>}
                  </div>
                  <div className="font-mono text-[11px] text-text-tertiary uppercase tracking-wider">
                    {season.PrimaryPosition} · {season.Team}
                  </div>
                </div>
                <div className="text-right">
                  <div className="stat-display text-2xl text-accent">{season.OVR}</div>
                  <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">
                    POT {season.Potential}
                  </div>
                </div>
                <ArrowRight size={16} className="text-text-tertiary group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div>
          <SectionHeader title="Trending" subtitle="Biggest OVR changes" />
          <div className="grid gap-2">
            {trending.length === 0 ? (
              <div className="text-text-tertiary text-sm font-mono uppercase">Need 2+ seasons to track trends</div>
            ) : (
              trending.map(({ p, delta }) => {
                const cur = getCurrentSeason(p)
                return (
                  <Link
                    to={`/player/${p.PlayerID}`}
                    key={p.PlayerID}
                    className="card card-hover px-4 py-3 flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-text-primary group-hover:text-accent transition-colors text-sm">
                        {p.Name}
                      </div>
                      <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
                        {cur.PrimaryPosition} · OVR {cur.OVR}
                      </div>
                    </div>
                    <div className={`mono text-lg font-bold ${(delta || 0) > 0 ? 'text-positive' : 'text-negative'}`}>
                      {(delta || 0) > 0 ? '+' : ''}{delta}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Award races */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <SectionHeader
            title="MVP Watch"
            subtitle={`Top hitters · Season ${currentSeason}`}
            right={<Trophy size={20} className="text-accent" />}
          />
          <div className="grid gap-2">
            {mvpRace.length === 0 ? (
              <div className="text-text-tertiary text-sm font-mono uppercase py-4">No qualifying hitters yet</div>
            ) : (
              mvpRace.map((r, i) => (
                <Link
                  to={`/player/${r.PlayerID}`}
                  key={r.PlayerID}
                  className="card card-hover px-4 py-3 flex items-center gap-4 group"
                >
                  <div className="font-display text-xl text-text-tertiary w-6">{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm group-hover:text-accent transition-colors">{r.Name}</div>
                    <div className="font-mono text-[10px] text-text-tertiary uppercase">
                      {r.HR ?? 0} HR · {r.RBI ?? 0} RBI · {fmtAvg(r.AVG || 0)}
                    </div>
                  </div>
                  <div className="stat-display text-2xl text-accent">{(r.WAR ?? 0).toFixed(1)}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <SectionHeader
            title="Cy Young Watch"
            subtitle={`Top pitchers · Season ${currentSeason}`}
            right={<TrendingUp size={20} className="text-accent" />}
          />
          <div className="grid gap-2">
            {cyRace.length === 0 ? (
              <div className="text-text-tertiary text-sm font-mono uppercase py-4">No qualifying pitchers yet</div>
            ) : (
              cyRace.map((r, i) => (
                <Link
                  to={`/player/${r.PlayerID}`}
                  key={r.PlayerID}
                  className="card card-hover px-4 py-3 flex items-center gap-4 group"
                >
                  <div className="font-display text-xl text-text-tertiary w-6">{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm group-hover:text-accent transition-colors">{r.Name}</div>
                    <div className="font-mono text-[10px] text-text-tertiary uppercase">
                      {r.W ?? 0}W · {fmtERA(r.ERA || 0)} ERA · {r.K_Pitched ?? 0} K
                    </div>
                  </div>
                  <div className="stat-display text-2xl text-cool">{(r.IP ?? 0).toFixed(0)}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
