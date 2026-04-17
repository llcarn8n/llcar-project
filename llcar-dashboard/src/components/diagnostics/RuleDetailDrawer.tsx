import { useCallback, useEffect, useMemo, useState } from 'react'
import rulesCatalog from '../../data/rulesCatalog.json'
import type { RuleSpec, RuleCondition } from '../../types/rules'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useLatestTelemetry } from '../../hooks/useLatestTelemetry'
import { evaluateCondition, type EvaluatedCondition } from '../../utils/conditionResolver'
import './RuleDetailDrawer.css'

type TabKey = 'overview' | 'conditions' | 'formulas' | 'example' | 'theory' | 'sources'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview',   label: 'Обзор' },
  { key: 'conditions', label: 'Условия' },
  { key: 'formulas',   label: 'Формулы' },
  { key: 'example',    label: 'Пример' },
  { key: 'theory',     label: 'Теория' },
  { key: 'sources',    label: 'Источники' },
]

const TIER_CLASS: Record<string, string> = {
  T1: 'rdd-tier-T1',
  T2: 'rdd-tier-T2',
  T3: 'rdd-tier-T3',
}

function formatValue(raw: number | string | null, precision = 2): string {
  if (raw === null || raw === undefined) return 'нет данных'
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return 'нет данных'
    if (Number.isInteger(raw)) return String(raw)
    return raw.toFixed(precision)
  }
  return String(raw)
}

function extractUnit(threshold: string): string {
  // "3.0 м/с²", "[80, 120] км/ч", "1500 об/мин", "2.0" → ""
  const m = threshold.match(/[\]\)\d.,\s-]+\s*(.+)$/)
  if (!m) return ''
  const tail = m[1].trim()
  // if tail starts with digit or punctuation — probably no unit
  if (/^[-\d.,\[\]]/.test(tail)) return ''
  return tail
}

function describeOperator(op: string): string {
  const trimmed = op.trim()
  if (trimmed.toLowerCase() === 'between') return '∈'
  if (trimmed.toLowerCase() === 'in') return '∈'
  if (trimmed === 'z>') return 'z>'
  return trimmed || '='
}

/* ──────────────────────────────────────────────
   Tab: Overview
   ────────────────────────────────────────────── */

function OverviewTab({ rule }: { rule: RuleSpec }) {
  const replacesLabel = useMemo(() => {
    if (!rule.replaces) return null
    const hit = (rulesCatalog as RuleSpec[]).find(r => r.rule_name === rule.replaces)
    if (hit?.display && hit.display !== hit.rule_name) return hit.display
    return null
  }, [rule.replaces])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className={`rdd-tier-badge ${TIER_CLASS[rule.tier] || TIER_CLASS.T3}`}>{rule.tier}</span>
        {rule.section && <span className="rdd-pill">раздел {rule.section}</span>}
        {replacesLabel && <span className="rdd-pill">замещает: {replacesLabel}</span>}
        {rule.shadow && <span className="rdd-pill">теневое</span>}
      </div>

      {rule.what && (
        <div>
          <div className="rdd-section-title">Что</div>
          <div className="rdd-prose">{rule.what}</div>
        </div>
      )}

      {rule.physics && (
        <div>
          <div className="rdd-section-title">Физика</div>
          <div className="rdd-prose-muted">{rule.physics}</div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Tab: Conditions
   ────────────────────────────────────────────── */

function ConditionsTab({ rule, evaluated }: { rule: RuleSpec; evaluated: EvaluatedCondition[] }) {
  const { totalWeight, passedWeight } = useMemo(() => {
    let tot = 0
    let pass = 0
    for (const c of evaluated) {
      tot += c.weight || 0
      if (c.passed) pass += c.weight || 0
    }
    return { totalWeight: tot, passedWeight: pass }
  }, [evaluated])

  const confidence = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0

  if (rule.conditions.length === 0) {
    return <div className="rdd-prose-muted">У этого правила нет условий.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span className="rdd-section-title" style={{ marginBottom: 0 }}>Уверенность</span>
          <span className="rdd-mono" style={{ fontSize: 14, color: '#C8B48E' }}>{confidence}%</span>
        </div>
        <div className="rdd-conf-bar-track">
          <div className="rdd-conf-bar-fill" style={{ width: `${confidence}%` }} />
        </div>
      </div>

      <table className="rdd-table">
        <thead>
          <tr>
            <th>Параметр</th>
            <th>Оператор</th>
            <th>Порог</th>
            <th style={{ textAlign: 'right' }}>Вес</th>
            <th>Значение</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {evaluated.map((c, i) => {
            const hasValue = c.value !== null && c.value !== undefined
            const unit = extractUnit(c.threshold)
            const rowClass = !hasValue ? 'rdd-row-none' : c.passed ? 'rdd-row-pass' : 'rdd-row-fail'
            const displayValue = hasValue ? `${formatValue(c.value)}${unit ? ' ' + unit : ''}` : 'нет данных'
            const statusText = !hasValue ? '—' : c.passed ? 'совпало' : 'нет'
            return (
              <tr key={`${c.param}-${i}`} className={rowClass}>
                <td className="rdd-mono">{c.param}</td>
                <td className="rdd-mono">{describeOperator(c.op)}</td>
                <td className="rdd-mono">{c.threshold}</td>
                <td className="rdd-mono" style={{ textAlign: 'right' }}>{c.weight ?? 0}</td>
                <td className="rdd-mono">{displayValue}</td>
                <td className="rdd-mono">{statusText}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {rule.conditions.some((c: RuleCondition) => c.rationale) && (
        <div>
          <div className="rdd-section-title">Обоснования</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rule.conditions.map((c, i) => (
              c.rationale
                ? <li key={i} className="rdd-prose-muted" style={{ fontSize: 12 }}><span className="rdd-mono" style={{ color: 'var(--c-spectral-muted)' }}>{c.param}</span>: {c.rationale}</li>
                : null
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Tab: Formulas
   ────────────────────────────────────────────── */

function FormulasTab({ rule }: { rule: RuleSpec }) {
  if (!rule.formulas || rule.formulas.length === 0) {
    return <div className="rdd-prose-muted">Формулы не указаны.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rule.formulas.map((f, i) => (
        <CopyableCode key={i} text={f.code} />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Tab: Example
   ────────────────────────────────────────────── */

function ExampleTab({ rule }: { rule: RuleSpec }) {
  if (!rule.example) {
    return <div className="rdd-prose-muted">Пример отсутствует.</div>
  }
  return (
    <pre
      className="rdd-mono"
      style={{
        margin: 0,
        padding: '12px 14px',
        background: 'rgba(10,11,22,0.55)',
        border: '1px solid var(--c-spectral-divider)',
        borderRadius: 4,
        color: 'var(--c-spectral)',
        fontSize: 12,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {rule.example}
    </pre>
  )
}

/* ──────────────────────────────────────────────
   Tab: Theory
   ────────────────────────────────────────────── */

function TheoryTab({ rule }: { rule: RuleSpec }) {
  const hasTheory = !!rule.theory
  const apps = rule.appendices_used || []
  if (!hasTheory && apps.length === 0) {
    return <div className="rdd-prose-muted">Теоретическое пояснение не указано.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {hasTheory && <div className="rdd-prose">{rule.theory}</div>}
      {apps.length > 0 && (
        <div style={{ paddingTop: 10, borderTop: '1px solid var(--c-spectral-divider)' }}>
          <div className="rdd-section-title">Использованные приложения</div>
          <div>
            {apps.map((a) => (
              <span key={a} className="rdd-appendix-badge">{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Tab: Sources
   ────────────────────────────────────────────── */

function SourcesTab({ rule }: { rule: RuleSpec }) {
  const sources = rule.sources || []
  const codePointers = rule.code_pointers || []

  if (sources.length === 0 && codePointers.length === 0) {
    return <div className="rdd-prose-muted">Источники не указаны.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sources.length > 0 && (
        <div>
          <div className="rdd-section-title">Литература</div>
          {sources.map((s, i) => (
            <div key={i} className="rdd-source-item">
              <div className="rdd-source-citation">{s.citation}</div>
              <div>
                {s.doi && (
                  <a
                    className="rdd-source-link"
                    href={`https://doi.org/${s.doi}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    DOI: {s.doi}
                  </a>
                )}
                {s.url && (
                  <a
                    className="rdd-source-link"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    URL
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {codePointers.length > 0 && (
        <div>
          <div className="rdd-section-title">Код</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {codePointers.map((cp, i) => (
              <CopyableCode key={i} text={`${cp.file}:${cp.line}`} small />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────
   CopyableCode
   ────────────────────────────────────────────── */

function CopyableCode({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)
  const onCopy = useCallback(() => {
    try {
      if (navigator.clipboard) {
        void navigator.clipboard.writeText(text)
        setCopied(true)
        const t = window.setTimeout(() => setCopied(false), 1200)
        return () => window.clearTimeout(t)
      }
    } catch {
      /* ignore */
    }
  }, [text])

  return (
    <div>
      <pre
        className={`rdd-code-block ${copied ? 'copied' : ''}`}
        onClick={onCopy}
        title="Скопировать"
        style={small ? { fontSize: 11, padding: '8px 10px' } : undefined}
      >{text}</pre>
      <div className="rdd-code-copy-hint">
        {copied ? 'Скопировано' : 'Кликните чтобы скопировать'}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Main drawer
   ────────────────────────────────────────────── */

type FeedbackState = 'idle' | 'sending' | 'thanks' | 'error'

export default function RuleDetailDrawer() {
  const activeRuleDrawer = useDashboardStore((s) => s.activeRuleDrawer)
  const closeRuleDrawer = useDashboardStore((s) => s.closeRuleDrawer)
  const clientHash = useDashboardStore((s) => s.clientHash)

  const ruleName = activeRuleDrawer?.ruleName ?? null

  const rule = useMemo<RuleSpec | null>(() => {
    if (!ruleName) return null
    const catalog = rulesCatalog as unknown as RuleSpec[]
    return catalog.find((r) => r.rule_name === ruleName) ?? null
  }, [ruleName])

  const telemetry = useLatestTelemetry()
  const [tab, setTab] = useState<TabKey>('overview')
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  // Reset local state whenever rule changes
  useEffect(() => {
    if (ruleName) {
      setTab('overview')
      setFeedback('idle')
      setFeedbackError(null)
    }
  }, [ruleName])

  // Escape key handler
  useEffect(() => {
    if (!ruleName) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRuleDrawer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ruleName, closeRuleDrawer])

  const evaluated = useMemo<EvaluatedCondition[]>(() => {
    if (!rule) return []
    return rule.conditions.map((c) => evaluateCondition(c, telemetry))
  }, [rule, telemetry])

  const sendFeedback = useCallback(async (vote: 'confirm' | 'reject' | 'unsure') => {
    if (!rule) return
    setFeedback('sending')
    setFeedbackError(null)
    try {
      const res = await fetch('/api/v2/feedback/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_name: rule.rule_name,
          client_hash: clientHash,
          vote,
          ts: Date.now(),
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      setFeedback('thanks')
      window.setTimeout(() => {
        setFeedback((prev) => (prev === 'thanks' ? 'idle' : prev))
      }, 2000)
    } catch (e) {
      setFeedback('error')
      setFeedbackError(e instanceof Error ? e.message : 'Ошибка')
    }
  }, [rule, clientHash])

  if (!ruleName) return null

  if (!rule) {
    return (
      <>
        <div className="rdd-overlay" onClick={closeRuleDrawer} />
        <div className="rdd-sheet" role="dialog" aria-modal="true">
          <div className="rdd-header">
            <div>
              <div className="rdd-title">Правило не найдено</div>
              <div className="rdd-subtitle">{ruleName}</div>
            </div>
            <button className="rdd-close" onClick={closeRuleDrawer} aria-label="Закрыть">×</button>
          </div>
          <div className="rdd-body">
            <div className="rdd-prose-muted">
              Правило с именем <span className="rdd-mono">{ruleName}</span> отсутствует в каталоге.
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="rdd-overlay" onClick={closeRuleDrawer} />
      <div className="rdd-sheet" role="dialog" aria-modal="true" aria-label={rule.display || rule.rule_name}>
        <div className="rdd-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="rdd-title">{rule.display || rule.rule_name}</div>
          </div>
          <button className="rdd-close" onClick={closeRuleDrawer} aria-label="Закрыть">×</button>
        </div>

        <div className="rdd-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`rdd-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rdd-body">
          {tab === 'overview'   && <OverviewTab   rule={rule} />}
          {tab === 'conditions' && <ConditionsTab rule={rule} evaluated={evaluated} />}
          {tab === 'formulas'   && <FormulasTab   rule={rule} />}
          {tab === 'example'    && <ExampleTab    rule={rule} />}
          {tab === 'theory'     && <TheoryTab     rule={rule} />}
          {tab === 'sources'    && <SourcesTab    rule={rule} />}
        </div>

        <div className="rdd-footer">
          {feedback === 'thanks' ? (
            <span className="rdd-feedback-status rdd-feedback-ok">
              <span aria-hidden="true">✓</span> Спасибо за обратную связь
            </span>
          ) : feedback === 'error' ? (
            <>
              <span className="rdd-feedback-status rdd-feedback-err">
                Не удалось отправить{feedbackError ? ` (${feedbackError})` : ''}.
              </span>
              <button
                className="rdd-btn rdd-btn--outline"
                onClick={() => { setFeedback('idle'); setFeedbackError(null) }}
              >
                Повторить
              </button>
            </>
          ) : (
            <>
              <button
                className="rdd-btn rdd-btn--ghost"
                disabled={feedback === 'sending'}
                onClick={() => sendFeedback('unsure')}
              >
                Не уверен
              </button>
              <button
                className="rdd-btn rdd-btn--outline"
                disabled={feedback === 'sending'}
                onClick={() => sendFeedback('reject')}
              >
                Нет, неточно
              </button>
              <button
                className="rdd-btn rdd-btn--primary"
                disabled={feedback === 'sending'}
                onClick={() => sendFeedback('confirm')}
              >
                Подтверждаю
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
