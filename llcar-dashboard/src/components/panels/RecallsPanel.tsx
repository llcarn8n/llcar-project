import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface Recall {
  id: string
  brand: string
  title_ru: string
  description_ru: string
  severity: string
  system: string
  date: string
  models: string[]
  source: string
  count: number
}

interface RecallsPanelProps {
  recalls: Recall[]
}

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: '#FF1744', label: 'КРИТИЧНО' },
  high: { color: '#FF6D00', label: 'ВЫСОКИЙ' },
  medium: { color: '#FFAB00', label: 'СРЕДНИЙ' },
  low: { color: theme.text.muted, label: 'НИЗКИЙ' },
}

export function RecallsPanel({ recalls }: RecallsPanelProps) {
  if (!recalls || recalls.length === 0) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">ОТЗЫВНЫЕ КАМПАНИИ</div>
        <div style={{ textAlign: 'center', padding: '12px 0', color: theme.status.ok, fontSize: 12, fontFamily: "'Rajdhani', sans-serif" }}>
          Отзывных кампаний не найдено
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="hud-header">ОТЗЫВНЫЕ КАМПАНИИ</div>
        <span style={{ fontSize: 9, fontFamily: "'Orbitron', sans-serif", color: theme.accent.cyan, letterSpacing: '0.1em' }}>
          {recalls.length} НАЙДЕНО
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
        {recalls.map((recall, i) => {
          const sev = SEVERITY_CONFIG[recall.severity] || SEVERITY_CONFIG.medium
          return (
            <div key={recall.id || i} style={{
              padding: '8px 10px', borderRadius: 2,
              borderLeft: `3px solid ${sev.color}`,
              background: `${sev.color}06`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.text.primary, lineHeight: 1.2 }}>
                  {recall.title_ru || recall.id}
                </span>
                <span style={{
                  fontSize: 8, fontFamily: "'Orbitron', sans-serif", fontWeight: 600,
                  color: sev.color, padding: '1px 5px', border: `1px solid ${sev.color}40`,
                  borderRadius: 2, background: `${sev.color}10`, letterSpacing: '0.1em', flexShrink: 0, marginLeft: 6,
                }}>
                  {sev.label}
                </span>
              </div>
              <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif" }}>
                {recall.date} · {recall.source} · {recall.count?.toLocaleString('ru-RU')} авто
              </div>
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}
