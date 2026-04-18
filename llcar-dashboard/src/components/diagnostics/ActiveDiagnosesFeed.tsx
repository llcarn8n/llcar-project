import type { CSSProperties } from 'react'
import { DataDot, type DataDotSeverity } from '../ui/DataDot'

const sectionHeaderWrap: CSSProperties = {
  position: 'relative',
  paddingBottom: 6,
  display: 'block',
}
const sectionHeaderText: CSSProperties = {
  fontFamily: 'var(--f-display)',
  fontSize: 10,
  fontWeight: 700,
  color: '#F2E4C2',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  textShadow: '0 0 10px rgba(210,188,148,0.45), 0 0 2px rgba(210,188,148,0.25)',
  display: 'inline-block',
}
const sectionHeaderUnderline: CSSProperties = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: 0,
  width: '80%',
  height: 1,
  background: 'linear-gradient(90deg, transparent 0%, rgba(210,188,148,0.7) 50%, transparent 100%)',
  boxShadow: '0 0 6px rgba(210,188,148,0.5)',
}

interface EvidenceObj {
  type?: string
  severity?: string
  value?: string | number
  confidence?: number
  details?: string
}

type EvidenceItem = string | EvidenceObj

interface Diagnosis {
  rule?: string
  rule_name?: string
  display?: string
  status?: string
  confidence?: number
  evidence?: EvidenceItem[]
  repair_roadmap?: string[]
  price_range?: string
  _flickering?: boolean
  _missedSnapshots?: number
}

interface Report {
  diagnoses?: Diagnosis[]
}

interface Props {
  report: Report | null | undefined
  onOpenRule: (ruleName: string) => void
  activeCount?: number
  flickeringCount?: number
}

export function ActiveDiagnosesFeed({ report, onOpenRule, activeCount, flickeringCount }: Props) {
  const diagnoses = report?.diagnoses ?? []
  const headerCount = activeCount !== undefined && flickeringCount !== undefined
    ? (flickeringCount > 0 ? `${activeCount} активно · ${flickeringCount} мерцают` : `${activeCount} активно`)
    : `${diagnoses.length}`

  return (
    <div
      className="lumen-diag-feed"
      style={{
        position: 'absolute',
        top: 200,
        right: 8,
        bottom: 440,
        width: 340,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        textAlign: 'left',
        gap: 10,
        zIndex: 15,
        padding: '14px 12px',
        background: 'transparent',
        border: 'none',
        backdropFilter: 'none',
      }}
      data-hud-right-column
    >
      <div style={sectionHeaderWrap}>
        <span style={sectionHeaderText}>Диагнозы · {headerCount}</span>
        <div style={sectionHeaderUnderline} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          overflowY: 'auto',
          minHeight: 0,
          flex: '1 1 auto',
          paddingTop: 4,
        }}
      >
        {diagnoses.length === 0 && (
          <div
            style={{
              padding: '10px 12px',
              fontSize: 11,
              color: 'var(--c-spectral-faint)',
              fontFamily: 'var(--f-body)',
              background: 'rgba(239,242,247,0.02)',
              border: '1px dashed rgba(210,188,148,0.18)',
              borderRadius: 3,
            }}
          >
            Нет активных диагнозов.
          </div>
        )}
        {diagnoses.map((d, i) => {
          const confRaw = d.confidence ?? 0
          const confNorm = confRaw > 1 ? confRaw : confRaw * 100
          const conf = Math.max(0, Math.min(100, Math.round(confNorm)))
          const sev: DataDotSeverity = conf >= 70 ? 'crit' : conf >= 40 ? 'warn' : 'ok'
          const ruleName = d.rule ?? d.rule_name
          const clickable = !!ruleName
          return (
            <div
              key={`${ruleName ?? 'diag'}-${i}`}
              onClick={clickable ? () => onOpenRule(ruleName!) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenRule(ruleName!) } } : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                textAlign: 'left',
                gap: 3,
                position: 'relative',
                padding: '6px 4px 6px 4px',
                borderBottom: '1px solid var(--c-spectral-divider)',
                cursor: clickable ? 'pointer' : 'default',
                transition: 'background 160ms var(--ease-hud), opacity 200ms var(--ease-hud)',
                width: '100%',
                opacity: d._flickering ? 0.45 : 1,
              }}
              title={clickable ? (d._flickering ? 'Диагноз мерцает — пропущено ' + d._missedSnapshots + ' снимка(-ов). Клик — детали.' : 'Открыть детали правила') : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 8 }}>
                <DataDot severity={sev} size={6} style={{ marginTop: 4, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--f-display)',
                      color: '#B8BEC7',
                      fontWeight: 500,
                      letterSpacing: '0.04em',
                      lineHeight: 1.35,
                      marginBottom: 3,
                    }}
                  >
                    {d.display || ruleName || 'Диагноз'}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontFamily: 'var(--f-mono)',
                      color: 'var(--c-spectral-faint)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {d.status ?? ''} {d.status ? '·' : ''} {conf}%
                  </div>
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ActiveDiagnosesFeed
