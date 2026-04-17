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

interface Diagnosis {
  rule?: string
  rule_name?: string
  display?: string
  status?: string
  confidence?: number
  evidence?: string[]
  repair_roadmap?: string[]
  price_range?: string
}

interface Report {
  diagnoses?: Diagnosis[]
}

interface Props {
  report: Report | null | undefined
  onOpenRule: (ruleName: string) => void
}

export function ActiveDiagnosesFeed({ report, onOpenRule }: Props) {
  const diagnoses = report?.diagnoses ?? []

  return (
    <div
      className="lumen-diag-feed"
      style={{
        position: 'absolute',
        top: 320,
        left: 8,
        bottom: 100,
        width: 170,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
        zIndex: 15,
      }}
      data-hud-left-column
    >
      <div style={sectionHeaderWrap}>
        <span style={sectionHeaderText}>Диагнозы · {diagnoses.length}</span>
        <div style={sectionHeaderUnderline} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          minHeight: 0,
          flex: '0 1 auto',
          maxHeight: 344,
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
        {diagnoses.slice(0, 4).map((d, i) => {
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
              title={clickable ? 'Открыть детали правила' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 6,
                position: 'relative',
                padding: '10px 2px 10px 2px',
                borderBottom: '1px solid var(--c-spectral-divider)',
                cursor: clickable ? 'pointer' : 'default',
                transition: 'background 160ms var(--ease-hud)',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 8 }}>
                <DataDot severity={sev} size={6} style={{ marginTop: 4 }} />
                <div style={{ minWidth: 0 }}>
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
                  {Array.isArray(d.evidence) && d.evidence.length > 0 && (
                    <div style={{
                      marginTop: 4,
                      fontSize: 10,
                      fontFamily: 'var(--f-body)',
                      color: 'var(--c-spectral-faint)',
                      lineHeight: 1.35,
                    }}>
                      {d.evidence.slice(0, 2).map((e, k) => (
                        <div key={k} style={{ marginBottom: 1 }}>· {e}</div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(d.repair_roadmap) && d.repair_roadmap.length > 0 && (
                    <div style={{
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                      fontSize: 10,
                      fontFamily: 'var(--f-body)',
                      lineHeight: 1.3,
                    }}>
                      <span style={{
                        fontSize: 8, fontWeight: 600, color: '#E6D4A8',
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                      }}>Ремонт</span>
                      <span style={{ color: 'var(--c-spectral-muted)', flex: 1, minWidth: 0 }}>
                        {d.repair_roadmap[0]}
                      </span>
                      {d.price_range && (
                        <span style={{
                          fontFamily: 'var(--f-mono)', fontSize: 9,
                          color: 'var(--c-spectral)', whiteSpace: 'nowrap',
                        }}>{d.price_range}</span>
                      )}
                    </div>
                  )}
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
