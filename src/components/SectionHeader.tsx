type Props = {
  title: string
  subtitle?: string
  right?: React.ReactNode
}

export function SectionHeader({ title, subtitle, right }: Props) {
  return (
    <div className="flex items-end justify-between mb-4 pb-3 border-b border-border">
      <div>
        <h2 className="font-display text-3xl tracking-wide uppercase text-text-primary">
          {title}
        </h2>
        {subtitle && (
          <p className="font-mono text-[11px] text-text-tertiary uppercase tracking-[0.2em] mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}
