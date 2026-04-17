import { useMemo, useState, type CSSProperties } from 'react'
import rulesCatalog from '../../data/rulesCatalog.json'
import type { RuleSpec } from '../../types/rules'

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
  left: 0,
  right: 0,
  bottom: 0,
  height: 1,
  background: 'linear-gradient(90deg, rgba(210,188,148,0.55) 0%, rgba(210,188,148,0.18) 60%, transparent 100%)',
  boxShadow: '0 0 4px rgba(210,188,148,0.35)',
}

const hairlineInput: CSSProperties = {
  width: '100%',
  padding: '6px 2px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(210,188,148,0.22)',
  borderRadius: 0,
  color: 'var(--c-spectral)',
  fontFamily: 'var(--f-body)',
  fontSize: 11,
  letterSpacing: '0.04em',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 160ms var(--ease-hud)',
}

const hairlineSelect: CSSProperties = {
  ...hairlineInput,
  fontFamily: 'var(--f-mono)',
  cursor: 'pointer',
  appearance: 'auto',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  paddingRight: 18,
}

interface Props {
  onOpenRule: (ruleName: string) => void
}

export function RulesPicker({ onOpenRule }: Props) {
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
    isFocused
      ? { borderBottomColor: 'rgba(210,188,148,0.65)', boxShadow: '0 1px 0 rgba(210,188,148,0.35)' }
      : {}

  return (
    <div
      className="lumen-rules-picker"
      style={{
        position: 'absolute',
        right: 18,
        bottom: 180,
        width: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 15,
      }}
      data-hud-rules-picker
    >
      <div style={sectionHeaderWrap}>
        <span style={sectionHeaderText}>Правила диагностики · {filtered.length}</span>
        <div style={sectionHeaderUnderline} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingTop: 6,
          borderTop: '1px solid var(--c-spectral-divider)',
        }}
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
          title={selectedLabel}
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
        <button
          type="button"
          onClick={() => onOpenRule(selected)}
          title={selectedLabel}
          data-dev-open-rule
          style={{
            width: '100%',
            padding: '8px 0 6px',
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid rgba(210,188,148,0.22)',
            color: '#F2E4C2',
            fontFamily: 'var(--f-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(210,188,148,0.28)',
            cursor: 'pointer',
            transition: 'color 160ms var(--ease-hud), text-shadow 160ms var(--ease-hud)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#FFF4D8'
            e.currentTarget.style.textShadow = '0 0 14px rgba(210,188,148,0.55)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#F2E4C2'
            e.currentTarget.style.textShadow = '0 0 8px rgba(210,188,148,0.28)'
          }}
        >
          Открыть
        </button>
      </div>
    </div>
  )
}

export default RulesPicker
