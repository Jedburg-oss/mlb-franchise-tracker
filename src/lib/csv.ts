import Papa from 'papaparse'
import type { PlayerSeason } from './types'

const NUMERIC_FIELDS = new Set([
  'Season', 'Year', 'Age', 'Weight', 'OVR', 'Potential',
  'ContactL', 'ContactR', 'PowerL', 'PowerR', 'Vision', 'Discipline',
  'PlateVision', 'PlatePatience', 'Bunting', 'DragBunting', 'Durability', 'ClutchHitting',
  'Speed', 'Stealing', 'BRAggression', 'Fielding', 'Reaction',
  'ArmStrength', 'ArmAccuracy', 'Blocking', 'Framing', 'PitchCalling', 'Composure',
  'Stamina', 'HPer9', 'KPer9', 'BBPer9', 'HRPer9',
  'Velocity', 'Control', 'Break', 'ClutchPitching', 'PitchingComposure',
  'Pitch1MPH', 'Pitch1Velo', 'Pitch1Ctrl', 'Pitch1Break',
  'Pitch2MPH', 'Pitch2Velo', 'Pitch2Ctrl', 'Pitch2Break',
  'Pitch3MPH', 'Pitch3Velo', 'Pitch3Ctrl', 'Pitch3Break',
  'Pitch4MPH', 'Pitch4Velo', 'Pitch4Ctrl', 'Pitch4Break',
  'PullPct', 'CenterPct', 'OppoPct', 'GBPct', 'LDPct', 'FBPct', 'SwingPct',
  'InsidePct', 'OutsidePct', 'StrikePct', 'FirstPitchStrikePct',
  'G', 'PA', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'SB', 'CS',
  'AVG', 'OBP', 'SLG', 'OPS', 'WAR',
  'W', 'L', 'ERA', 'WHIP', 'P_GP', 'GS', 'IP', 'H_Allowed', 'ER',
  'K_Pitched', 'BB_Allowed', 'HR_Allowed', 'SV', 'HLD', 'BS', 'CG', 'SHO',
  'PO', 'A', 'E', 'FPCT', 'DP',
])

export type ParseResult = {
  rows: PlayerSeason[]
  errors: string[]
  warnings: string[]
}

export function parseCSV(input: string | File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(input as any, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const errors: string[] = []
        const warnings: string[] = []
        const rows: PlayerSeason[] = []

        const requiredFields = ['PlayerID', 'Name', 'Season', 'Team', 'PrimaryPosition', 'OVR']
        const headers = results.meta.fields ?? []
        for (const f of requiredFields) {
          if (!headers.includes(f)) {
            errors.push(`Missing required column: ${f}`)
          }
        }
        if (errors.length > 0) {
          resolve({ rows, errors, warnings })
          return
        }

        results.data.forEach((rawRow: any, idx: number) => {
          const row: any = {}
          for (const key of Object.keys(rawRow)) {
            const value = rawRow[key]
            if (value === '' || value === null || value === undefined) {
              continue
            }
            if (NUMERIC_FIELDS.has(key)) {
              const n = Number(value)
              if (!Number.isNaN(n)) {
                row[key] = n
              } else {
                warnings.push(`Row ${idx + 2}: "${key}" is not numeric ("${value}"), skipped`)
              }
            } else {
              row[key] = String(value).trim()
            }
          }
          if (!row.PlayerID || !row.Name || row.Season === undefined) {
            warnings.push(`Row ${idx + 2}: missing identifiers, skipped`)
            return
          }
          rows.push(row as PlayerSeason)
        })

        resolve({ rows, errors, warnings })
      },
      error: (err: any) => {
        resolve({ rows: [], errors: [err.message], warnings: [] })
      },
    } as any)
  })
}
