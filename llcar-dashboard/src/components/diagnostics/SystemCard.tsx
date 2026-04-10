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
}

function scoreColor(s: number): string {
  if (s >= 80) return theme.status.ok
  if (s >= 50) return theme.status.warning
  return theme.status.critical
}

export function SystemCard({ name, icon, score, sparkline, oldScore, trend, compact, onClick }: SystemCardProps) {
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
          <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", lineHeight: 1 }}>
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
            fontSize: 18, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace",
            color, textShadow: `0 0 6px ${color}44`, lineHeight: 1,
          }}>
            {score}
          </div>
          {trendArrow && (
            <div style={{ fontSize: 9, color: trendColor, fontFamily: "'Rajdhani', sans-serif" }}>
              {trendArrow} {diff != null && oldScore != null ? `${diff > 0 ? '+' : ''}${diff}` : ''}
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
      <div style={{ fontSize: 11, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", marginBottom: 2 }}>
        {icon} {name}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace",
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
          fontSize: 10, fontWeight: 600, fontFamily: "'Rajdhani', sans-serif",
          color: diff > 0 ? theme.status.ok : diff < 0 ? theme.status.critical : theme.text.muted,
        }}>
          {trend || (diff > 0 ? '↑' : diff < 0 ? '↓' : '→')} {oldScore} → {score}
        </div>
      )}
      {diff == null && trend && (
        <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif" }}>
          {trend} стабильно
        </div>
      )}
    </div>
  )
}
