import { GlassPanel } from '../shared/GlassPanel'
import { FeedbackButtons } from '../panels/FeedbackButtons'
import { RobotTooltip } from '../shared/RobotTooltip'
import { theme } from '../../theme'
import type { DiagnosticReport } from '../../hooks/useDiagnosticV2'
import carHeartbeat from '../../assets/car-heartbeat.jpg'

interface DiagnosisCardV2Props {
  report: DiagnosticReport | null
  loading?: boolean
  onFeedback: (ruleName: string, action: 'confirmed' | 'dismissed') => Promise<boolean>
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

export function DiagnosisCardV2({ report, loading, onFeedback }: DiagnosisCardV2Props) {
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
