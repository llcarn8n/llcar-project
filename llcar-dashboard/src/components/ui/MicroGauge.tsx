import type { CSSProperties, ReactNode } from 'react'

interface MicroGaugeProps {
  value: number
  min?: number
  max?: number
  size?: number
  label?: ReactNode
  unit?: ReactNode
  style?: CSSProperties
}

export function MicroGauge({
  value,
  min = 0,
  max = 100,
  size = 72,
  label,
  unit,
  style,
}: MicroGaugeProps) {
  const clamped = Math.max(min, Math.min(max, value))
  const norm = (clamped - min) / (max - min || 1)
  const stroke = 1.5
  const r = size / 2 - stroke * 2
  const cx = size / 2
  const cy = size / 2 + 4
  const startA = Math.PI * 0.9
  const endA = Math.PI * 0.1
  const arcA = -(Math.PI * 2 - (endA - startA + Math.PI * 2) % (Math.PI * 2))
  const totalSweep = Math.PI
  const valueEndA = startA - totalSweep * norm
  void arcA

  const polar = (ang: number) => [cx + r * Math.cos(ang), cy - r * Math.sin(ang)] as const
  const [sx, sy] = polar(startA)
  const [ex, ey] = polar(endA)
  const [vx, vy] = polar(valueEndA)

  const bgPath = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
  const valuePath = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 0 1 ${vx.toFixed(2)} ${vy.toFixed(2)}`

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2, ...style }}>
      <div style={{ position: 'relative', width: size, height: size * 0.75 }}>
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
          <path d={bgPath} stroke="var(--c-spectral-ghost)" strokeWidth={stroke} fill="none" strokeLinecap="round" />
          <path d={valuePath} stroke="var(--c-spectral)" strokeWidth={stroke} fill="none" strokeLinecap="round" />
        </svg>
        <div style={{
          position: 'absolute',
          top: '55%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--f-display)',
          fontSize: size * 0.28,
          fontWeight: 200,
          color: 'var(--c-spectral)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {Math.round(clamped)}
          {unit && <span style={{ fontSize: size * 0.14, fontWeight: 400, color: 'var(--c-spectral-muted)', marginLeft: 2 }}>{unit}</span>}
        </div>
      </div>
      {label && (
        <span style={{
          fontFamily: 'var(--f-body)',
          fontSize: 9,
          fontWeight: 600,
          color: 'var(--c-spectral-muted)',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
        }}>{label}</span>
      )}
    </div>
  )
}
