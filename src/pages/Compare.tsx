import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts'
import { Plus, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { groupByPlayer, getCurrentSeason, computeCareerTotals, isPlayerPitcher,
  fmtAvg, fmtERA, HITTING_ATTRS, PITCHING_ATTRS, HITTING_STATS, PITCHING_STATS } from '../lib/stats'
import { SectionHeader } from '../components/SectionHeader'

const COLORS = ['#ff2d2d', '#00d4ff', '#22c55e', '#eab308']

export function Compare() {
  const rows = useStore((s) => s.rows)
  const players = useMemo(() => groupByPlayer(rows), [rows])

  const [selected, setSelected] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [chartAttr, setChartAttr] = useState<string>('OVR')
  const [chartStat, setChartStat] = useState<string>('HR')

  const selectedPlayers = selected
    .map((id) => players.find((p) => p.PlayerID === id))
    .filter((p): p is NonNullable<typeof p> => !!p)

  const anyPitcher = selectedPlayers.some((p) => isPlayerPitcher(p))
  const allHitters = selectedPlayers.every((p) => !isPlayerPitcher(p))

  // Build chart data for ratings progression
  const allSeasons = Array.from(new Set(rows.map((r) => r.Season))).sort((a, b) => a - b)
  const ratingsData = allSeasons.map((season) => {
    const point: any = { Season: `S${season}` }
    selectedPlayers.forEach((p) => {
      const s = p.seasons.find((sn) => sn.Season === season)
      if (s) point[p.Name] = (s as any)[chartAttr]
    })
    return point
  })

  const statsData = allSeasons.map((season) => {
    const point: any = { Season: `S${season}` }
    selectedPlayers.forEach((p) => {
      const s = p.seasons.find((sn) => sn.Season === season)
      if (s) point[p.Name] = (s as any)[chartStat]
    })
    return point
  })

  // Radar comparing current attribute snapshots
  const radarAttrs = anyPitcher ? PITCHING_ATTRS : HITTING_ATTRS
  const radarData = radarAttrs.map((attr) => {
    const point: any = { attr: String(attr).replace(/([A-Z])/g, ' $1').trim() }
    selectedPlayers.forEach((p) => {
      point[p.Name] = Number(getCurrentSeason(p)[attr]) || 0
    })
    return point
  })

  const filteredPickerPlayers = players
    .filter((p) => !selected.includes(p.PlayerID))
    .filter((p) => !pickerQuery || p.Name.toLowerCase().includes(pickerQuery.toLowerCase()))
    .sort((a, b) => getCurrentSeason(b).OVR - getCurrentSeason(a).OVR)
    .slice(0, 50)

  const allAttrs = anyPitcher ? [...PITCHING_ATTRS, 'OVR', 'Potential'] : [...HITTING_ATTRS, 'OVR', 'Potential']
  const allStats = anyPitcher ? PITCHING_STATS : HITTING_STATS

  return (
    <div className="space-y-6 stagger-fade">
      <SectionHeader
        title="Compare"
        subtitle={`${selectedPlayers.length} of 4 players selected`}
      />

      {/* Player slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => {
          const p = selectedPlayers[i]
          if (p) {
            const cur = getCurrentSeason(p)
            return (
              <div key={i} className="card p-4 relative" style={{ borderColor: COLORS[i] + '50' }}>
                <button
                  onClick={() => setSelected((prev) => prev.filter((id) => id !== p.PlayerID))}
                  className="absolute top-2 right-2 text-text-tertiary hover:text-negative"
                >
                  <X size={14} />
                </button>
                <div className="text-xs font-mono uppercase tracking-wider" style={{ color: COLORS[i] }}>Player {i + 1}</div>
                <div className="font-bold mt-1">{p.Name}</div>
                <div className="text-xs text-text-tertiary font-mono uppercase">{cur.PrimaryPosition} · {cur.Team}</div>
                <div className="stat-display text-3xl text-accent mt-2">{cur.OVR}</div>
              </div>
            )
          }
          return (
            <button
              key={i}
              onClick={() => setShowPicker(true)}
              className="card border-dashed p-4 flex flex-col items-center justify-center text-text-tertiary hover:border-accent hover:text-accent transition-colors min-h-[120px]"
            >
              <Plus size={24} />
              <div className="text-xs uppercase tracking-wider font-mono mt-2">Add Player</div>
            </button>
          )
        })}
      </div>

      {/* Picker modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setShowPicker(false)}>
          <div className="card p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-display text-2xl uppercase tracking-wide">Select Player</div>
              <button onClick={() => setShowPicker(false)}><X size={20} /></button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              className="w-full px-3 py-2 bg-bg-input border border-border focus:border-accent outline-none text-sm font-mono uppercase tracking-wider mb-4"
            />
            <div className="overflow-y-auto flex-1 space-y-1">
              {filteredPickerPlayers.map((p) => {
                const cur = getCurrentSeason(p)
                return (
                  <button
                    key={p.PlayerID}
                    onClick={() => {
                      setSelected((prev) => [...prev, p.PlayerID])
                      setShowPicker(false)
                      setPickerQuery('')
                    }}
                    className="w-full text-left p-3 border border-border hover:border-accent flex items-center gap-3"
                  >
                    <div className="stat-display text-2xl text-accent w-12">{cur.OVR}</div>
                    <div className="flex-1">
                      <div className="font-bold">{p.Name}</div>
                      <div className="text-xs text-text-tertiary font-mono uppercase">{cur.PrimaryPosition} · {cur.Team}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {selectedPlayers.length >= 2 && (
        <>
          {/* Career totals comparison */}
          <SectionHeader title="Career Totals" />
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated">
                <tr>
                  <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Stat</th>
                  {selectedPlayers.map((p, i) => (
                    <th key={p.PlayerID} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-right" style={{ color: COLORS[i] }}>
                      {p.Name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(allHitters
                  ? [
                      { label: 'GAMES', getter: (c: any) => c.G },
                      { label: 'AT BATS', getter: (c: any) => c.AB },
                      { label: 'HITS', getter: (c: any) => c.H },
                      { label: 'HR', getter: (c: any) => c.HR },
                      { label: 'RBI', getter: (c: any) => c.RBI },
                      { label: 'SB', getter: (c: any) => c.SB },
                      { label: 'AVG', getter: (c: any) => fmtAvg(c.AVG) },
                      { label: 'OBP', getter: (c: any) => fmtAvg(c.OBP) },
                      { label: 'SLG', getter: (c: any) => fmtAvg(c.SLG) },
                      { label: 'OPS', getter: (c: any) => c.OPS.toFixed(3).replace(/^0/, '') },
                      { label: 'WAR', getter: (c: any) => c.WAR.toFixed(1) },
                    ]
                  : [
                      { label: 'WINS', getter: (c: any) => c.W },
                      { label: 'LOSSES', getter: (c: any) => c.L },
                      { label: 'ERA', getter: (c: any) => fmtERA(c.ERA) },
                      { label: 'WHIP', getter: (c: any) => c.WHIP.toFixed(2) },
                      { label: 'IP', getter: (c: any) => c.IP.toFixed(1) },
                      { label: 'K', getter: (c: any) => c.K_Pitched },
                      { label: 'SAVES', getter: (c: any) => c.SV },
                      { label: 'HOLDS', getter: (c: any) => c.HLD },
                    ]
                ).map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs text-text-secondary">{row.label}</td>
                    {selectedPlayers.map((p) => {
                      const c = computeCareerTotals(p)
                      return (
                        <td key={p.PlayerID} className="px-3 py-2 font-mono text-right text-text-primary">
                          {row.getter(c)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ratings progression */}
          <SectionHeader title="Ratings Over Time" />
          <div className="card p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {allAttrs.map((attr) => (
                <button
                  key={String(attr)}
                  onClick={() => setChartAttr(String(attr))}
                  className={`text-xs uppercase tracking-wider px-3 py-1.5 border font-mono transition-colors ${
                    chartAttr === String(attr) ? 'bg-accent text-white border-accent' : 'border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {String(attr)}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={ratingsData}>
                <CartesianGrid stroke="#22232b" strokeDasharray="3 3" />
                <XAxis dataKey="Season" stroke="#a1a1a6" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <YAxis stroke="#a1a1a6" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232b', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, textTransform: 'uppercase' }} />
                {selectedPlayers.map((p, i) => (
                  <Line key={p.PlayerID} type="monotone" dataKey={p.Name} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stat progression */}
          <SectionHeader title="Stats Over Time" />
          <div className="card p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {allStats.map((stat) => (
                <button
                  key={String(stat)}
                  onClick={() => setChartStat(String(stat))}
                  className={`text-xs uppercase tracking-wider px-3 py-1.5 border font-mono transition-colors ${
                    chartStat === String(stat) ? 'bg-accent text-white border-accent' : 'border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {String(stat)}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={statsData}>
                <CartesianGrid stroke="#22232b" strokeDasharray="3 3" />
                <XAxis dataKey="Season" stroke="#a1a1a6" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <YAxis stroke="#a1a1a6" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232b', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, textTransform: 'uppercase' }} />
                {selectedPlayers.map((p, i) => (
                  <Line key={p.PlayerID} type="monotone" dataKey={p.Name} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <SectionHeader title="Current Attribute Radar" />
          <div className="card p-6">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#22232b" />
                <PolarAngleAxis dataKey="attr" stroke="#a1a1a6" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <PolarRadiusAxis angle={90} domain={[0, 99]} stroke="#48484d" tick={{ fontSize: 10 }} />
                {selectedPlayers.map((p, i) => (
                  <Radar key={p.PlayerID} name={p.Name} dataKey={p.Name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.2} />
                ))}
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, textTransform: 'uppercase' }} />
                <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232b', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {selectedPlayers.length < 2 && (
        <div className="card p-12 text-center text-text-tertiary font-mono uppercase tracking-wider">
          Select at least 2 players to compare
        </div>
      )}
    </div>
  )
}
