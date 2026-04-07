import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'
import type { HistoryEntry } from '../../hooks/useDiagnosticV2'

interface HealthTrendsProps {
  history: HistoryEntry[]
  trends?: Record<string, string>  // from diagnostic report health_trends
}

export function HealthTrends({ history, trends }: HealthTrendsProps) {
  if (!history || history.length === 0) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">ТРЕНДЫ</div>
        <div style={{
          textAlign: 'center', padding: '20px 0',
          color: theme.text.muted, fontSize: 12, fontFamily: "'Rajdhani', sans-serif"
        }}>
          Нет данных истории
        </div>
      </GlassPanel>
    )
  }

  const systems = [
    { key: 'overall_score', label: 'Общий', color: theme.accent.cyan },
    { key: 'suspension_score', label: 'Подвеска', color: '#FF6B35' },
    { key: 'engine_score', label: 'Двигатель', color: '#FFD700' },
    { key: 'electrical_score', label: 'Электрика', color: '#7B68EE' },
    { key: 'audio_score', label: 'Аудио', color: '#00E676' },
  ]

  // Get latest and earliest scores for sparkline
  const latest = history[0] // newest first
  const sortedHistory = [...history].reverse() // oldest first for sparkline

  return (
    <GlassPanel>
      <div className="hud-header mb-3">ТРЕНДЫ ЗДОРОВЬЯ</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {systems.map(({ key, label, color }) => {
          const values = sortedHistory.map(h => (h as unknown as Record<string, number>)[key] ?? 0)
          const current = latest ? (latest as unknown as Record<string, number>)[key] ?? 0 : 0
          const trendKey = key.replace('_score', '')
          const trendArrow = trends?.[trendKey] ?? '\u2192'

          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Label */}
              <span style={{
                width: 70, fontSize: 11, fontFamily: "'Rajdhani', sans-serif",
                color: theme.text.secondary, letterSpacing: '0.03em'
              }}>
                {label}
              </span>

              {/* Mini sparkline */}
              <div style={{ flex: 1, height: 20, position: 'relative' }}>
                <svg width="100%" height="20" viewBox={`0 0 ${Math.max(values.length - 1, 1)} 100`} preserveAspectRatio="none">
                  <polyline
                    points={values.map((v, i) => `${i},${100 - v}`).join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    opacity={0.8}
                  />
                </svg>
              </div>

              {/* Current score */}
              <span style={{
                width: 30, textAlign: 'right', fontSize: 13,
                fontFamily: "Consolas, monospace", fontWeight: 'bold',
                color: current >= 80 ? theme.status.ok : current >= 50 ? theme.status.warning : theme.status.critical,
              }}>
                {current}
              </span>

              {/* Trend arrow */}
              <span style={{
                width: 20, textAlign: 'center', fontSize: 16,
                color: trendArrow === '\u2193' ? theme.status.critical : trendArrow === '\u2191' ? theme.status.ok : theme.accent.cyan,
              }}>
                {trendArrow}
              </span>
            </div>
          )
        })}
      </div>

      {/* Data count */}
      <div style={{
        marginTop: 8, textAlign: 'right', fontSize: 9,
        fontFamily: "'Orbitron', sans-serif", color: theme.text.muted, letterSpacing: '0.1em'
      }}>
        {history.length} ЗАМЕРОВ
      </div>
    </GlassPanel>
  )
}
