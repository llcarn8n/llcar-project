import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'
import type { HistoryEntry } from '../../hooks/useDiagnosticV2'

interface TripCompareProps {
  history: HistoryEntry[]
}

export function TripCompare({ history }: TripCompareProps) {
  if (!history || history.length < 2) return null

  const newest = history[0]  // most recent
  const oldest = history[history.length - 1]  // oldest in range

  const systems = [
    { key: 'overall_score', label: 'Общий' },
    { key: 'suspension_score', label: 'Подвеска' },
    { key: 'engine_score', label: 'Двигатель' },
    { key: 'electrical_score', label: 'Электрика' },
    { key: 'audio_score', label: 'Аудио' },
  ]

  // Format date from ISO string
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    } catch { return '?' }
  }

  const oldDate = formatDate(oldest.time)
  const newDate = formatDate(newest.time)

  return (
    <GlassPanel>
      <div className="hud-header mb-3">СРАВНЕНИЕ</div>

      {/* Date headers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
        <span style={{ fontSize: 9, fontFamily: "var(--f-display)", color: theme.text.muted, letterSpacing: '0.1em' }}>
          {oldDate}
        </span>
        <span style={{ fontSize: 9, fontFamily: "var(--f-display)", color: theme.accent.cyan, letterSpacing: '0.1em' }}>
          {newDate}
        </span>
      </div>

      {/* System comparisons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {systems.map(({ key, label }) => {
          const oldVal = (oldest as any)[key] ?? 0
          const newVal = (newest as any)[key] ?? 0
          const diff = newVal - oldVal
          const diffColor = diff > 0 ? theme.status.ok : diff < 0 ? theme.status.critical : theme.text.muted
          const diffSign = diff > 0 ? '+' : ''

          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Label */}
              <span style={{ width: 65, fontSize: 10, fontFamily: "var(--f-body)", color: theme.text.secondary }}>
                {label}
              </span>

              {/* Old value */}
              <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontFamily: "Consolas, monospace", color: theme.text.muted }}>
                {oldVal}
              </span>

              {/* Arrow */}
              <span style={{ width: 20, textAlign: 'center', fontSize: 12, color: diffColor }}>
                {'\u2192'}
              </span>

              {/* New value */}
              <span style={{
                width: 28, textAlign: 'right', fontSize: 12, fontFamily: "Consolas, monospace", fontWeight: 'bold',
                color: newVal >= 80 ? theme.status.ok : newVal >= 50 ? theme.status.warning : theme.status.critical,
              }}>
                {newVal}
              </span>

              {/* Diff */}
              <span style={{
                flex: 1, textAlign: 'right', fontSize: 11, fontFamily: "Consolas, monospace", fontWeight: 'bold',
                color: diffColor,
              }}>
                {diff !== 0 ? `${diffSign}${diff}` : '\u2014'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(0,229,255,0.08)',
        fontSize: 9, fontFamily: "var(--f-display)", color: theme.text.muted,
        textAlign: 'center', letterSpacing: '0.1em',
      }}>
        {history.length} ЗАМЕРОВ ЗА ПЕРИОД
      </div>
    </GlassPanel>
  )
}
