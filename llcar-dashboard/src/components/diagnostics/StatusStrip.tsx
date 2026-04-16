import { theme } from '../../theme'
import type { DiagnosticReport } from '../../hooks/useDiagnosticV2'
import { ShareButton } from '../shared/ShareButton'
import { exportReport } from '../../utils/exportReport'
import { OBDSetup } from './OBDSetup'

interface StatusStripProps {
  report: DiagnosticReport | null
  hasData: boolean
  loading: boolean
  clientHash: string
  onRunDiagnostic: () => void
}

const CAN_DRIVE = {
  safe: { label: 'БЕЗОПАСНО', color: theme.status.ok, icon: '✓' },
  caution: { label: 'ОСТОРОЖНО', color: theme.status.warning, icon: '⚠' },
  stop: { label: 'НЕ ЕХАТЬ', color: theme.status.critical, icon: '✗' },
}

export function StatusStrip({ report, hasData, loading, clientHash, onRunDiagnostic }: StatusStripProps) {
  if (!report && !hasData) {
    return (
      <div className="glass-panel" style={{ padding: '10px 16px' }}>
        <OBDSetup />
      </div>
    )
  }

  const drive = report ? CAN_DRIVE[report.can_drive] : null

  return (
    <div className="glass-panel" style={{ padding: '10px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {/* Can Drive */}
        {drive && (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 3,
            color: drive.color, background: `${drive.color}12`, border: `1px solid ${drive.color}`,
            fontFamily: 'var(--f-section)', letterSpacing: '0.1em',
            animation: report?.can_drive === 'stop' ? 'pulse-critical 2s ease-in-out infinite' : 'none',
          }}>
            {drive.icon} {drive.label}
          </span>
        )}

        {/* Fuel Loss */}
        {report?.fuel_loss && (
          <span
            title="Из-за неисправностей двигатель расходует больше топлива. Устранение проблем сэкономит эту сумму."
            style={{
              color: theme.status.warning, fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 12,
              border: `1px solid ${theme.status.warning}40`, background: `${theme.status.warning}08`,
              fontFamily: 'var(--f-body)', cursor: 'help',
            }}
          >
            🔥 Лишний расход: {report.fuel_loss.monthly_rub.toLocaleString('ru-RU')} руб/мес
          </span>
        )}

        {/* Data Source dots */}
        {report?.data_source && (
          <div style={{ display: 'flex', gap: 8, fontSize: 9, color: theme.text.muted }}>
            {(['OBD', 'ACCEL', 'AUDIO'] as const).map(src => {
              const key = `has_${src.toLowerCase()}` as 'has_obd' | 'has_accel' | 'has_audio'
              const ok = report.data_source?.[key]
              return (
                <span key={src} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: ok ? theme.status.ok : 'rgba(255,255,255,0.15)',
                    boxShadow: ok ? `0 0 5px ${theme.status.ok}` : 'none',
                    display: 'inline-block',
                  }} />
                  <span style={{
                    fontFamily: 'var(--f-section)', letterSpacing: '0.08em',
                    color: ok ? theme.text.secondary : 'rgba(255,255,255,0.2)',
                  }}>{src}</span>
                </span>
              )
            })}
          </div>
        )}

        {/* Baseline */}
        {report?.baseline_status && (
          <span style={{
            fontSize: 9, fontFamily: 'var(--f-section)', letterSpacing: '0.1em',
            color: report.baseline_status.ready ? theme.status.ok : theme.status.warning,
            padding: '2px 6px', borderRadius: 2,
            border: `1px solid ${report.baseline_status.ready ? theme.status.ok : theme.status.warning}30`,
          }}>
            {report.baseline_status.ready ? 'BASELINE READY' : `CALIBRATING ${report.baseline_status.total_samples}/${report.baseline_status.samples_needed}`}
          </span>
        )}

        {/* Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {report && <ShareButton report={report} clientHash={clientHash} />}
          {report && (
            <button
              onClick={(e) => { e.stopPropagation(); exportReport(report, clientHash) }}
              style={{
                padding: '3px 8px', fontSize: 9, fontFamily: 'var(--f-section)',
                color: theme.text.muted, background: 'transparent',
                border: `1px solid ${theme.text.muted}30`, borderRadius: 2,
                cursor: 'pointer', letterSpacing: '0.1em',
              }}
            >PDF</button>
          )}
          <button
            onClick={onRunDiagnostic}
            disabled={loading}
            style={{
              padding: '5px 14px', fontSize: 10, fontFamily: 'var(--f-section)', fontWeight: 600,
              color: loading ? 'var(--c-text-muted)' : 'var(--c-amber)', letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              background: loading ? 'rgba(240,240,250,0.03)' : 'rgba(255,159,28,0.08)',
              border: `1px solid ${loading ? 'var(--border-frost)' : 'rgba(255,159,28,0.35)'}`,
              borderRadius: 'var(--r-pill)', cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.25s ease',
            }}
          >
            {loading ? '⏳ Анализ...' : '🔄 ОБНОВИТЬ'}
          </button>
        </div>
      </div>
    </div>
  )
}
