import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Trophy, Star, Crown, Award } from 'lucide-react'
import { useStore } from '../lib/store'
import { groupByPlayer, computeCareerTotals } from '../lib/stats'
import { SectionHeader } from '../components/SectionHeader'

export function TrophyCase() {
  const rows = useStore((s) => s.rows)
  const players = useMemo(() => groupByPlayer(rows), [rows])

  // World Series wins — extracted from TeamRecord
  const wsWins = useMemo(() => {
    const seasons = new Map<number, { year: number; team: string; note: string }>()
    for (const r of rows) {
      if (r.TeamRecord && /WORLD SERIES CHAMPIONS/i.test(r.TeamRecord)) {
        if (!seasons.has(r.Season)) {
          seasons.set(r.Season, { year: r.Year, team: r.Team, note: r.TeamRecord })
        }
      }
    }
    return Array.from(seasons.entries())
      .map(([season, info]) => ({ season, ...info }))
      .sort((a, b) => a.season - b.season)
  }, [rows])

  // MLB records broken — unique per player+season
  const mlbRecords = useMemo(() => {
    const recs: { player: string; playerId: string; season: number; year: number; record: string }[] = []
    for (const r of rows) {
      if (r.MLBRecord) {
        recs.push({
          player: r.Name,
          playerId: r.PlayerID,
          season: r.Season,
          year: r.Year,
          record: r.MLBRecord,
        })
      }
    }
    return recs.sort((a, b) => a.season - b.season)
  }, [rows])

  // Team records broken
  const teamRecords = useMemo(() => {
    const recs: { player: string; playerId: string; season: number; year: number; record: string }[] = []
    for (const r of rows) {
      if (r.TeamRecordBroken) {
        recs.push({
          player: r.Name,
          playerId: r.PlayerID,
          season: r.Season,
          year: r.Year,
          record: r.TeamRecordBroken,
        })
      }
    }
    return recs.sort((a, b) => a.season - b.season)
  }, [rows])

  // Award winners by type
  const awardWinners = useMemo(() => {
    const byAward = new Map<string, { player: string; playerId: string; season: number; year: number }[]>()
    for (const r of rows) {
      if (!r.Awards) continue
      for (const award of r.Awards.split(';').map((a) => a.trim()).filter(Boolean)) {
        if (!byAward.has(award)) byAward.set(award, [])
        byAward.get(award)!.push({
          player: r.Name,
          playerId: r.PlayerID,
          season: r.Season,
          year: r.Year,
        })
      }
    }
    return byAward
  }, [rows])

  // Career leaders for marquee categories
  const careerStars = useMemo(() => {
    const enriched = players.map((p) => ({ p, c: computeCareerTotals(p) }))
    return {
      hr: [...enriched].sort((a, b) => b.c.HR - a.c.HR)[0],
      war: [...enriched].sort((a, b) => b.c.WAR - a.c.WAR)[0],
      k: [...enriched].sort((a, b) => b.c.K_Pitched - a.c.K_Pitched)[0],
      sv: [...enriched].sort((a, b) => b.c.SV - a.c.SV)[0],
    }
  }, [players])

  // Priority awards to feature
  const MAJOR_AWARDS = ['MVP', 'Cy Young', 'Rookie of the Year', 'World Series MVP', 'Batting Title', 'Triple Crown']
  const majorAwardKeys = Array.from(awardWinners.keys()).filter((k) =>
    MAJOR_AWARDS.some((m) => k.toLowerCase().includes(m.toLowerCase())),
  )
  const otherAwardKeys = Array.from(awardWinners.keys())
    .filter((k) => !majorAwardKeys.includes(k))
    .sort((a, b) => (awardWinners.get(b)?.length || 0) - (awardWinners.get(a)?.length || 0))

  if (rows.length === 0) {
    return (
      <div className="text-center py-24 text-text-tertiary font-mono uppercase">
        No franchise data yet
      </div>
    )
  }

  return (
    <div className="space-y-10 stagger-fade">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">
          Hall of Achievement
        </div>
        <h1 className="font-display text-6xl tracking-tight uppercase text-text-primary mt-1">
          Trophy <span className="text-accent">Case</span>
        </h1>
      </div>

      {/* Dynasty banner */}
      {wsWins.length > 0 && (
        <div className="card relative overflow-hidden p-8" style={{
          background: 'linear-gradient(135deg, rgba(255,45,45,0.15) 0%, rgba(255,45,45,0.02) 60%, transparent 100%)',
          borderColor: 'rgba(255,45,45,0.4)',
        }}>
          <div className="absolute -right-8 -top-8 opacity-10">
            <Crown size={200} />
          </div>
          <div className="relative">
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.3em]">Dynasty</div>
            <div className="flex items-baseline gap-4 mt-1">
              <div className="stat-display text-8xl text-accent leading-none">{wsWins.length}</div>
              <div className="font-display text-3xl uppercase tracking-wide text-text-primary">
                World Series Title{wsWins.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {wsWins.map((w, i) => (
                <div key={w.season} className="px-4 py-2 bg-accent/20 border border-accent/40">
                  <div className="font-mono text-[10px] text-accent uppercase tracking-[0.2em]">
                    Title #{i + 1} · Season {w.season} · {w.year}
                  </div>
                  <div className="font-display text-xl uppercase tracking-wide text-text-primary">{w.team}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Career leaders showcase */}
      <div>
        <SectionHeader title="All-Time Greats" subtitle="Career leaders by category" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'HR King', leader: careerStars.hr, value: careerStars.hr?.c.HR, suffix: 'HR' },
            { label: 'WAR Champion', leader: careerStars.war, value: careerStars.war?.c.WAR.toFixed(1), suffix: 'WAR' },
            { label: 'Strikeout King', leader: careerStars.k, value: careerStars.k?.c.K_Pitched, suffix: 'K' },
            { label: 'Saves Leader', leader: careerStars.sv, value: careerStars.sv?.c.SV, suffix: 'SV' },
          ].map((cat) => cat.leader && cat.value !== undefined && Number(cat.value) > 0 && (
            <Link
              key={cat.label}
              to={`/player/${cat.leader.p.PlayerID}`}
              className="card card-hover p-5 group relative"
            >
              <div className="absolute top-3 right-3 text-accent opacity-30 group-hover:opacity-100 transition-opacity">
                <Star size={24} fill="currentColor" />
              </div>
              <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">{cat.label}</div>
              <div className="stat-display text-3xl text-accent mt-1">{cat.value}</div>
              <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">{cat.suffix}</div>
              <div className="font-bold text-sm mt-3 group-hover:text-accent transition-colors">{cat.leader.p.Name}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* MLB Records */}
      {mlbRecords.length > 0 && (
        <div>
          <SectionHeader
            title="MLB Records Broken"
            subtitle={`${mlbRecords.length} entries in the history book`}
            right={<Crown size={20} className="text-accent" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mlbRecords.map((r, i) => (
              <Link
                key={i}
                to={`/player/${r.playerId}`}
                className="card card-hover p-5 group relative accent-line pl-7"
              >
                <div className="font-mono text-[10px] text-accent uppercase tracking-[0.2em] mb-1">
                  Season {r.season} · {r.year}
                </div>
                <div className="text-sm text-text-primary mb-3 leading-snug">{r.record}</div>
                <div className="font-bold text-text-secondary group-hover:text-accent transition-colors text-sm">
                  → {r.player}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Team / Franchise Records */}
      {teamRecords.length > 0 && (
        <div>
          <SectionHeader
            title="Franchise Records"
            subtitle={`${teamRecords.length} team records held`}
            right={<Star size={20} className="text-cool" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teamRecords.map((r, i) => (
              <Link
                key={i}
                to={`/player/${r.playerId}`}
                className="card card-hover p-5 group relative pl-7"
                style={{ borderLeft: '4px solid #00d4ff' }}
              >
                <div className="font-mono text-[10px] text-cool uppercase tracking-[0.2em] mb-1">
                  ⚡ Team Record · Season {r.season}
                </div>
                <div className="text-sm text-text-primary mb-3 leading-snug">{r.record}</div>
                <div className="font-bold text-text-secondary group-hover:text-cool transition-colors text-sm">
                  → {r.player}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Major awards */}
      {majorAwardKeys.length > 0 && (
        <div>
          <SectionHeader
            title="Major Awards"
            subtitle="MVP, Cy Young, ROY & more"
            right={<Trophy size={20} className="text-accent" />}
          />
          <div className="space-y-4">
            {majorAwardKeys.map((awardName) => {
              const winners = awardWinners.get(awardName) || []
              return (
                <div key={awardName} className="card p-5">
                  <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-border">
                    <h3 className="font-display text-2xl uppercase tracking-wide">{awardName}</h3>
                    <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em]">
                      {winners.length} winner{winners.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {winners.map((w, i) => (
                      <Link
                        key={i}
                        to={`/player/${w.playerId}`}
                        className="text-xs uppercase tracking-wider px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white font-mono transition-colors flex items-center gap-2"
                      >
                        <span className="font-bold">S{w.season}</span>
                        <span className="text-text-primary">·</span>
                        <span>{w.player}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Other awards */}
      {otherAwardKeys.length > 0 && (
        <div>
          <SectionHeader title="Honors Wall" subtitle="Gold Gloves, Silver Sluggers, All-Star nods" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherAwardKeys.map((awardName) => {
              const winners = awardWinners.get(awardName) || []
              return (
                <div key={awardName} className="card p-4">
                  <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em] mb-1">
                    {winners.length}× winners
                  </div>
                  <div className="font-display text-lg uppercase tracking-wide mb-3 leading-tight">
                    {awardName}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {winners.slice(0, 8).map((w, i) => (
                      <Link
                        key={i}
                        to={`/player/${w.playerId}`}
                        className="text-[10px] font-mono px-2 py-1 bg-bg-elevated border border-border hover:border-accent hover:text-accent uppercase"
                      >
                        {w.player.split(' ')[0]} <span className="text-text-tertiary">S{w.season}</span>
                      </Link>
                    ))}
                    {winners.length > 8 && (
                      <span className="text-[10px] font-mono px-2 py-1 text-text-tertiary uppercase">
                        +{winners.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
