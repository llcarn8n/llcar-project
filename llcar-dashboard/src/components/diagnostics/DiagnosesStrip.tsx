import type { CSSProperties } from 'react'
import { useRef, useState, useEffect } from 'react'
import { DataDot, type DataDotSeverity } from '../ui/DataDot'

type EvidenceItem = string | { type?: string; value?: string | number; details?: string }

function renderEvidence(e: unknown): string {
  if (e == null) return ''
  if (typeof e === 'string') return e
  if (typeof e === 'number' || typeof e === 'boolean') return String(e)
  if (typeof e === 'object') {
    const obj = e as { type?: string; value?: unknown; details?: string }
    if (typeof obj.details === 'string') return obj.details
    if (obj.value !== undefined && typeof obj.value !== 'object') {
      return obj.type ? `${obj.type}: ${obj.value}` : String(obj.value)
    }
    if (typeof obj.type === 'string') return obj.type
    try {
      return JSON.stringify(e).slice(0, 120)
    } catch {
      return ''
    }
  }
  return String(e)
}

interface Diagnosis {
  rule?: string
  rule_name?: string
  display?: string
  status?: string
  confidence?: number
  evidence?: EvidenceItem[]
}

interface Report {
  diagnoses?: Diagnosis[]
}

interface Props {
  report: Report | null | undefined
  onOpenRule: (ruleName: string) => void
}

const sectionHeaderText: CSSProperties = {
  fontFamily: 'var(--f-display)',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--c-champagne-hi)',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  textShadow: '0 0 10px rgba(210,188,148,0.45), 0 0 2px rgba(210,188,148,0.25)',
}

export function DiagnosesStrip({ report, onOpenRule }: Props) {
  const diagnoses = report?.diagnoses ?? []
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolled, setScrolled] = useState<{ left: boolean; right: boolean }>({ left: false, right: true })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const left = el.scrollLeft > 8
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 8
      setScrolled({ left, right })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [diagnoses.length])

  return (
    <div
      className="diagnoses-strip"
      style={{
        position: 'relative',
        width: '100%',
        padding: '10px 16px 16px',
        borderTop: '1px solid var(--c-spectral-divider)',
        background: 'linear-gradient(180deg, rgba(10,11,22,0.0) 0%, rgba(10,11,22,0.35) 100%)',
      }}
      data-hud-diagnoses-strip
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={sectionHeaderText}>Диагнозы · {diagnoses.length}</span>
        <span style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 9,
          color: 'var(--c-spectral-faint)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          активно
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        {/* left fade */}
        {scrolled.left && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, zIndex: 2,
            pointerEvents: 'none',
            background: 'linear-gradient(90deg, var(--c-void) 0%, rgba(10,11,22,0) 100%)',
          }} />
        )}
        {/* right fade */}
        {scrolled.right && diagnoses.length > 0 && (
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 28, zIndex: 2,
            pointerEvents: 'none',
            background: 'linear-gradient(270deg, var(--c-void) 0%, rgba(10,11,22,0) 100%)',
          }} />
        )}

        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin',
            paddingBottom: 4,
            // height фиксированный чтобы scrollbar не дёргал layout
            minHeight: 116,
          }}
        >
          {diagnoses.length === 0 && (
            <div style={{
              minWidth: 240,
              padding: '20px 18px',
              fontSize: 11,
              color: 'var(--c-spectral-faint)',
              fontFamily: 'var(--f-body)',
              background: 'rgba(239,242,247,0.02)',
              border: '1px dashed var(--c-spectral-divider)',
              borderRadius: 4,
              scrollSnapAlign: 'start',
              textAlign: 'center',
            }}>
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
            const firstEvidence = Array.isArray(d.evidence) && d.evidence.length > 0 ? renderEvidence(d.evidence[0]) : null

            return (
              <div
                key={`${ruleName ?? 'diag'}-${i}`}
                className="diagnosis-card"
                onClick={clickable ? () => onOpenRule(ruleName!) : undefined}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenRule(ruleName!) } } : undefined}
                title={clickable ? 'Открыть детали правила' : undefined}
                style={{
                  flex: '0 0 auto',
                  width: 240,
                  minHeight: 104,
                  padding: '12px 14px',
                  background: 'rgba(239,242,247,0.02)',
                  border: '1px solid var(--c-spectral-divider)',
                  borderRadius: 6,
                  cursor: clickable ? 'pointer' : 'default',
                  scrollSnapAlign: 'start',
                  transition: 'border-color 160ms var(--ease-hud), background 160ms var(--ease-hud)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  if (!clickable) return
                  e.currentTarget.style.borderColor = 'var(--c-champagne-border)'
                  e.currentTarget.style.background = 'rgba(230,212,168,0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--c-spectral-divider)'
                  e.currentTarget.style.background = 'rgba(239,242,247,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DataDot severity={sev} size={8} />
                  <div style={{
                    fontSize: 10,
                    fontFamily: 'var(--f-mono)',
                    color: 'var(--c-spectral-faint)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    flex: 1,
                  }}>
                    {d.status ?? sev} · {conf}%
                  </div>
                  {clickable && (
                    <span style={{
                      fontSize: 11,
                      fontFamily: 'var(--f-mono)',
                      color: 'var(--c-spectral-muted)',
                      padding: '1px 6px',
                      border: '1px solid var(--c-spectral-divider)',
                      borderRadius: 3,
                      lineHeight: 1.2,
                    }}>?</span>
                  )}
                </div>

                <div style={{
                  fontSize: 13,
                  fontFamily: 'var(--f-display)',
                  color: 'var(--c-graphite)',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  lineHeight: 1.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {d.display || ruleName || 'Диагноз'}
                </div>

                {firstEvidence && (
                  <div style={{
                    fontSize: 11,
                    fontFamily: 'var(--f-body)',
                    color: 'var(--c-spectral-faint)',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    · {firstEvidence}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DiagnosesStrip
