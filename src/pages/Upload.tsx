import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Trash2, Download, RefreshCw, Github } from 'lucide-react'
import Papa from 'papaparse'
import { parseCSV } from '../lib/csv'
import { useStore } from '../lib/store'
import type { PlayerSeason } from '../lib/types'
import { SectionHeader } from '../components/SectionHeader'
import { refetchCanonical } from '../hooks/useCanonicalLoader'

export function UploadPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const mergeRows = useStore((s) => s.mergeRows)
  const setRows = useStore((s) => s.setRows)
  const clearAll = useStore((s) => s.clearAll)
  const rows = useStore((s) => s.rows)

  const [previewRows, setPreviewRows] = useState<PlayerSeason[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploadName(file.name)
    const result = await parseCSV(file)
    setPreviewRows(result.rows)
    setErrors(result.errors)
    setWarnings(result.warnings)
  }

  function commitImport() {
    if (previewRows.length === 0) return
    mergeRows(previewRows)
    setPreviewRows([])
    setErrors([])
    setWarnings([])
    setUploadName(null)
    if (fileRef.current) fileRef.current.value = ''
    navigate('/players')
  }

  async function handleRefreshCanonical() {
    setRefreshing(true)
    setRefreshMsg(null)
    const result = await refetchCanonical(setRows)
    if (result.error) {
      setRefreshMsg(`Failed: ${result.error}`)
    } else {
      setRefreshMsg(`Loaded ${result.loaded} rows from canonical CSV.`)
    }
    setRefreshing(false)
  }

  function exportData() {
    if (rows.length === 0) return
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `franchise-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 stagger-fade">
      <SectionHeader
        title="Upload"
        subtitle="Add a season CSV"
        right={
          <div className="flex gap-2">
            {rows.length > 0 && (
              <button
                onClick={exportData}
                className="text-xs uppercase tracking-wider px-3 py-2 border border-border hover:border-border-bright text-text-secondary hover:text-text-primary flex items-center gap-2"
              >
                <Download size={12} /> Export
              </button>
            )}
          </div>
        }
      />

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        className="card border-dashed border-2 p-12 text-center cursor-pointer hover:border-accent transition-colors"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
          className="hidden"
        />
        <FileSpreadsheet size={48} className="mx-auto text-text-tertiary mb-4" />
        <div className="font-display text-2xl uppercase tracking-wide mb-2">
          Drop CSV or Click
        </div>
        <p className="text-text-secondary text-sm">
          Use the template format. New players will be added; existing players (matched by PlayerID + Season) will be updated.
        </p>
        {uploadName && (
          <div className="mt-4 font-mono text-xs text-accent">{uploadName}</div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="card border-negative p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-negative" />
            <div className="font-display text-xl uppercase text-negative">Errors</div>
          </div>
          <ul className="space-y-1 font-mono text-xs text-text-secondary">
            {errors.map((e, i) => (
              <li key={i}>· {e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="card border-yellow-700/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-yellow-500" />
            <div className="font-display text-xl uppercase text-yellow-500">
              {warnings.length} Warning{warnings.length === 1 ? '' : 's'}
            </div>
          </div>
          <ul className="space-y-1 font-mono text-xs text-text-secondary max-h-40 overflow-y-auto">
            {warnings.slice(0, 50).map((w, i) => (
              <li key={i}>· {w}</li>
            ))}
            {warnings.length > 50 && <li>· ... and {warnings.length - 50} more</li>}
          </ul>
        </div>
      )}

      {/* Preview */}
      {previewRows.length > 0 && (
        <div>
          <SectionHeader
            title={`Preview · ${previewRows.length} Rows`}
            subtitle="Review before committing"
            right={
              <button
                onClick={commitImport}
                className="bg-accent text-white px-5 py-2 font-bold uppercase tracking-wider hover:bg-accent-bright transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Commit Import
              </button>
            }
          />
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated">
                <tr>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Player</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Season</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Team</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Pos</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">OVR</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">POT</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">HR</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">AVG</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">ERA</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 30).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2 font-bold">{r.Name}</td>
                    <td className="px-4 py-2 font-mono">{r.Season}</td>
                    <td className="px-4 py-2 font-mono">{r.Team}</td>
                    <td className="px-4 py-2 font-mono">{r.PrimaryPosition}</td>
                    <td className="px-4 py-2 font-mono text-accent">{r.OVR}</td>
                    <td className="px-4 py-2 font-mono">{r.Potential}</td>
                    <td className="px-4 py-2 font-mono">{r.HR ?? '—'}</td>
                    <td className="px-4 py-2 font-mono">{r.AVG !== undefined ? r.AVG.toFixed(3) : '—'}</td>
                    <td className="px-4 py-2 font-mono">{r.ERA !== undefined ? r.ERA.toFixed(2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 30 && (
              <div className="px-4 py-2 text-text-tertiary font-mono text-xs uppercase tracking-wider border-t border-border">
                ... and {previewRows.length - 30} more rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing data summary */}
      {rows.length > 0 && previewRows.length === 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display text-xl uppercase tracking-wide">Current Database</div>
              <div className="font-mono text-xs text-text-tertiary mt-1">
                {rows.length} season-rows · {new Set(rows.map((r) => r.PlayerID)).size} players · {new Set(rows.map((r) => r.Season)).size} seasons
              </div>
            </div>
            <button
              onClick={() => setConfirmClear(true)}
              className="text-negative hover:text-red-300 text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Trash2 size={12} /> Clear All
            </button>
          </div>

          {confirmClear && (
            <div className="mt-4 p-4 border border-negative bg-negative/10">
              <div className="text-sm mb-3">This will permanently delete all franchise data. Continue?</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearAll()
                    setConfirmClear(false)
                  }}
                  className="bg-negative text-white px-4 py-2 text-xs uppercase tracking-wider"
                >
                  Yes, Delete All
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="border border-border px-4 py-2 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Publish workflow */}
      <div className="card p-5 border-accent/30">
        <div className="flex items-center gap-2 mb-3">
          <Github size={18} className="text-accent" />
          <div className="font-display text-xl text-text-primary uppercase tracking-wide">Publish for Friends</div>
        </div>
        <p className="text-sm text-text-secondary mb-3">
          Visitors see the canonical CSV bundled with the site. To update what they see:
        </p>
        <ol className="text-sm text-text-secondary space-y-1 list-decimal pl-5">
          <li>Upload your new season CSV above and commit it locally to preview.</li>
          <li>Click <span className="text-accent font-mono">Export</span> below — saves as <code className="font-mono text-xs text-text-primary">franchise-data.csv</code>.</li>
          <li>Replace <code className="font-mono text-xs text-text-primary">public/franchise-data.csv</code> in your project folder with the export.</li>
          <li>Commit, push, and run <code className="font-mono text-xs text-text-primary">npm run deploy</code>.</li>
        </ol>
        <div className="mt-4 flex gap-2 flex-wrap">
          {rows.length > 0 && (
            <button
              onClick={exportData}
              className="bg-accent text-white px-4 py-2 text-xs uppercase tracking-wider font-bold hover:bg-accent-bright transition-colors flex items-center gap-2"
            >
              <Download size={12} /> Export franchise-data.csv
            </button>
          )}
          <button
            onClick={handleRefreshCanonical}
            disabled={refreshing}
            className="border border-border hover:border-border-bright px-4 py-2 text-xs uppercase tracking-wider text-text-secondary hover:text-text-primary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Reset to Canonical
          </button>
        </div>
        {refreshMsg && (
          <div className="mt-3 font-mono text-xs text-text-secondary">{refreshMsg}</div>
        )}
      </div>

      {/* CSV format reference */}
      <div className="card p-5 text-sm text-text-secondary space-y-2">
        <div className="font-display text-xl text-text-primary uppercase tracking-wide mb-3">CSV Format</div>
        <p>Required columns: <code className="font-mono text-xs text-accent">PlayerID, Name, Season, Team, PrimaryPosition, OVR</code></p>
        <p>One row per player per season. All other columns optional.</p>
        <p>Awards use semicolons: <code className="font-mono text-xs">MVP;Gold Glove;All-Star</code></p>
        <p>Quirks use commas: <code className="font-mono text-xs">Bomber,Hot Head,Clutch Hitter</code></p>
      </div>
    </div>
  )
}
