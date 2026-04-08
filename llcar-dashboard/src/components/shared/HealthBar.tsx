import { theme } from '../../theme'

interface Props {
  score: number // 0-100
  label?: string
  showWear?: boolean
}

export function HealthBar({ score, label, showWear }: Props) {
  const isOffline = score === 0
  const color = isOffline ? theme.text.muted : score >= 80 ? theme.status.ok : score >= 50 ? theme.status.warning : theme.status.critical

  const wear = 100 - score
  const wearColor = wear > 50 ? theme.status.critical : wear >= 20 ? theme.status.warning : theme.status.ok
  const wearLabel = wear > 50 ? 'критично' : wear >= 20 ? 'внимание' : 'отлично'

  return (
    <div>
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
      {showWear && !isOffline && (
        <div className="flex justify-end mt-0.5" style={{ paddingRight: 0 }}>
          <span style={{
            fontSize: '9px',
            fontFamily: 'monospace',
            color: wearColor,
          }}>
            износ: {wear}% — {wearLabel}
          </span>
        </div>
      )}
    </div>
  )
}
