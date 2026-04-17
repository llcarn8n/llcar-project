import type { CSSProperties, ReactNode } from 'react'

interface HeroNumericProps {
  value: ReactNode
  subLabel?: ReactNode
  statusLabel?: ReactNode
  size?: number
  style?: CSSProperties
}

export function HeroNumeric({
  value,
  subLabel,
  statusLabel,
  size = 200,
  style,
}: HeroNumericProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, ...style }}>
      {statusLabel && (
        <span style={{
          fontFamily: 'var(--f-body)',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--c-spectral-muted)',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
        }}>{statusLabel}</span>
      )}
      <span style={{
        fontFamily: 'var(--f-display)',
        fontSize: size,
        fontWeight: 100,
        lineHeight: 1,
        letterSpacing: '-0.05em',
        color: '#F2E4C2',
        textShadow: '0 0 24px rgba(200,180,142,0.40), 0 0 6px rgba(200,180,142,0.30)',
      }}>{value}</span>
      {subLabel && (
        <span style={{
          fontFamily: 'var(--f-body)',
          fontSize: 14,
          fontWeight: 400,
          color: 'var(--c-spectral-muted)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginTop: 4,
        }}>{subLabel}</span>
      )}
    </div>
  )
}
