import { useMemo, useState, type CSSProperties } from 'react'
import { DataDot, type DataDotSeverity } from '../ui/DataDot'
import type { RuleSpec } from '../../types/rules'

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

interface Props {
  mode: 'diagnoses' | 'rules'
  diagnoses: Diagnosis[]
  rules: RuleSpec[]
  onOpenRule: (ruleName: string) => void
  onClose: () => void
}

const sheetWrap: CSSProperties = {
  position: 'absolute',
  top: 128,
  right: 18,
  width: 640,
  maxHeight: 480,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 25,
  background: 'linear-gradient(180deg, rgba(24,18,22,0.96) 0%, rgba(14,10,14,0.97) 100%)',
  border: '1px solid rgba(210,188,148,0.38)',
  borderTop: '2px solid #E6D4A8',
  boxShadow: '0 18px 42px rgba(0,0,0,0.55), 0 0 120px rgba(210,188,148,0.07) inset',
  padding: '16px 18px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

const headerText: CSSProperties = {
  fontFamily: 'var(--f-display)',
  fontSize: 10,
  fontWeight: 700,
  color: '#F2E4C2',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  textShadow: '0 0 10px rgba(210,188,148,0.45)',
}

const closeBtn: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--c-spectral-muted)',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  padding: 0,
}

const hairlineInput: CSSProperties = {
  width: '100%',
  padding: '6px 2px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(210,188,148,0.22)',
  color: 'var(--c-spectral)',
  fontFamily: 'var(--f-body)',
  fontSize: 12,
  letterSpacing: '0.04em',
  outline: 'none',
  boxSizing: 'border-box',
}

export function InfoSheetDropdown({ mode, diagnoses, rules, onOpenRule, onClose }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rules
    return rules.filter(
      r =>
        r.rule_name.toLowerCase().includes(q) ||
        (r.display ?? '').toLowerCase().includes(q) ||
        (r.section ?? '').toLowerCase().includes(q),
    )
  }, [rules, query])

  return (
    <div style={sheetWrap}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 10,
        borderBottom: '1px solid var(--c-spectral-divider)',
        marginBottom: 10,
      }}>
        <span style={headerText}>
          {mode === 'diagnoses' ? `Активные диагнозы · ${diagnoses.length}` : `Справочник правил · ${filtered.length}`}
        </span>
        <button onClick={onClose} style={closeBtn} title="Закрыть">{'\u2715'}</button>
      </div>

      {mode === 'diagnoses' && (
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
          {diagnoses.length === 0 ? (
            <div style={{
              padding: '16px 12px',
              fontSize: 12,
              color: 'var(--c-spectral-faint)',
              fontFamily: 'var(--f-body)',
              textAlign: 'center',
              border: '1px dashed rgba(210,188,148,0.18)',
              borderRadius: 3,
            }}>
              Нет активных диагнозов.
            </div>
          ) : diagnoses.map((d, i) => {
            const confRaw = d.confidence ?? 0
            const confNorm = confRaw > 1 ? confRaw : confRaw * 100
            const conf = Math.max(0, Math.min(100, Math.round(confNorm)))
            const sev: DataDotSeverity = conf >= 70 ? 'crit' : conf >= 40 ? 'warn' : 'ok'
            const sevAccent = sev === 'crit' ? '#D4A54A' : sev === 'warn' ? 'rgba(210,188,148,0.55)' : 'rgba(210,188,148,0.28)'
            const ruleName = d.rule ?? d.rule_name
            const clickable = !!ruleName
            return (
              <div
                key={`${ruleName ?? 'diag'}-${i}`}
                onClick={clickable ? () => onOpenRule(ruleName!) : undefined}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                title={clickable ? 'Открыть детали правила' : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '12px 10px 12px 14px',
                  borderLeft: `2px solid ${sevAccent}`,
                  borderBottom: '1px solid var(--c-spectral-divider)',
                  cursor: clickable ? 'pointer' : 'default',
                  transition: 'background 160ms var(--ease-hud)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(210,188,148,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <DataDot severity={sev} size={7} style={{ marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontFamily: 'var(--f-body)',
                      color: 'var(--c-spectral)', fontWeight: 500, lineHeight: 1.3,
                    }}>
                      {d.display || ruleName || 'Диагноз'}
                    </div>
                    <div style={{
                      marginTop: 3, fontSize: 10, fontFamily: 'var(--f-mono)',
                      color: 'var(--c-spectral-faint)', letterSpacing: '0.06em',
                    }}>
                      {d.status ?? ''} {d.status ? '·' : ''} {conf}%
                    </div>
                    {Array.isArray(d.evidence) && d.evidence.length > 0 && (
                      <div style={{
                        marginTop: 6, fontSize: 11, fontFamily: 'var(--f-body)',
                        color: 'var(--c-spectral-faint)', lineHeight: 1.4,
                      }}>
                        {d.evidence.slice(0, 3).map((e, k) => (
                          <div key={k} style={{ marginBottom: 2 }}>· {e}</div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(d.repair_roadmap) && d.repair_roadmap.length > 0 && (
                      <div style={{
                        marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8,
                        fontSize: 11, fontFamily: 'var(--f-body)', lineHeight: 1.3,
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 600, color: '#E6D4A8',
                          letterSpacing: '0.18em', textTransform: 'uppercase',
                        }}>Ремонт</span>
                        <span style={{ color: 'var(--c-spectral-muted)', flex: 1 }}>
                          {d.repair_roadmap[0]}
                        </span>
                        {d.price_range && (
                          <span style={{
                            fontFamily: 'var(--f-mono)', fontSize: 10,
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
      )}

      {mode === 'rules' && (
        <>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="поиск правила…"
            style={{ ...hairlineInput, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: '16px 12px', fontSize: 12, color: 'var(--c-spectral-faint)',
                textAlign: 'center', fontFamily: 'var(--f-body)',
              }}>Ничего не найдено.</div>
            ) : filtered.slice(0, 100).map(r => {
              const hasRu = r.display && r.display !== r.rule_name
              const label = hasRu ? r.display : r.rule_name
              return (
                <button
                  key={r.rule_name}
                  onClick={() => onOpenRule(r.rule_name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--c-spectral-divider)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'background 160ms var(--ease-hud)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(210,188,148,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    fontFamily: 'var(--f-mono)', fontSize: 10, color: '#D4A54A',
                    letterSpacing: '0.08em', minWidth: 36,
                  }}>[{r.section ?? '?'}]</span>
                  <span style={{
                    fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--c-spectral-muted)',
                    letterSpacing: '0.08em', minWidth: 28,
                  }}>{r.tier ?? '—'}</span>
                  <span style={{
                    flex: 1, fontFamily: 'var(--f-body)', fontSize: 12,
                    color: 'var(--c-spectral)', lineHeight: 1.3,
                  }}>{label}</span>
                </button>
              )
            })}
            {filtered.length > 100 && (
              <div style={{
                padding: '8px 10px', fontSize: 10, color: 'var(--c-spectral-faint)',
                fontFamily: 'var(--f-mono)', textAlign: 'center',
              }}>
                …ещё {filtered.length - 100}. Уточни поиск.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default InfoSheetDropdown
