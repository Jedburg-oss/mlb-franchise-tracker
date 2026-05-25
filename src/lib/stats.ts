import type { PlayerSeason, Player, CareerTotals } from './types'
import { isPitcher } from './types'

export function groupByPlayer(rows: PlayerSeason[]): Player[] {
  const map = new Map<string, Player>()
  for (const r of rows) {
    if (!map.has(r.PlayerID)) {
      map.set(r.PlayerID, {
        PlayerID: r.PlayerID,
        Name: r.Name,
        Nickname: r.Nickname,
        Bats: r.Bats,
        Throws: r.Throws,
        seasons: [],
      })
    }
    map.get(r.PlayerID)!.seasons.push(r)
  }
  for (const p of map.values()) {
    p.seasons.sort((a, b) => a.Season - b.Season)
    const latest = p.seasons[p.seasons.length - 1]
    p.Name = latest.Name
    p.Nickname = latest.Nickname
    p.Bats = latest.Bats
    p.Throws = latest.Throws
  }
  return Array.from(map.values())
}

const sum = (s: PlayerSeason[], k: keyof PlayerSeason): number =>
  s.reduce((a, x) => a + (Number(x[k]) || 0), 0)

export function computeCareerTotals(player: Player): CareerTotals {
  const s = player.seasons
  const G = sum(s, 'G')
  const AB = sum(s, 'AB')
  const R = sum(s, 'R')
  const H = sum(s, 'H')
  const _2B = sum(s, '2B' as any)
  const _3B = sum(s, '3B' as any)
  const HR = sum(s, 'HR')
  const RBI = sum(s, 'RBI')
  const BB = sum(s, 'BB')
  const SO = sum(s, 'SO')
  const SB = sum(s, 'SB')
  const CS = sum(s, 'CS')
  const PA = sum(s, 'PA') || (AB + BB)
  const TB = H + _2B + 2 * _3B + 3 * HR
  const AVG = AB > 0 ? H / AB : 0
  const OBP = PA > 0 ? (H + BB) / PA : 0
  const SLG = AB > 0 ? TB / AB : 0
  const OPS = OBP + SLG
  const WAR = sum(s, 'WAR')

  const W = sum(s, 'W')
  const L = sum(s, 'L')
  const IP = sum(s, 'IP')
  const ER = sum(s, 'ER')
  const H_Allowed = sum(s, 'H_Allowed')
  const BB_Allowed = sum(s, 'BB_Allowed')
  const ERA = IP > 0 ? (ER * 9) / IP : 0
  const WHIP = IP > 0 ? (BB_Allowed + H_Allowed) / IP : 0
  const K_Pitched = sum(s, 'K_Pitched')
  const SV = sum(s, 'SV')
  const HLD = sum(s, 'HLD')

  const awards: string[] = []
  for (const season of s) {
    if (season.Awards) {
      season.Awards.split(';').map((a) => a.trim()).filter(Boolean).forEach((a) => awards.push(a))
    }
  }

  return {
    G, AB, R, H, '2B': _2B, '3B': _3B, HR, RBI, BB, SO, SB, CS,
    AVG, OBP, SLG, OPS, WAR,
    W, L, ERA, WHIP, IP, K_Pitched, SV, HLD,
    awards,
  }
}

export function isPlayerPitcher(player: Player): boolean {
  return player.seasons.some((s) => isPitcher(s.PrimaryPosition) || isPitcher(s.SecondaryPosition))
}

export function fmtAvg(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '.000'
  return n.toFixed(3).replace(/^0/, '')
}

export function fmtERA(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0.00'
  return n.toFixed(2)
}

export function fmtNum(n: number | undefined, digits = 0): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

export function getCurrentSeason(player: Player): PlayerSeason {
  return player.seasons[player.seasons.length - 1]
}

export function getOVRDelta(player: Player): number | null {
  if (player.seasons.length < 2) return null
  const cur = player.seasons[player.seasons.length - 1].OVR
  const prev = player.seasons[player.seasons.length - 2].OVR
  return cur - prev
}

// All hitting attribute keys (for radar/comparison charts)
export const HITTING_ATTRS: (keyof PlayerSeason)[] = [
  'ContactL', 'ContactR', 'PowerL', 'PowerR', 'Vision', 'Discipline',
  'PlateVision', 'PlatePatience', 'Bunting', 'DragBunting', 'Durability', 'ClutchHitting',
]

export const FIELD_ATTRS: (keyof PlayerSeason)[] = [
  'Speed', 'Stealing', 'BRAggression', 'Fielding', 'Reaction',
  'ArmStrength', 'ArmAccuracy', 'Composure',
]

export const PITCHING_ATTRS: (keyof PlayerSeason)[] = [
  'Stamina', 'HPer9', 'KPer9', 'BBPer9', 'HRPer9',
  'Velocity', 'Control', 'Break', 'ClutchPitching', 'PitchingComposure',
]

export const HITTING_STATS: (keyof PlayerSeason)[] = [
  'G', 'AB', 'R', 'H', '2B' as any, '3B' as any, 'HR', 'RBI',
  'BB', 'SO', 'SB', 'CS', 'AVG', 'OBP', 'SLG', 'OPS', 'WAR',
]

export const PITCHING_STATS: (keyof PlayerSeason)[] = [
  'W', 'L', 'ERA', 'WHIP', 'P_GP', 'GS', 'IP',
  'K_Pitched', 'BB_Allowed', 'HR_Allowed', 'SV', 'HLD', 'CG', 'SHO',
]
