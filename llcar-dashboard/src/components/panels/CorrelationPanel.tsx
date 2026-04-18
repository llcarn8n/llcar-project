import { useState, useEffect, useMemo, useCallback } from 'react'
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

// ---------- Русские расшифровки ----------

const TYPE_LABELS: Record<string, string> = {
  vibration_rpm: 'Вибрация ↔ обороты двигателя',
  audio_wheel: 'Шум ↔ вращение колёс',
  turn_click: 'Щелчки при повороте руля',
  vibration_speed_peak: 'Вибрация ↔ скорость',
  highfreq_vibration: 'Высокочастотный шум ↔ вибрация',
  audio_accel_source: 'Связь шума кузова и ускорения',
  road_roughness_psd: 'Качество дорожного покрытия',
}

const HINT_LABELS: Record<string, string> = {
  engine_mount: 'Опоры двигателя',
  wheel_bearing: 'Ступичный подшипник',
  cv_joint: 'ШРУС (привод колеса)',
  wheel_balance: 'Дисбаланс колёс',
  accessory_bearing: 'Подшипник генератора / компрессора',
  suspension_audio_source: 'Источник шума в подвеске',
  road_class_A: 'A — отличное (ровное шоссе)',
  road_class_B: 'B — хорошее',
  road_class_C: 'C — удовлетворительное',
  road_class_D: 'D — плохое, разбитый асфальт',
}

const REGIME_LABELS: Record<string, string> = {
  all: 'все режимы',
  idle: 'холостой ход',
  highway: 'шоссе',
  city: 'город',
}

function translateHint(hint: string): string {
  return HINT_LABELS[hint] || hint
}
function translateType(type: string): string {
  return TYPE_LABELS[type] || type
}
function translateRegime(regime: string): string {
  return REGIME_LABELS[regime] || regime
}

interface CorrelationPanelProps {
  clientHash: string
}

export function CorrelationPanel({ clientHash }: CorrelationPanelProps) {
  const [results, setResults] = useState<CorrelationResult[]>([])
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fetchCorrelations = useCallback(async () => {
    try {
      const res = await fetch(`/api/v2/correlations/?client_hash=${clientHash}`)
      if (res.ok) {
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
        setError(false)
      }
    } catch { setError(true) }
  }, [clientHash])

  useEffect(() => {
    fetchCorrelations()
    const timer = setInterval(fetchCorrelations, 120000)
    return () => clearInterval(timer)
  }, [fetchCorrelations])

  // Группируем: road_roughness_psd — отдельная сводка, остальное — по diagnosis_hint (самая сильная связь)
  const { diagnoses, roadSummary, roadRecent } = useMemo(() => {
    const road: CorrelationResult[] = []
    const byHint = new Map<string, CorrelationResult>()
    for (const r of results) {
      if (r.correlation_type === 'road_roughness_psd') {
        road.push(r)
        continue
      }
      const existing = byHint.get(r.diagnosis_hint)
      if (!existing || Math.abs(r.r_value) > Math.abs(existing.r_value)) {
        byHint.set(r.diagnosis_hint, r)
      }
    }
    // Сортируем диагностические по |r| убывание
    const diagList = Array.from(byHint.values()).sort(
      (a, b) => Math.abs(b.r_value) - Math.abs(a.r_value),
    )

    // Для дороги — берём последние замеры, определяем преобладающий класс
    let summary: { label: string; count: number; color: string } | null = null
    if (road.length > 0) {
      const counts = new Map<string, number>()
      for (const r of road) {
        counts.set(r.diagnosis_hint, (counts.get(r.diagnosis_hint) || 0) + 1)
      }
      const [topHint] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
      const color = topHint === 'road_class_D'
        ? '#FF6D00'
        : topHint === 'road_class_C'
        ? '#FFAB00'
        : 'var(--c-spectral)'
      summary = { label: translateHint(topHint), count: road.length, color }
    }

    const recent = road.slice(0, 20)

    return { diagnoses: diagList, roadSummary: summary, roadRecent: recent }
  }, [results])

  const hasData = !error && (diagnoses.length > 0 || roadSummary !== null)

  return (
    <GlassPanel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="hud-header">Корреляция показателей</div>
        {hasData && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'transparent',
              border: '1px solid var(--c-spectral-divider, rgba(230,212,168,0.25))',
              color: 'var(--c-spectral)',
              fontFamily: 'var(--f-display)',
              fontSize: 9,
              letterSpacing: '0.1em',
              padding: '4px 10px',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            {expanded ? 'СВЕРНУТЬ ▲' : 'ПОДРОБНЕЕ ▼'}
          </button>
        )}
      </div>

      {/* Всегда видимое человеческое объяснение */}
      <div style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: theme.text.muted, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 600, color: theme.accent.teal, marginBottom: 4, fontSize: 11 }}>Что это такое:</div>
        <p style={{ margin: '0 0 6px' }}>
          LLCAR непрерывно ищет <strong style={{ color: theme.text.secondary }}>устойчивые связи</strong> между
          разными сигналами машины — вибрацией, звуком, оборотами, скоростью. Если две величины растут и падают
          синхронно — почти всегда виноват один конкретный узел.
        </p>

        <div style={{ fontWeight: 600, color: theme.accent.teal, marginBottom: 4, fontSize: 11 }}>Как читать:</div>
        <p style={{ margin: '0 0 6px' }}>
          Связь измеряется числом <strong style={{ color: theme.text.secondary }}>r от −1 до +1</strong>.
          Чем ближе |r| к единице — тем жёстче связаны сигналы.
          <span style={{ color: '#FF1744', fontWeight: 600 }}>&nbsp;|r| &gt; 0.8</span> почти всегда указывает на конкретную неисправность;
          <span style={{ color: '#FFAB00', fontWeight: 600 }}>&nbsp;0.6–0.8</span> — подозрение;
          ниже 0.6 — случайный шум.
        </p>

        {!hasData && (
          <p style={{ margin: '6px 0 0', padding: '6px 8px', borderRadius: 4, background: 'rgba(255,171,0,0.08)', border: '1px solid rgba(255,171,0,0.12)' }}>
            ⏳ Пока недостаточно данных. Нужно не менее <strong>30 минут</strong> реальной езды, чтобы выявить связи.
          </p>
        )}
      </div>

      {/* Раскрывающаяся секция */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(230,212,168,0.12)' }}>
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: theme.text.muted, lineHeight: 1.55, marginBottom: 14 }}>
            <div style={{ fontWeight: 600, color: theme.accent.teal, marginBottom: 4, fontSize: 11 }}>Что мы ищем:</div>
            <ul style={{ margin: '0 0 6px', paddingLeft: 18 }}>
              <li>вибрация + обороты → опоры двигателя</li>
              <li>звук + обороты колёс → ступичный подшипник</li>
              <li>щелчки при повороте → ШРУС</li>
              <li>вибрация + скорость → дисбаланс колёс</li>
              <li>ВЧ-шум + мелкая вибрация → подшипник генератора</li>
              <li>отдельно — оценка качества покрытия под колёсами</li>
            </ul>
            {roadSummary && (
              <p style={{ margin: '8px 0 0', padding: '6px 8px', borderRadius: 4, background: `${roadSummary.color}12`, border: `1px solid ${roadSummary.color}25` }}>
                🛣️ Качество дорог, по которым вы ездите: <strong style={{ color: roadSummary.color }}>{roadSummary.label}</strong>
                <span style={{ color: theme.text.muted, marginLeft: 6, fontSize: 11 }}>({roadSummary.count} замеров)</span>
              </p>
            )}
          </div>

          {diagnoses.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: 'var(--f-display)', letterSpacing: '0.1em', marginBottom: 8 }}>
                НАЙДЕННЫЕ СВЯЗИ ({diagnoses.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {diagnoses.map((r, i) => {
                  const absR = Math.abs(r.r_value)
                  const color = absR > 0.8 ? '#FF1744' : absR > 0.6 ? '#FFAB00' : 'var(--c-spectral)'
                  const severityLabel = absR > 0.8 ? 'ЖЁСТКАЯ СВЯЗЬ' : absR > 0.6 ? 'ПОДОЗРЕНИЕ' : 'СЛАБАЯ СВЯЗЬ'

                  return (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 2,
                      borderLeft: `3px solid ${color}`,
                      background: `${color}0A`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 10 }}>
                        <span style={{ fontSize: 13, fontFamily: 'var(--f-body)', fontWeight: 600, color: theme.text.primary }}>
                          {translateHint(r.diagnosis_hint)}
                        </span>
                        <span style={{
                          fontSize: 8, fontFamily: 'var(--f-display)', fontWeight: 700,
                          color, padding: '2px 6px', border: `1px solid ${color}40`,
                          borderRadius: 2, background: `${color}10`, letterSpacing: '0.1em', flexShrink: 0,
                        }}>
                          {severityLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: theme.text.muted, fontFamily: 'var(--f-body)', lineHeight: 1.4 }}>
                        Связь: <strong style={{ color: theme.text.secondary }}>{translateType(r.correlation_type)}</strong>
                        {' · '}
                        сила <span style={{ color, fontFamily: 'var(--f-mono)' }}>r = {r.r_value.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: 'var(--f-body)', marginTop: 3 }}>
                        {r.data_points} замеров · режим: {translateRegime(r.regime)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {diagnoses.length === 0 && (
            <div style={{
              padding: '10px 12px', marginBottom: 14, borderRadius: 4,
              background: 'rgba(230,212,168,0.05)',
              fontSize: 12, fontFamily: 'var(--f-body)', color: theme.text.muted, lineHeight: 1.5,
            }}>
              <strong style={{ color: theme.text.secondary }}>Диагностических связей пока не найдено</strong> —
              LLCAR не обнаружил жёстких корреляций между сигналами.
              Это значит, что на замерах не видно явной неисправности —
              но для точной оценки нужно больше поездок (от 30 минут каждая, в разных условиях).
            </div>
          )}

          {roadRecent.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: 'var(--f-display)', letterSpacing: '0.1em', marginBottom: 8 }}>
                ЗАМЕРЫ КАЧЕСТВА ДОРОГИ ({roadRecent.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {roadRecent.map((r, i) => {
                  const color = r.diagnosis_hint === 'road_class_D' ? '#FF6D00'
                    : r.diagnosis_hint === 'road_class_C' ? '#FFAB00'
                    : 'var(--c-spectral)'
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 2,
                      borderLeft: `2px solid ${color}`,
                      background: `${color}08`,
                      fontSize: 11, fontFamily: 'var(--f-body)',
                    }}>
                      <span style={{ color: theme.text.secondary, fontWeight: 600 }}>
                        {translateHint(r.diagnosis_hint)}
                      </span>
                      <span style={{ color: theme.text.muted, fontSize: 10 }}>
                        {r.data_points} замеров
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </GlassPanel>
  )
}
