import { theme } from '../../theme'

interface Props {
  score: number // 0-100
  label?: string
}

export function HealthBar({ score, label }: Props) {
  const isOffline = score === 0
  const color = isOffline ? theme.text.muted : score >= 80 ? theme.status.ok : score >= 50 ? theme.status.warning : theme.status.critical
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-xs text-white/50 font-mono uppercase w-20">{label}</span>}
      <div className="flex-1 health-track">
        <div
          className="health-fill"
          style={{
            width: `${Math.max(score, 2)}%`,
            backgroundColor: color,
            boxShadow: isOffline ? 'none' : `0 0 8px ${color}, 0 0 16px ${color}40`,
            opacity: isOffline ? 0.3 : 1,
          }}
        />
      </div>
      <span className="text-sm font-mono font-bold w-8 text-right" style={{ color }}>{isOffline ? '--' : score}</span>
    </div>
  )
}
