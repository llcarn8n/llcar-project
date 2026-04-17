import type { CSSProperties } from 'react'

export type DataDotSeverity = 'default' | 'ok' | 'warn' | 'crit'

interface DataDotProps {
  severity?: DataDotSeverity
  size?: number
  pulse?: boolean
  style?: CSSProperties
}

const haloByState: Record<DataDotSeverity, string> = {
  default: '0 0 6px rgba(239,242,247,0.25), 0 0 14px rgba(239,242,247,0.10)',
  ok:      '0 0 8px var(--glow-ok), 0 0 20px var(--glow-ok-soft)',
  warn:    '0 0 8px var(--glow-warn), 0 0 20px var(--glow-warn-soft)',
  crit:    '0 0 10px var(--glow-critical), 0 0 24px var(--glow-critical-soft)',
}

export function DataDot({
  severity = 'default',
  size = 6,
  pulse,
  style,
}: DataDotProps) {
  const animate = pulse ?? severity === 'crit'
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--c-spectral)',
        boxShadow: haloByState[severity],
        animation: animate ? 'datadot-pulse 1s ease-in-out infinite' : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      <style>{`
        @keyframes datadot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </span>
  )
}
