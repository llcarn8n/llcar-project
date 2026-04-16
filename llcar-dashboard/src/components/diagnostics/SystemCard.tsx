import { theme } from '../../theme'

interface SystemCardProps {
  name: string
  icon: string
  score: number
  sparkline: number[]
  oldScore?: number
  trend?: string  // ↑ ↓ →
  compact?: boolean
  onClick?: () => void
  degradationRate?: number
}

function scoreColor(s: number): string {
  if (s >= 80) return theme.status.ok
  if (s >= 50) return theme.status.warning
  return theme.status.critical
}

export function SystemCard({ name, icon, score, sparkline, oldScore, trend, compact, onClick, degradationRate }: SystemCardProps) {
  const color = scoreColor(score)
  const diff = oldScore != null ? score - oldScore : null
  const maxSpark = Math.max(...sparkline, 1)

  if (compact) {
    const trendArrow = diff != null ? (diff > 0 ? '↑' : diff < 0 ? '↓' : '→') : (trend || '')
    const trendColor = diff != null ? (diff > 0 ? theme.status.ok : diff < 0 ? theme.status.critical : theme.text.muted) : theme.text.muted
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 6, cursor: onClick ? 'pointer' : 'default',
          background: `linear-gradient(135deg, ${color}10, transparent)`, border: `1px solid ${color}20`,
          borderLeft: `3px solid ${color}`,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: 'var(--f-body)', lineHeight: 1 }}>
            {name}
          </div>
          {/* Mini sparkline */}
          {sparkline.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'end', gap: 1, height: 10, marginTop: 2 }}>
              {sparkline.slice(-8).map((v, i) => (
                <div key={i} style={{
                  width: 2, borderRadius: 1, height: Math.max(1, (v / maxSpark) * 10),
                  background: scoreColor(v), opacity: 0.7,
                }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 18, fontWeight: 700, fontFamily: 'var(--f-mono)',
            color, textShadow: `0 0 6px ${color}44`, lineHeight: 1,
          }}>
            {score}
          </div>
          {trendArrow && (
            <div style={{ fontSize: 9, color: trendColor, fontFamily: 'var(--f-body)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {trendArrow} {diff != null && oldScore != null ? `${diff > 0 ? '+' : ''}${diff}` : ''}
              {degradationRate != null && Math.abs(degradationRate) > 0.1 && (
                <span style={{
                  fontSize: 9,
                  fontFamily: 'var(--f-mono)',
                  color: degradationRate < -0.5 ? '#ff1744' : degradationRate > 0.5 ? '#00e676' : 'rgba(255,255,255,0.35)',
                  marginLeft: 2,
                }}>
                  {degradationRate > 0 ? '+' : ''}{degradationRate.toFixed(1)}/д
                </span>
              )}
              {degradationRate != null && (
                <span style={{ display: 'inline-flex', gap: 1, marginLeft: 3 }}>
                  {[0, 1, 2].map(i => {
                    const absRate = Math.abs(degradationRate)
                    const active = absRate > i * 1.5
                    const dotColor = degradationRate < 0
                      ? (active ? '#ff1744' : 'rgba(255,23,68,0.15)')
                      : (active ? '#00e676' : 'rgba(0,230,118,0.15)')
                    return <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: dotColor }} />
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        textAlign: 'center', padding: '12px 8px', borderRadius: 6, cursor: onClick ? 'pointer' : 'default',
        background: `${color}06`, border: `1px solid ${color}20`,
        transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: 11, color: theme.text.muted, fontFamily: 'var(--f-body)', marginBottom: 2 }}>
        {icon} {name}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700, fontFamily: 'var(--f-mono)',
        color, textShadow: `0 0 8px ${color}44`,
      }}>
        {score}
      </div>

      {/* Sparkline */}
      {sparkline.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'center', gap: 2, height: 20, margin: '6px 0' }}>
          {sparkline.map((v, i) => (
            <div key={i} style={{
              width: 3, borderRadius: 1,
              height: Math.max(2, (v / maxSpark) * 20),
              background: scoreColor(v),
            }} />
          ))}
        </div>
      )}

      {/* Diff */}
      {diff != null && oldScore != null && (
        <div style={{
          fontSize: 10, fontWeight: 600, fontFamily: 'var(--f-body)',
          color: diff > 0 ? theme.status.ok : diff < 0 ? theme.status.critical : theme.text.muted,
        }}>
          {trend || (diff > 0 ? '↑' : diff < 0 ? '↓' : '→')} {oldScore} → {score}
        </div>
      )}
      {diff == null && trend && (
        <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: 'var(--f-body)' }}>
          {trend} стабильно
        </div>
      )}
    </div>
  )
}
