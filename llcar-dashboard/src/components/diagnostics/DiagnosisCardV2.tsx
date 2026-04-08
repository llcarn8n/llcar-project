import { useState } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { FeedbackButtons } from '../panels/FeedbackButtons'
import { RobotTooltip } from '../shared/RobotTooltip'
import { ShareButton } from '../shared/ShareButton'
import { theme } from '../../theme'
import type { DiagnosticReport, Diagnosis, FreezeFrame } from '../../hooks/useDiagnosticV2'
import { exportReport } from '../../utils/exportReport'
import carHeartbeat from '../../assets/car-heartbeat.jpg'

/* ── Parameter labels & norms for evidence scales ── */

const PARAM_LABELS: Record<string, string> = {
  'az_std': 'Вибрация (верт.)',
  'total_vibration': 'Общая вибрация',
  'coolant_temp': 'Температура ОЖ',
  'voltage': 'Напряжение',
  'ltft': 'Долгоср. коррекция',
  'stft': 'Краткоср. коррекция',
  'rpm': 'Обороты',
  'speed': 'Скорость',
  'dominant_freq': 'Частота шума',
  'dominant_amp': 'Амплитуда шума',
  'engine_load': 'Нагрузка двигателя',
  'throttle': 'Дроссель',
}

const PARAM_NORMS: Record<string, { min: number; max: number; unit: string }> = {
  'az_std': { min: 0, max: 5, unit: 'м/с²' },
  'total_vibration': { min: 0, max: 10, unit: 'м/с²' },
  'coolant_temp': { min: 80, max: 105, unit: '°C' },
  'voltage': { min: 13.2, max: 14.8, unit: 'В' },
  'ltft': { min: -10, max: 10, unit: '%' },
  'stft': { min: -10, max: 10, unit: '%' },
  'rpm': { min: 600, max: 6500, unit: 'об/мин' },
  'speed': { min: 0, max: 180, unit: 'км/ч' },
  'dominant_freq': { min: 0, max: 5000, unit: 'Гц' },
  'dominant_amp': { min: 0, max: 20000, unit: '' },
  'engine_load': { min: 0, max: 100, unit: '%' },
  'throttle': { min: 0, max: 100, unit: '%' },
}

/** Parse evidence strings like "az_std > 2.5" or "coolant_temp = 98.3" */
function parseEvidence(ev: string): { param: string; value: number } | null {
  const m = ev.match(/^(\w+)\s*[><=!]+\s*([\d.]+)/)
  if (!m) return null
  return { param: m[1], value: parseFloat(m[2]) }
}

/** Determine zone color: green (normal), yellow (warning <=20% outside), red (critical) */
function zoneColor(value: number, norm: { min: number; max: number }): string {
  const range = norm.max - norm.min
  const margin = range * 0.2
  if (value >= norm.min && value <= norm.max) return theme.status.ok
  if (value >= norm.min - margin && value <= norm.max + margin) return theme.status.warning
  return theme.status.critical
}

/* ── EvidenceScales sub-component ── */

function EvidenceScales({ diag }: { diag: Diagnosis }) {
  const [expanded, setExpanded] = useState(false)

  const parsed = diag.evidence
    .map(parseEvidence)
    .filter((p): p is { param: string; value: number } => p !== null && p.param in PARAM_NORMS)

  if (parsed.length === 0) return null

  return (
    <div style={{ marginTop: 4, marginBottom: 4 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0',
          color: theme.text.muted, fontSize: 9, fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.08em',
        }}
      >
        <span style={{
          display: 'inline-block', transition: 'transform 0.2s',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          fontSize: 8,
        }}>
          ▶
        </span>
        ПАРАМЕТРЫ ({parsed.length})
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {parsed.map(({ param, value }) => {
            const norm = PARAM_NORMS[param]
            const label = PARAM_LABELS[param] || param
            const color = zoneColor(value, norm)

            // Scale extends 30% beyond norm range on each side for visual context
            const range = norm.max - norm.min
            const scaleMin = norm.min - range * 0.3
            const scaleMax = norm.max + range * 0.3
            const scaleRange = scaleMax - scaleMin

            // Positions as percentages
            const normStartPct = ((norm.min - scaleMin) / scaleRange) * 100
            const normWidthPct = (range / scaleRange) * 100
            const valuePct = Math.max(0, Math.min(100, ((value - scaleMin) / scaleRange) * 100))

            return (
              <div key={param} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Parameter label */}
                <div style={{
                  width: 100, minWidth: 100, fontSize: 10, fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600, color: theme.text.secondary, textAlign: 'right',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {label}
                </div>

                {/* Scale bar */}
                <div style={{ flex: 1, position: 'relative', height: 14 }}>
                  {/* Background track */}
                  <div style={{
                    position: 'absolute', top: 5, left: 0, right: 0, height: 3,
                    borderRadius: 1.5, background: 'rgba(255,255,255,0.06)',
                  }} />

                  {/* Red zone left (below norm) */}
                  {normStartPct > 0 && (
                    <>
                      <div style={{
                        position: 'absolute', top: 5, left: 0, height: 3,
                        width: `${Math.max(0, normStartPct - normWidthPct * 0.15)}%`,
                        borderRadius: '1.5px 0 0 1.5px',
                        background: `${theme.status.critical}50`,
                      }} />
                      {/* Warning zone left */}
                      <div style={{
                        position: 'absolute', top: 5,
                        left: `${Math.max(0, normStartPct - normWidthPct * 0.15)}%`,
                        height: 3,
                        width: `${Math.min(normWidthPct * 0.15, normStartPct)}%`,
                        background: `${theme.status.warning}50`,
                      }} />
                    </>
                  )}

                  {/* Green zone (normal range) */}
                  <div style={{
                    position: 'absolute', top: 5,
                    left: `${normStartPct}%`, width: `${normWidthPct}%`,
                    height: 3, background: `${theme.status.ok}50`,
                  }} />

                  {/* Warning zone right */}
                  {(normStartPct + normWidthPct) < 100 && (
                    <>
                      <div style={{
                        position: 'absolute', top: 5,
                        left: `${normStartPct + normWidthPct}%`,
                        height: 3,
                        width: `${Math.min(normWidthPct * 0.15, 100 - normStartPct - normWidthPct)}%`,
                        background: `${theme.status.warning}50`,
                      }} />
                      {/* Red zone right */}
                      <div style={{
                        position: 'absolute', top: 5,
                        left: `${normStartPct + normWidthPct + Math.min(normWidthPct * 0.15, 100 - normStartPct - normWidthPct)}%`,
                        height: 3,
                        right: 0,
                        borderRadius: '0 1.5px 1.5px 0',
                        background: `${theme.status.critical}50`,
                      }} />
                    </>
                  )}

                  {/* Triangle marker */}
                  <div style={{
                    position: 'absolute',
                    left: `${valuePct}%`,
                    top: 0,
                    transform: 'translateX(-4px)',
                    width: 0, height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: `5px solid ${color}`,
                    filter: `drop-shadow(0 0 3px ${color})`,
                  }} />
                </div>

                {/* Value text */}
                <div style={{
                  minWidth: 60, textAlign: 'right', fontSize: 10,
                  fontFamily: "Consolas, monospace", fontWeight: 'bold',
                  color,
                }}>
                  {value}{norm.unit ? ` ${norm.unit}` : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Freeze Frame labels & config ── */

const FREEZE_PARAMS: { key: keyof FreezeFrame; label: string; unit: string }[] = [
  { key: 'rpm', label: 'Обороты', unit: 'об/мин' },
  { key: 'speed', label: 'Скорость', unit: 'км/ч' },
  { key: 'coolant_temp', label: 'Температура ОЖ', unit: '°C' },
  { key: 'engine_load', label: 'Нагрузка', unit: '%' },
  { key: 'throttle', label: 'Дроссель', unit: '%' },
  { key: 'voltage', label: 'Напряжение', unit: 'В' },
  { key: 'ltft', label: 'LTFT', unit: '%' },
  { key: 'stft', label: 'STFT', unit: '%' },
  { key: 'outdoor_temp', label: 'Температура воздуха', unit: '°C' },
]

const WEATHER_ICONS: Record<string, string> = {
  clear: '\u2600',
  cloudy: '\u2601',
  rain: '\uD83C\uDF27',
  snow: '\uD83C\uDF28',
  fog: '\uD83C\uDF2B',
}

function formatFreezeTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ts
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ]
    const day = d.getDate()
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${year}, ${hh}:${mm}`
  } catch {
    return ts
  }
}

/* ── FreezeFramePanel sub-component ── */

function FreezeFramePanel({ frame }: { frame: FreezeFrame }) {
  const [expanded, setExpanded] = useState(false)

  // Check if there's any data to show
  const hasData = FREEZE_PARAMS.some(p => frame[p.key] != null) || frame.weather

  if (!hasData) return null

  return (
    <div style={{ marginTop: 6, marginBottom: 4 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0',
          color: theme.accent.teal, fontSize: 9, fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.08em',
        }}
      >
        <span style={{
          display: 'inline-block', transition: 'transform 0.2s',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          fontSize: 8,
        }}>
          \u25B6
        </span>
        FREEZE FRAME
      </button>

      {expanded && (
        <div style={{
          marginTop: 6, padding: '8px 10px', borderRadius: 3,
          background: 'rgba(0, 229, 255, 0.04)',
          border: '1px solid rgba(0, 229, 255, 0.12)',
          backdropFilter: 'blur(6px)',
        }}>
          {/* Timestamp */}
          {frame.timestamp && (
            <div style={{
              fontSize: 9, fontFamily: "'Rajdhani', sans-serif",
              color: theme.text.muted, marginBottom: 6,
              letterSpacing: '0.02em',
            }}>
              {'\u23F1'} {formatFreezeTimestamp(frame.timestamp)}
            </div>
          )}

          {/* 2-column grid of parameters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3px 12px',
          }}>
            {FREEZE_PARAMS.map(({ key, label, unit }) => {
              const val = frame[key]
              if (val == null) return null
              return (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', padding: '1px 0',
                }}>
                  <span style={{
                    fontSize: 10, fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600, color: theme.text.muted,
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: 10, fontFamily: 'Consolas, monospace',
                    fontWeight: 'bold', color: theme.text.secondary,
                    marginLeft: 6,
                  }}>
                    {typeof val === 'number' ? val : String(val)}{unit ? ` ${unit}` : ''}
                  </span>
                </div>
              )
            })}

            {/* Weather row — spans full width if present */}
            {frame.weather && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', padding: '1px 0',
              }}>
                <span style={{
                  fontSize: 10, fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600, color: theme.text.muted,
                }}>
                  Погода
                </span>
                <span style={{
                  fontSize: 10, fontFamily: 'Consolas, monospace',
                  fontWeight: 'bold', color: theme.text.secondary,
                  marginLeft: 6,
                }}>
                  {WEATHER_ICONS[frame.weather] || ''} {frame.weather}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main component ── */

interface DiagnosisCardV2Props {
  report: DiagnosticReport | null
  loading?: boolean
  onFeedback: (ruleName: string, action: 'confirmed' | 'dismissed') => Promise<boolean>
  clientHash?: string
}

const CAN_DRIVE_CONFIG = {
  safe: { label: 'БЕЗОПАСНО', color: theme.status.ok, icon: '\u2713' },
  caution: { label: 'ОСТОРОЖНО', color: theme.status.warning, icon: '\u26A0' },
  stop: { label: 'НЕ ЕХАТЬ', color: theme.status.critical, icon: '\u2715' },
}

const STATUS_COLORS: Record<string, string> = {
  likely: '#FF1744',
  possible: '#FFAB00',
  unlikely: 'rgba(255,255,255,0.3)',
  clear: '#00E676',
}

const STATUS_LABELS: Record<string, string> = {
  likely: 'ВЕРОЯТНО',
  possible: 'ВОЗМОЖНО',
  unlikely: 'МАЛОВЕРОЯТНО',
  clear: 'НОРМА',
}

export function DiagnosisCardV2({ report, loading, onFeedback, clientHash }: DiagnosisCardV2Props) {
  if (!report) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">ДИАГНОСТИКА V2</div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '24px 16px', gap: 12,
        }}>
          {/* Car heartbeat illustration */}
          <img
            src={carHeartbeat}
            alt="Car diagnostic"
            style={{
              width: '100%', maxWidth: 200, height: 'auto',
              borderRadius: 8, marginBottom: 12,
              opacity: 0.7,
              filter: 'saturate(1.2)',
            }}
          />

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 13, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              color: theme.text.secondary, letterSpacing: '0.03em', marginBottom: 4,
            }}>
              Ожидание данных
            </div>
            <div style={{
              fontSize: 10, fontFamily: "'Rajdhani', sans-serif",
              color: theme.text.muted, lineHeight: 1.4,
            }}>
              Данные появятся после начала движения.
              <br />
              62 правила диагностики готовы к анализу.
            </div>
          </div>

          {/* Status indicators */}
          <div style={{
            display: 'flex', gap: 12, marginTop: 4,
          }}>
            {[
              { label: 'Движок', ok: true },
              { label: 'Правила', ok: true },
              { label: 'Baseline', ok: false },
            ].map(({ label, ok }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: ok ? theme.status.ok : theme.status.warning,
                  boxShadow: `0 0 4px ${ok ? theme.status.ok : theme.status.warning}`,
                }} />
                <span style={{
                  fontSize: 9, fontFamily: "'Orbitron', sans-serif",
                  color: theme.text.muted, letterSpacing: '0.05em',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    )
  }

  const driveConfig = CAN_DRIVE_CONFIG[report.can_drive]
  const activeDiagnoses = report.diagnoses.filter(d => d.status === 'likely' || d.status === 'possible')

  return (
    <GlassPanel>
      {/* Header + Can Drive status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="hud-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          ДИАГНОСТИКА V2
          {loading && (
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              border: `1.5px solid ${theme.accent.cyan}30`,
              borderTopColor: theme.accent.cyan,
              animation: 'spin 1s linear infinite',
            }} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShareButton report={report} clientHash={clientHash || ''} />
          <button
            onClick={(e) => { e.stopPropagation(); exportReport(report, clientHash || ''); }}
            style={{
              padding: '3px 8px', fontSize: 9, fontFamily: "'Orbitron', sans-serif",
              color: theme.text.muted, background: 'transparent',
              border: `1px solid ${theme.text.muted}30`, borderRadius: 2,
              cursor: 'pointer', letterSpacing: '0.1em',
            }}
            title="Скачать PDF отчёт"
          >
            PDF
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 2,
            color: driveConfig.color,
            background: `${driveConfig.color}12`,
            border: `1px solid ${driveConfig.color}40`,
            fontSize: 11, fontFamily: "'Orbitron', sans-serif", fontWeight: 600, letterSpacing: '0.1em',
            boxShadow: `0 0 8px ${driveConfig.color}30`,
            animation: report.can_drive === 'stop' ? 'pulse-critical 2s ease-in-out infinite' : 'none',
          }}>
            <span>{driveConfig.icon}</span>
            <span>{driveConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Fuel loss alert */}
      {report.fuel_loss && (
        <div style={{
          marginBottom: 12, padding: '8px 12px', borderRadius: 2,
          background: `${theme.status.warning}08`, border: `1px solid ${theme.status.warning}20`,
        }}>
          <div style={{ fontSize: 10, color: theme.status.warning, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em', marginBottom: 4 }}>
            ПОТЕРИ ТОПЛИВА
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontFamily: "'Rajdhani', sans-serif", color: theme.text.secondary }}>
              {report.fuel_loss.monthly_rub.toLocaleString('ru-RU')} \u20BD/мес
            </span>
            <span style={{ fontSize: 13, fontFamily: "'Rajdhani', sans-serif", color: theme.text.muted }}>
              {report.fuel_loss.yearly_rub.toLocaleString('ru-RU')} \u20BD/год
            </span>
          </div>
        </div>
      )}

      {/* Diagnoses list */}
      {activeDiagnoses.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeDiagnoses.map(diag => {
            const color = STATUS_COLORS[diag.status] ?? theme.text.muted
            return (
              <div key={diag.rule_name} style={{
                padding: '10px 12px', borderRadius: 2,
                background: `linear-gradient(135deg, ${color}06 0%, transparent 60%)`,
                borderLeft: `3px solid ${color}`,
              }}>
                {/* Name + status + confidence */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <RobotTooltip text={diag.explanation || 'Робот анализирует...'}>
                    <span style={{ fontSize: 14, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.text.primary }}>
                      {diag.display}
                    </span>
                  </RobotTooltip>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 9, fontFamily: "'Orbitron', sans-serif", fontWeight: 600,
                      color, padding: '2px 6px', border: `1px solid ${color}40`, borderRadius: 2,
                      background: `${color}10`, letterSpacing: '0.1em',
                    }}>
                      {STATUS_LABELS[diag.status] ?? diag.status}
                    </span>
                    <span style={{ fontSize: 13, fontFamily: "Consolas, monospace", fontWeight: 'bold', color }}>
                      {diag.confidence}%
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                {diag.explanation && (
                  <div style={{ fontSize: 11, color: theme.text.secondary, fontFamily: "'Rajdhani', sans-serif", marginBottom: 6, lineHeight: 1.4 }}>
                    {diag.explanation}
                  </div>
                )}

                {/* Evidence parameter scales */}
                <EvidenceScales diag={diag} />

                {/* Freeze frame snapshot */}
                {diag.freeze_frame && <FreezeFramePanel frame={diag.freeze_frame} />}

                {/* Repair roadmap */}
                {diag.repair_roadmap && diag.repair_roadmap.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, color: theme.text.muted, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em', marginBottom: 4 }}>
                      МАРШРУТ РЕМОНТА
                    </div>
                    {diag.repair_roadmap.map((step, i) => (
                      <div key={i} style={{ fontSize: 10, color: theme.text.secondary, fontFamily: "'Rajdhani', sans-serif", paddingLeft: 8, marginBottom: 2 }}>
                        {i + 1}. {step}
                      </div>
                    ))}
                  </div>
                )}

                {/* Price range */}
                {diag.price_range && (
                  <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", marginBottom: 6 }}>
                    Ориентировочно: {diag.price_range}
                  </div>
                )}

                {/* Feedback buttons */}
                <FeedbackButtons
                  ruleName={diag.rule_name}
                  onFeedback={(action) => onFeedback(diag.rule_name, action)}
                />
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 0', color: theme.status.ok, fontSize: 13, fontFamily: "'Rajdhani', sans-serif" }}>
          {'\u2713'} Проблем не обнаружено
        </div>
      )}

      {/* Baseline status */}
      <div style={{
        marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(0,229,255,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 9, fontFamily: "'Orbitron', sans-serif", color: theme.text.muted, letterSpacing: '0.1em' }}>
          {report.baseline_status.ready ? 'BASELINE READY' : `CALIBRATING ${report.baseline_status.total_samples}/${report.baseline_status.samples_needed}`}
        </span>
        <span style={{ fontSize: 9, fontFamily: "'Orbitron', sans-serif", color: theme.text.muted, letterSpacing: '0.1em' }}>
          {report.rule_version.toUpperCase()}
        </span>
      </div>

      {/* Data source indicator */}
      {report.data_source && (
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6,
        }}>
          {[
            { label: 'OBD', ok: report.data_source.has_obd },
            { label: 'ACCEL', ok: report.data_source.has_accel },
            { label: 'AUDIO', ok: report.data_source.has_audio },
          ].map(({ label, ok }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                backgroundColor: ok ? theme.status.ok : 'rgba(255,255,255,0.15)',
                boxShadow: ok ? `0 0 4px ${theme.status.ok}` : 'none',
              }} />
              <span style={{
                fontSize: 8, fontFamily: "'Orbitron', sans-serif",
                color: ok ? theme.text.muted : 'rgba(255,255,255,0.15)',
                letterSpacing: '0.08em',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}
