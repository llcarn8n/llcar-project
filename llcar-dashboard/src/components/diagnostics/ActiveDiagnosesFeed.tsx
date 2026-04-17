import { useMemo, useState, type CSSProperties } from 'react'
import { DataDot, type DataDotSeverity } from '../ui/DataDot'
import { GhostButton } from '../ui/GhostButton'
import rulesCatalog from '../../data/rulesCatalog.json'
import type { RuleSpec } from '../../types/rules'

const microLabel: CSSProperties = {
  fontFamily: 'var(--f-body)',
  fontSize: 9,
  fontWeight: 600,
  color: '#E6D4A8',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  textShadow: '0 0 10px rgba(200,180,142,0.35), 0 0 2px rgba(200,180,142,0.25)',
}

const hairlineInput: CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--c-spectral-divider)',
  color: 'var(--c-spectral)',
  fontFamily: 'var(--f-body)',
  fontSize: 11,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 160ms var(--ease-hud)',
}

const hairlineSelect: CSSProperties = {
  ...hairlineInput,
  fontFamily: 'var(--f-mono)',
  cursor: 'pointer',
  appearance: 'auto',
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
  const rules = rulesCatalog as RuleSpec[]

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string>(rules[0]?.rule_name ?? 'shock_absorber_worn')
  const [inputFocus, setInputFocus] = useState<'q' | 's' | null>(null)

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

  const selectedRule = useMemo(() => rules.find(r => r.rule_name === selected), [rules, selected])
  const selectedLabel =
    selectedRule?.display && selectedRule.display !== selectedRule.rule_name
      ? selectedRule.display
      : selected

  const focusBorderColor = (isFocused: boolean): CSSProperties =>
    isFocused ? { borderBottomColor: 'var(--c-indigo)' } : {}

  return (
    <div
      className="lumen-diag-feed"
      style={{
        position: 'absolute',
        top: 56,
        right: 18,
        bottom: 100,
        width: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 15,
      }}
      data-hud-right-column
    >
      <span style={microLabel}>ДИАГНОЗЫ · {diagnoses.length}</span>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          minHeight: 0,
          flex: '0 1 auto',
          maxHeight: 344,
          borderTop: '1px solid var(--c-spectral-divider)',
        }}
      >
        {diagnoses.length === 0 && (
          <div
            style={{
              padding: '8px 2px',
              fontSize: 11,
              color: 'var(--c-spectral-faint)',
              fontFamily: 'var(--f-body)',
              borderBottom: '1px solid var(--c-spectral-divider)',
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
                gap: 6,
                position: 'relative',
                padding: '8px 2px',
                borderBottom: '1px solid var(--c-spectral-divider)',
                cursor: clickable ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <DataDot severity={sev} size={6} style={{ marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--f-body)',
                      color: 'var(--c-spectral)',
                      fontWeight: 500,
                      lineHeight: 1.3,
                      marginBottom: 2,
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

      <span style={microLabel}>ПРАВИЛА ДИАГНОСТИКИ · {filtered.length}</span>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingTop: 6,
          borderTop: '1px solid var(--c-spectral-divider)',
        }}
        data-hud-rule-picker
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setInputFocus('q')}
          onBlur={() => setInputFocus(null)}
          placeholder="поиск…"
          style={{ ...hairlineInput, ...focusBorderColor(inputFocus === 'q') }}
        />
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          onFocus={() => setInputFocus('s')}
          onBlur={() => setInputFocus(null)}
          style={{ ...hairlineSelect, ...focusBorderColor(inputFocus === 's') }}
        >
          {filtered.map(r => {
            const hasRu = r.display && r.display !== r.rule_name
            const label = hasRu ? r.display : r.rule_name
            return (
              <option key={r.rule_name} value={r.rule_name}>
                [{r.section ?? '?'}] {r.tier ?? '—'} · {label}
              </option>
            )
          })}
        </select>
        <GhostButton
          variant="rect"
          size="sm"
          onClick={() => onOpenRule(selected)}
          title={selectedLabel}
          data-dev-open-rule
          style={{ width: '100%', padding: '6px 12px' }}
        >
          Открыть
        </GhostButton>
      </div>
    </div>
  )
}

export default ActiveDiagnosesFeed
