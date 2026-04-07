import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface Escalation {
  rule_name: string
  display: string
  first_seen: string
  days_active: number
  level: number
  level_name: string
  consecutive_count: number
  was_dismissed: boolean
  max_confidence: number
}

interface EscalationTimelineProps {
  escalations: Escalation[]
}

const LEVEL_COLORS = ['rgba(255,255,255,0.3)', '#FFAB00', '#FF6D00', '#FF1744']
const LEVEL_LABELS = ['ЗАМЕТКА', 'ПРЕДУПРЕЖДЕНИЕ', 'ПРОБЛЕМА', 'СРОЧНО']

export function EscalationTimeline({ escalations }: EscalationTimelineProps) {
  if (!escalations || escalations.length === 0) return null

  return (
    <GlassPanel>
      <div className="hud-header mb-3">ИСТОРИЯ ДИАГНОЗОВ</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {escalations.map(esc => {
          const color = LEVEL_COLORS[Math.min(esc.level, 3)]
          const label = LEVEL_LABELS[Math.min(esc.level, 3)]

          return (
            <div key={esc.rule_name} style={{ padding: '8px 10px', borderRadius: 2, background: `${color}06`, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.text.primary }}>
                  {esc.display}
                </span>
                <span style={{ fontSize: 8, fontFamily: "'Orbitron', sans-serif", color, letterSpacing: '0.1em', padding: '1px 5px', border: `1px solid ${color}40`, borderRadius: 2 }}>
                  {label}
                </span>
              </div>
              {/* Progress bar: 4 segments for 4 levels */}
              <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                {[0, 1, 2, 3].map(lvl => (
                  <div key={lvl} style={{
                    flex: 1, height: 4, borderRadius: 1,
                    background: lvl <= esc.level ? LEVEL_COLORS[lvl] : 'rgba(255,255,255,0.06)',
                    boxShadow: lvl <= esc.level ? `0 0 4px ${LEVEL_COLORS[lvl]}40` : 'none',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: "'Rajdhani', sans-serif", color: theme.text.muted }}>
                <span>{esc.days_active} дн. · {esc.consecutive_count}x подряд</span>
                <span>{esc.was_dismissed ? 'Было отклонено' : `Conf: ${esc.max_confidence}%`}</span>
              </div>
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}
