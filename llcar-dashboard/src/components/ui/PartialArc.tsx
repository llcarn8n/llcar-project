import type { CSSProperties, ReactNode } from 'react'

interface PartialArcProps {
  value: number
  min?: number
  max?: number
  size?: number
  strokeWidth?: number
  sweepDeg?: number
  label?: ReactNode
  children?: ReactNode
  style?: CSSProperties
}

export function PartialArc({
  value,
  min = 0,
  max = 100,
  size = 120,
  strokeWidth = 1.5,
  sweepDeg = 240,
  label,
  children,
  style,
}: PartialArcProps) {
  const clamped = Math.max(min, Math.min(max, value))
  const norm = (clamped - min) / (max - min || 1)

  const r = size / 2 - strokeWidth * 2
  const cx = size / 2
  const cy = size / 2

  const startDeg = 90 + (360 - sweepDeg) / 2
  const endDeg = startDeg + sweepDeg
  const valueDeg = startDeg + sweepDeg * norm

  const polar = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const
  }

  const [sx, sy] = polar(startDeg)
  const [ex, ey] = polar(endDeg)
  const [vx, vy] = polar(valueDeg)

  const largeBg = sweepDeg > 180 ? 1 : 0
  const largeVal = sweepDeg * norm > 180 ? 1 : 0

  const bgPath = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${largeBg} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
  const valuePath = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${largeVal} 1 ${vx.toFixed(2)} ${vy.toFixed(2)}`

  return (
    <div style={{ position: 'relative', width: size, height: size, ...style }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path d={bgPath} stroke="var(--c-spectral-ghost)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        <path d={valuePath} stroke="var(--c-spectral)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}>
        {children}
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
    </div>
  )
}
