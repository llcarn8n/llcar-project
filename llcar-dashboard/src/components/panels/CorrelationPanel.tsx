import { useState, useEffect, useCallback } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface CorrelationResult {
  time: string
  correlation_type: string
  r_value: number
  slope: number
  p_value: number
  data_points: number
  regime: string
  diagnosis_hint: string
}

const HINT_LABELS: Record<string, string> = {
  engine_mount: 'Опоры двигателя',
  wheel_bearing: 'Ступичный подшипник',
  cv_joint: 'ШРУС',
  wheel_balance: 'Дисбаланс колёс',
  accessory_bearing: 'Подшипник генератора/компрессора',
}

const TYPE_LABELS: Record<string, string> = {
  vibration_rpm: 'Вибрация \u2194 Обороты',
  audio_wheel: 'Звук \u2194 Колесо',
  turn_click: 'Стук при повороте',
  vibration_speed_peak: 'Вибрация \u2194 Скорость',
  highfreq_vibration: 'ВЧ звук \u2194 Вибрация',
}

interface CorrelationPanelProps {
  clientHash: string
}

export function CorrelationPanel({ clientHash }: CorrelationPanelProps) {
  const [results, setResults] = useState<CorrelationResult[]>([])

  const fetchCorrelations = useCallback(async () => {
    try {
      const res = await fetch(`/api/v2/correlations/?client_hash=${clientHash}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch { /* silently ignore fetch errors */ }
  }, [clientHash])

  useEffect(() => {
    fetchCorrelations()
    const timer = setInterval(fetchCorrelations, 120000)
    return () => clearInterval(timer)
  }, [fetchCorrelations])

  if (results.length === 0) return null

  return (
    <GlassPanel>
      <div className="hud-header mb-3">КОРРЕЛЯЦИИ ACCEL\u2194AUDIO</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r, i) => {
          const absR = Math.abs(r.r_value)
          const color = absR > 0.8 ? '#FF1744' : absR > 0.6 ? '#FFAB00' : theme.accent.cyan

          return (
            <div key={i} style={{
              padding: '8px 10px', borderRadius: 2,
              borderLeft: `3px solid ${color}`,
              background: `${color}06`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.text.primary }}>
                  {HINT_LABELS[r.diagnosis_hint] || r.diagnosis_hint}
                </span>
                <span style={{ fontSize: 11, fontFamily: "Consolas, monospace", fontWeight: 'bold', color }}>
                  r={r.r_value.toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif" }}>
                {TYPE_LABELS[r.correlation_type] || r.correlation_type} &middot; {r.data_points} точек &middot; {r.regime}
              </div>
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}
