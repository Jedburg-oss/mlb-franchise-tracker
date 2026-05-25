import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar,
} from 'recharts'
import { ArrowLeft, Edit3, Save, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { groupByPlayer, computeCareerTotals, getCurrentSeason, isPlayerPitcher,
  fmtAvg, fmtERA, HITTING_ATTRS, FIELD_ATTRS, PITCHING_ATTRS, HITTING_STATS, PITCHING_STATS } from '../lib/stats'
import type { PlayerSeason } from '../lib/types'
import { StatCard } from '../components/StatCard'
import { SectionHeader } from '../components/SectionHeader'

const CHART_COLORS = ['#ff2d2d', '#00d4ff', '#22c55e', '#eab308', '#a855f7', '#f97316']

export function PlayerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const rows = useStore((s) => s.rows)
  const updateSeason = useStore((s) => s.updateSeason)
  const changeTeam = useStore((s) => s.changeTeam)
  const deletePlayer = useStore((s) => s.deletePlayer)

  const player = useMemo(() => groupByPlayer(rows).find((p) => p.PlayerID === id), [rows, id])
  const isPitcher = useMemo(() => (player ? isPlayerPitcher(player) : false), [player])

  const [tab, setTab] = useState<'overview' | 'ratings' | 'stats' | 'timeline'>('overview')
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>(
    isPitcher ? ['Velocity', 'Control', 'Break'] : ['ContactR', 'PowerR', 'Vision'],
  )
  const [selectedStats, setSelectedStats] = useState<string[]>(
    isPitcher ? ['ERA', 'K_Pitched'] : ['HR', 'AVG'],
  )
  const [editMode, setEditMode] = useState(false)
  const [editingTeam, setEditingTeam] = useState<{ season: number; value: string } | null>(null)

  if (!player) {
    return (
      <div className="text-center py-24">
        <div className="font-display text-4xl text-text-tertiary mb-4">PLAYER NOT FOUND</div>
        <Link to="/players" className="text-cool underline">← Back to roster</Link>
      </div>
    )
  }

  const cur = getCurrentSeason(player)
  const career = computeCareerTotals(player)
  const ovrDelta = player.seasons.length > 1
    ? cur.OVR - player.seasons[player.seasons.length - 2].OVR
    : null

  const ratingsChartData = player.seasons.map((s) => {
    const point: any = { Season: `S${s.Season}` }
    HITTING_ATTRS.forEach((a) => point[a] = s[a])
    FIELD_ATTRS.forEach((a) => point[a] = s[a])
    PITCHING_ATTRS.forEach((a) => point[a] = s[a])
    point.OVR = s.OVR
    point.Potential = s.Potential
    return point
  })

  const statsChartData = player.seasons.map((s) => {
    const point: any = { Season: `S${s.Season}` }
    HITTING_STATS.forEach((a) => point[a] = s[a])
    PITCHING_STATS.forEach((a) => point[a] = s[a])
    return point
  })

  // Radar data for current season
  const radarData = (isPitcher ? PITCHING_ATTRS : HITTING_ATTRS).map((attr) => ({
    attr: String(attr).replace(/([A-Z])/g, ' $1').trim(),
    value: Number(cur[attr]) || 0,
  }))

  const allAttrs = isPitcher
    ? [...PITCHING_ATTRS, ...FIELD_ATTRS]
    : [...HITTING_ATTRS, ...FIELD_ATTRS]
  const allStats = isPitcher ? PITCHING_STATS : HITTING_STATS

  const handleDelete = () => {
    if (confirm(`Permanently delete ${player.Name} and all their seasons?`)) {
      deletePlayer(player.PlayerID)
      navigate('/players')
    }
  }

  return (
    <div className="space-y-6 stagger-fade">
      {/* Back */}
      <Link to="/players" className="text-text-tertiary text-xs uppercase tracking-[0.2em] font-mono hover:text-accent flex items-center gap-2 w-fit">
        <ArrowLeft size={14} /> All Players
      </Link>

      {/* Header */}
      <div className="card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
        <div className="relative flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="font-mono text-[11px] text-text-tertiary uppercase tracking-[0.3em] mb-2">
              #{player.PlayerID} · {cur.PrimaryPosition}{cur.SecondaryPosition ? `/${cur.SecondaryPosition}` : ''} · {cur.Team}
            </div>
            <h1 className="font-display text-7xl tracking-tight uppercase text-text-primary leading-none">
              {player.Name}
            </h1>
            {player.Nickname && (
              <div className="font-display text-2xl text-accent uppercase tracking-wide italic mt-2">
                "{player.Nickname}"
              </div>
            )}
            <div className="flex gap-6 mt-4 font-mono text-xs uppercase tracking-wider text-text-secondary">
              <span>B: {player.Bats}</span>
              <span>T: {player.Throws}</span>
              <span>Age: {cur.Age}</span>
              {cur.Height && <span>HT: {cur.Height}</span>}
              {cur.Weight && <span>WT: {cur.Weight}</span>}
              <span>Seasons: {player.seasons.length}</span>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="text-right">
              <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Current</div>
              <div className="stat-display text-7xl text-accent leading-none">{cur.OVR}</div>
              {ovrDelta !== null && (
                <div className={`mono text-sm font-bold mt-1 ${ovrDelta > 0 ? 'text-positive' : ovrDelta < 0 ? 'text-negative' : 'text-text-tertiary'}`}>
                  {ovrDelta > 0 ? '+' : ''}{ovrDelta} since last
                </div>
              )}
            </div>
            <div className="text-right border-l border-border pl-4">
              <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Potential</div>
              <div className="stat-display text-4xl text-text-primary leading-none">{cur.Potential}</div>
            </div>
          </div>
        </div>

        {/* Quirks/awards */}
        {(cur.Quirks || career.awards.length > 0) && (
          <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-2">
            {(() => {
              const counts = new Map<string, number>()
              for (const a of career.awards) {
                counts.set(a, (counts.get(a) || 0) + 1)
              }
              return Array.from(counts.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <span key={name} className="text-xs uppercase tracking-wider px-3 py-1 bg-accent/15 text-accent border border-accent/30 font-bold font-mono">
                    🏆 {count > 1 && <span className="text-accent-bright">{count}× </span>}{name}
                  </span>
                ))
            })()}
            {cur.Quirks?.split(',').map((q, i) => (
              <span key={`q${i}`} className="text-xs uppercase tracking-wider px-3 py-1 bg-bg-elevated text-text-secondary border border-border font-mono">
                {q.trim()}
              </span>
            ))}
            {cur.Flaw && (
              <span className="text-xs uppercase tracking-wider px-3 py-1 bg-negative/10 text-negative border border-negative/30 font-mono">
                ⚠ {cur.Flaw}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Career headline stats */}
      {!isPitcher ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Career AVG" value={fmtAvg(career.AVG)} accent />
          <StatCard label="Career HR" value={career.HR} />
          <StatCard label="Career RBI" value={career.RBI} />
          <StatCard label="Career OPS" value={career.OPS.toFixed(3).replace(/^0/, '')} />
          <StatCard label="Career WAR" value={career.WAR.toFixed(1)} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Career W-L" value={`${career.W}-${career.L}`} accent />
          <StatCard label="Career ERA" value={fmtERA(career.ERA)} />
          <StatCard label="Career K" value={career.K_Pitched} />
          <StatCard label="WHIP" value={career.WHIP.toFixed(2)} />
          <StatCard label="IP" value={career.IP.toFixed(1)} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['overview', 'ratings', 'stats', 'timeline'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 font-display tracking-wide uppercase text-sm border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-accent text-text-primary' : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <SectionHeader title="Attribute Snapshot" subtitle={`Season ${cur.Season}`} />
            <div className="card p-6">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#22232b" />
                  <PolarAngleAxis dataKey="attr" stroke="#a1a1a6" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 99]} stroke="#48484d" tick={{ fontSize: 10 }} />
                  <Radar name={player.Name} dataKey="value" stroke="#ff2d2d" fill="#ff2d2d" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232b', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <SectionHeader title="Pitch Arsenal" />
            {isPitcher && cur.Pitch1Type ? (
              <div className="card p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => {
                  const type = (cur as any)[`Pitch${i}Type`]
                  if (!type) return null
                  const mph = (cur as any)[`Pitch${i}MPH`]
                  const velo = (cur as any)[`Pitch${i}Velo`]
                  const ctrl = (cur as any)[`Pitch${i}Ctrl`]
                  const brk = (cur as any)[`Pitch${i}Break`]
                  return (
                    <div key={i} className="border-b border-border pb-3 last:border-0">
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="font-bold uppercase tracking-wider">{type}</div>
                        <div className="stat-display text-2xl text-accent">{mph} <span className="text-xs text-text-tertiary">MPH</span></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <div><span className="text-text-tertiary">VEL </span><span className="text-text-primary">{velo}</span></div>
                        <div><span className="text-text-tertiary">CTRL </span><span className="text-text-primary">{ctrl}</span></div>
                        <div><span className="text-text-tertiary">BRK </span><span className="text-text-primary">{brk}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card p-5 text-text-tertiary font-mono text-sm uppercase tracking-wider">
                {isPitcher ? 'No pitch data set' : 'Position player'}
              </div>
            )}

            {/* Tendencies */}
            <div className="mt-6">
              <SectionHeader title="Tendencies" />
              <div className="card p-5">
                {!isPitcher && cur.PullPct !== undefined ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary mb-1">Spray</div>
                      <div className="flex h-2 bg-bg-input">
                        <div className="bg-accent" style={{ width: `${cur.PullPct}%` }} />
                        <div className="bg-cool" style={{ width: `${cur.CenterPct}%` }} />
                        <div className="bg-yellow-500" style={{ width: `${cur.OppoPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-text-tertiary mt-1">
                        <span>PULL {cur.PullPct}%</span>
                        <span>CTR {cur.CenterPct}%</span>
                        <span>OPPO {cur.OppoPct}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary mb-1">Batted Ball</div>
                      <div className="flex h-2 bg-bg-input">
                        <div className="bg-positive" style={{ width: `${cur.GBPct}%` }} />
                        <div className="bg-cool" style={{ width: `${cur.LDPct}%` }} />
                        <div className="bg-accent" style={{ width: `${cur.FBPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-text-tertiary mt-1">
                        <span>GB {cur.GBPct}%</span>
                        <span>LD {cur.LDPct}%</span>
                        <span>FB {cur.FBPct}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs font-mono pt-2 border-t border-border">
                      <span className="text-text-tertiary">SWING %</span>
                      <span className="text-text-primary">{cur.SwingPct}%</span>
                    </div>
                  </div>
                ) : isPitcher && cur.StrikePct !== undefined ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span className="text-text-tertiary font-mono text-xs uppercase">Inside</span><span className="font-mono">{cur.InsidePct}%</span></div>
                    <div className="flex justify-between"><span className="text-text-tertiary font-mono text-xs uppercase">Outside</span><span className="font-mono">{cur.OutsidePct}%</span></div>
                    <div className="flex justify-between"><span className="text-text-tertiary font-mono text-xs uppercase">Strike %</span><span className="font-mono">{cur.StrikePct}%</span></div>
                    <div className="flex justify-between"><span className="text-text-tertiary font-mono text-xs uppercase">1st K%</span><span className="font-mono">{cur.FirstPitchStrikePct}%</span></div>
                  </div>
                ) : (
                  <div className="text-text-tertiary font-mono text-xs uppercase">No tendency data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RATINGS TAB */}
      {tab === 'ratings' && (
        <div className="space-y-6">
          <SectionHeader
            title="Ratings Progression"
            subtitle="Click attributes below to chart over time"
          />

          {/* Attribute selector */}
          <div className="card p-4">
            <div className="flex flex-wrap gap-2">
              {allAttrs.map((attr) => {
                const active = selectedAttrs.includes(String(attr))
                return (
                  <button
                    key={String(attr)}
                    onClick={() => {
                      setSelectedAttrs((prev) =>
                        prev.includes(String(attr))
                          ? prev.filter((a) => a !== String(attr))
                          : prev.length < 6 ? [...prev, String(attr)] : prev,
                      )
                    }}
                    className={`text-xs uppercase tracking-wider px-3 py-1.5 border font-mono transition-colors ${
                      active
                        ? 'bg-accent text-white border-accent'
                        : 'border-border text-text-secondary hover:border-border-bright hover:text-text-primary'
                    }`}
                  >
                    {String(attr)}
                  </button>
                )
              })}
            </div>
            <div className="text-[10px] text-text-tertiary font-mono uppercase tracking-wider mt-2">Max 6 selected</div>
          </div>

          {/* Chart */}
          <div className="card p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={ratingsChartData}>
                <CartesianGrid stroke="#22232b" strokeDasharray="3 3" />
                <XAxis dataKey="Season" stroke="#a1a1a6" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <YAxis domain={[0, 99]} stroke="#a1a1a6" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232b', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                {selectedAttrs.map((attr, i) => (
                  <Line
                    key={attr}
                    type="monotone"
                    dataKey={attr}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
                <Line type="monotone" dataKey="OVR" stroke="#f5f5f7" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-[10px] text-text-tertiary font-mono uppercase tracking-wider mt-2 text-center">
              Dashed white line = OVR
            </div>
          </div>

          {/* All attribute table */}
          <SectionHeader title="All Attributes by Season" />
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated">
                <tr>
                  <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary sticky left-0 bg-bg-elevated">Attr</th>
                  {player.seasons.map((s) => (
                    <th key={s.Season} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary text-right">
                      S{s.Season}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allAttrs.map((attr) => (
                  <tr key={String(attr)} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs sticky left-0 bg-bg-surface">{String(attr)}</td>
                    {player.seasons.map((s) => {
                      const v = Number(s[attr])
                      return (
                        <td key={s.Season} className={`px-3 py-2 font-mono text-right ${
                          v >= 90 ? 'text-accent font-bold' : v >= 75 ? 'text-text-primary' : v >= 50 ? 'text-text-secondary' : 'text-text-tertiary'
                        }`}>
                          {Number.isFinite(v) ? v : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATS TAB */}
      {tab === 'stats' && (
        <div className="space-y-6">
          <SectionHeader
            title="Stats Progression"
            subtitle="Click stats below to chart"
          />

          <div className="card p-4">
            <div className="flex flex-wrap gap-2">
              {allStats.map((stat) => {
                const active = selectedStats.includes(String(stat))
                return (
                  <button
                    key={String(stat)}
                    onClick={() => {
                      setSelectedStats((prev) =>
                        prev.includes(String(stat))
                          ? prev.filter((a) => a !== String(stat))
                          : prev.length < 4 ? [...prev, String(stat)] : prev,
                      )
                    }}
                    className={`text-xs uppercase tracking-wider px-3 py-1.5 border font-mono transition-colors ${
                      active
                        ? 'bg-accent text-white border-accent'
                        : 'border-border text-text-secondary hover:border-border-bright hover:text-text-primary'
                    }`}
                  >
                    {String(stat)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statsChartData}>
                <CartesianGrid stroke="#22232b" strokeDasharray="3 3" />
                <XAxis dataKey="Season" stroke="#a1a1a6" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <YAxis stroke="#a1a1a6" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232b', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                {selectedStats.map((stat, i) => (
                  <Bar key={stat} dataKey={stat} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SectionHeader title="Season-by-Season" />
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated">
                <tr>
                  <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">SEASON</th>
                  {allStats.map((s) => (
                    <th key={String(s)} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary text-right">{String(s)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {player.seasons.map((s) => (
                  <tr key={s.Season} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-text-primary">S{s.Season} · {s.Team}</td>
                    {allStats.map((stat) => {
                      const v = (s as any)[stat]
                      return (
                        <td key={String(stat)} className="px-3 py-2 font-mono text-right text-text-secondary">
                          {v === undefined || v === null ? '—' :
                            ['AVG', 'OBP', 'SLG', 'OPS'].includes(String(stat)) ? fmtAvg(v) :
                            ['ERA', 'WHIP'].includes(String(stat)) ? fmtERA(v) :
                            v}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TIMELINE TAB */}
      {tab === 'timeline' && (
        <div className="space-y-4">
          <SectionHeader
            title="Career Timeline"
            subtitle="Team history · click team to edit"
            right={
              <button
                onClick={() => setEditMode(!editMode)}
                className={`text-xs uppercase tracking-wider px-3 py-2 border flex items-center gap-2 transition-colors ${
                  editMode
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {editMode ? <Save size={12} /> : <Edit3 size={12} />}
                {editMode ? 'Done' : 'Edit'}
              </button>
            }
          />

          <div className="space-y-3">
            {player.seasons.map((s) => (
              <div key={s.Season} className="card accent-line p-5 pl-7">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">
                      Season {s.Season} · {s.Year}
                    </div>
                    <div className="font-display text-2xl uppercase tracking-wide flex items-center gap-2">
                      {editingTeam?.season === s.Season ? (
                        <>
                          <input
                            value={editingTeam.value}
                            onChange={(e) => setEditingTeam({ season: s.Season, value: e.target.value })}
                            className="bg-bg-input border border-border px-2 py-1 text-2xl font-display uppercase"
                          />
                          <button
                            onClick={() => {
                              changeTeam(player.PlayerID, s.Season, editingTeam.value)
                              setEditingTeam(null)
                            }}
                            className="text-positive"
                          >
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditingTeam(null)} className="text-negative">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          {s.Team}
                          {editMode && (
                            <button
                              onClick={() => setEditingTeam({ season: s.Season, value: s.Team })}
                              className="text-text-tertiary hover:text-accent ml-2"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="font-mono text-xs text-text-secondary uppercase mt-1">
                      {s.PrimaryPosition}{s.SecondaryPosition ? ` / ${s.SecondaryPosition}` : ''} · Age {s.Age}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="stat-display text-3xl text-accent leading-none">{s.OVR}</div>
                    <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em] mt-1">
                      POT {s.Potential}
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono pt-3 border-t border-border">
                  {!isPitcher ? (
                    <>
                      <Stat label="HR" value={s.HR} />
                      <Stat label="RBI" value={s.RBI} />
                      <Stat label="AVG" value={s.AVG !== undefined ? fmtAvg(s.AVG) : undefined} />
                      <Stat label="OPS" value={s.OPS !== undefined ? s.OPS.toFixed(3).replace(/^0/, '') : undefined} />
                      <Stat label="SB" value={s.SB} />
                      <Stat label="WAR" value={s.WAR !== undefined ? s.WAR.toFixed(1) : undefined} />
                    </>
                  ) : (
                    <>
                      <Stat label="W-L" value={s.W !== undefined ? `${s.W}-${s.L}` : undefined} />
                      <Stat label="ERA" value={s.ERA !== undefined ? fmtERA(s.ERA) : undefined} />
                      <Stat label="K" value={s.K_Pitched} />
                      <Stat label="WHIP" value={s.WHIP !== undefined ? s.WHIP.toFixed(2) : undefined} />
                      <Stat label="IP" value={s.IP !== undefined ? s.IP.toFixed(1) : undefined} />
                    </>
                  )}
                </div>

                {s.MLBRecord && (
                  <div className="mt-3 px-3 py-2 bg-accent/10 border-l-2 border-accent">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-1">🏆 MLB Record</div>
                    <div className="text-sm text-text-primary">{s.MLBRecord}</div>
                  </div>
                )}

                {s.TeamRecordBroken && (
                  <div className="mt-3 px-3 py-2 bg-cool/10 border-l-2 border-cool">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cool mb-1">⚡ Team Record</div>
                    <div className="text-sm text-text-primary">{s.TeamRecordBroken}</div>
                  </div>
                )}

                {s.SeasonNote && (
                  <div className="mt-2 text-xs text-text-secondary italic leading-relaxed">
                    {s.SeasonNote}
                  </div>
                )}

                {s.Awards && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.Awards.split(';').map((a, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-accent/15 text-accent border border-accent/30 font-bold font-mono">
                        🏆 {a.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {editMode && (
            <div className="card p-5 border-negative/30">
              <div className="font-display text-lg uppercase tracking-wide text-negative mb-2">Danger Zone</div>
              <button
                onClick={handleDelete}
                className="text-xs uppercase tracking-wider px-4 py-2 bg-negative text-white"
              >
                Permanently Delete Player
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value?: any }) {
  if (value === undefined || value === null) return null
  return (
    <span>
      <span className="text-text-tertiary uppercase tracking-wider">{label} </span>
      <span className="text-text-primary">{value}</span>
    </span>
  )
}
