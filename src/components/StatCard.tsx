type Props = {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  delta?: number | null
}

export function StatCard({ label, value, sub, accent, delta }: Props) {
  return (
    <div className={`card p-5 ${accent ? 'accent-line pl-6' : ''}`}>
      <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-[0.2em] mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className={`stat-display text-4xl ${accent ? 'text-accent' : 'text-text-primary'}`}>
          {value}
        </div>
        {delta !== undefined && delta !== null && (
          <div
            className={`mono text-xs font-bold ${
              delta > 0 ? 'text-positive' : delta < 0 ? 'text-negative' : 'text-text-tertiary'
            }`}
          >
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {Math.abs(delta)}
          </div>
        )}
      </div>
      {sub && (
        <div className="font-mono text-[11px] text-text-secondary mt-1">{sub}</div>
      )}
    </div>
  )
}
