// Core data model for MLB The Show franchise tracker

export type PlayerSeason = {
  // Identifiers
  PlayerID: string
  Season: number
  Year: number
  Name: string
  Nickname?: string
  Team: string
  PrimaryPosition: string
  SecondaryPosition?: string
  Bats: 'L' | 'R' | 'S'
  Throws: 'L' | 'R'
  Age: number
  Height?: string
  Weight?: number

  // Ratings
  OVR: number
  Potential: number

  // Hitting attributes
  ContactL: number
  ContactR: number
  PowerL: number
  PowerR: number
  Vision: number
  Discipline: number
  PlateVision: number
  PlatePatience: number
  Bunting: number
  DragBunting: number
  Durability: number
  ClutchHitting: number

  // Speed/defense
  Speed: number
  Stealing: number
  BRAggression: number
  Fielding: number
  Reaction: number
  ArmStrength: number
  ArmAccuracy: number
  Blocking?: number
  Framing?: number
  PitchCalling?: number
  Composure: number

  // Pitching
  Stamina?: number
  HPer9?: number
  KPer9?: number
  BBPer9?: number
  HRPer9?: number
  Velocity?: number
  Control?: number
  Break?: number
  ClutchPitching?: number
  PitchingComposure?: number

  // Pitches
  Pitch1Type?: string
  Pitch1MPH?: number
  Pitch1Velo?: number
  Pitch1Ctrl?: number
  Pitch1Break?: number
  Pitch2Type?: string
  Pitch2MPH?: number
  Pitch2Velo?: number
  Pitch2Ctrl?: number
  Pitch2Break?: number
  Pitch3Type?: string
  Pitch3MPH?: number
  Pitch3Velo?: number
  Pitch3Ctrl?: number
  Pitch3Break?: number
  Pitch4Type?: string
  Pitch4MPH?: number
  Pitch4Velo?: number
  Pitch4Ctrl?: number
  Pitch4Break?: number

  // Tendencies
  PullPct?: number
  CenterPct?: number
  OppoPct?: number
  GBPct?: number
  LDPct?: number
  FBPct?: number
  SwingPct?: number
  InsidePct?: number
  OutsidePct?: number
  StrikePct?: number
  FirstPitchStrikePct?: number

  // Misc
  HotZone?: string
  ColdZone?: string
  BattingStance?: string
  Quirks?: string
  Flaw?: string
  NotableTrait?: string

  // Season hitting stats
  G?: number
  PA?: number
  AB?: number
  R?: number
  H?: number
  '2B'?: number
  '3B'?: number
  HR?: number
  RBI?: number
  BB?: number
  SO?: number
  SB?: number
  CS?: number
  AVG?: number
  OBP?: number
  SLG?: number
  OPS?: number
  WAR?: number

  // Season pitching stats
  W?: number
  L?: number
  ERA?: number
  WHIP?: number
  P_GP?: number
  GS?: number
  IP?: number
  H_Allowed?: number
  ER?: number
  K_Pitched?: number
  BB_Allowed?: number
  HR_Allowed?: number
  SV?: number
  HLD?: number
  BS?: number
  CG?: number
  SHO?: number

  // Fielding
  PO?: number
  A?: number
  E?: number
  FPCT?: number
  DP?: number

  // Awards (semicolon-separated string)
  Awards?: string

  // Narrative / record-keeping
  MLBRecord?: string
  SeasonNote?: string
  TeamWL?: string
  TeamRecord?: string
  TeamRecordBroken?: string
}

export type Player = {
  PlayerID: string
  Name: string
  Nickname?: string
  Bats: string
  Throws: string
  seasons: PlayerSeason[]
}

export type CareerTotals = {
  G: number
  AB: number
  R: number
  H: number
  '2B': number
  '3B': number
  HR: number
  RBI: number
  BB: number
  SO: number
  SB: number
  CS: number
  AVG: number
  OBP: number
  SLG: number
  OPS: number
  WAR: number
  // Pitching
  W: number
  L: number
  ERA: number
  WHIP: number
  IP: number
  K_Pitched: number
  SV: number
  HLD: number
  // Awards
  awards: string[]
}

export const PITCHER_POSITIONS = ['SP', 'RP', 'CP', 'CL', 'P']
export const isPitcher = (pos?: string) =>
  !!pos && PITCHER_POSITIONS.includes(pos.toUpperCase())
