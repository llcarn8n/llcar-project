import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import rulesCatalog from '../../data/rulesCatalog.json'
import type { RuleSpec, RuleCondition } from '../../types/rules'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useLatestTelemetry } from '../../hooks/useLatestTelemetry'
import { useIsMobile } from '../../hooks/useIsMobile'
import { evaluateCondition, type EvaluatedCondition } from '../../utils/conditionResolver'
import './RuleDetailDrawer.css'

type TabKey = 'overview' | 'comparison' | 'conditions' | 'formulas' | 'example' | 'theory' | 'sources'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview',   label: 'Обзор' },
  { key: 'comparison', label: 'Сравнение' },
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
   Tab: Comparison — сравнение с базой (пороги vs твоё значение)
   ────────────────────────────────────────────── */

function parseRangeFromThreshold(op: string, threshold: string): { lo: number; hi: number } | null {
  const nums = threshold.match(/-?\d+(?:[.,]\d+)?/g)
  if (!nums || nums.length === 0) return null
  const parsed = nums.map((s) => Number(s.replace(',', '.')))
  const o = (op || '').toLowerCase()
  if (o === 'between') {
    if (parsed.length < 2) return null
    return { lo: parsed[0], hi: parsed[1] }
  }
  // Single-value op: показываем ±50% коридор вокруг порога как визуальная шкала.
  const v = parsed[0]
  const delta = Math.max(Math.abs(v) * 0.5, 1)
  return { lo: v - delta, hi: v + delta }
}

function ComparisonTab({ evaluated }: { evaluated: EvaluatedCondition[] }) {
  if (evaluated.length === 0) {
    return (
      <div className="rdd-prose-muted">
        Условия для сравнения отсутствуют в этом правиле.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="rdd-prose-muted" style={{ fontSize: 12 }}>
        На каждой шкале: <b>зелёный</b> — норма, <b>бежевый</b> — внимание, <b>красный</b> — критика.
        Маркер показывает, где находится твой текущий замер относительно порогов правила.
      </div>
      {evaluated.map((c, i) => {
        const range = parseRangeFromThreshold(c.op, c.threshold)
        const numericValue = typeof c.value === 'number' && Number.isFinite(c.value) ? c.value : null
        let markerPct: number | null = null
        if (range && numericValue !== null) {
          const width = range.hi - range.lo
          if (width > 0) {
            const pct = ((numericValue - range.lo) / width) * 100
            markerPct = Math.max(0, Math.min(100, pct))
          }
        }
        const unit = extractUnit(c.threshold)
        const valueLabel = numericValue !== null
          ? `${formatValue(numericValue)}${unit ? ' ' + unit : ''}`
          : (c.value === null || c.value === undefined ? 'нет данных' : String(c.value))

        return (
          <div key={`${c.param}-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 12, fontWeight: 600, color: '#E6D4A8' }}>
                {c.param}
              </div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: c.passed ? '#FF4A4A' : '#6BE08F' }}>
                {c.passed ? 'сработало' : 'норма'}
              </div>
            </div>

            {/* Gradient bar: green → champagne → red, с маркером текущего значения */}
            <div style={{
              position: 'relative',
              height: 10,
              borderRadius: 3,
              background: 'linear-gradient(90deg, rgba(107,224,143,0.55) 0%, rgba(230,212,168,0.55) 55%, rgba(255,74,74,0.75) 100%)',
              border: '1px solid rgba(230,212,168,0.2)',
              overflow: 'hidden',
            }}>
              {markerPct !== null && (
                <div style={{
                  position: 'absolute',
                  top: -3,
                  bottom: -3,
                  left: `calc(${markerPct}% - 2px)`,
                  width: 4,
                  background: '#EFF2F7',
                  borderRadius: 2,
                  boxShadow: '0 0 6px rgba(239,242,247,0.9), 0 0 2px rgba(255,255,255,0.9)',
                }} aria-label={`Текущее значение ${valueLabel}`} />
              )}
            </div>

            {/* Numbers row: lo / value / hi */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-mono)', fontSize: 10, color: 'rgba(184,190,199,0.7)' }}>
              <span>{range ? `${formatValue(range.lo)}${unit ? ' ' + unit : ''}` : ''}</span>
              <span style={{ color: '#EFF2F7', fontWeight: 600 }}>твоё: {valueLabel}</span>
              <span>{range ? `${formatValue(range.hi)}${unit ? ' ' + unit : ''}` : ''}</span>
            </div>

            {c.rationale && (
              <div style={{ fontSize: 11, color: 'rgba(184,190,199,0.7)', fontFamily: 'var(--f-body)', lineHeight: 1.45 }}>
                {c.rationale}
              </div>
            )}
          </div>
        )
      })}
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
  const isMobile = useIsMobile()

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

  // Portal на мобиле: drawer должен рендериться вне NebulaPanel (у которого
  // overflow: hidden + backdropFilter → становится containing-block для
  // position: fixed и обрезает bottom-sheet по границам 460px канваса).
  // На десктопе drawer анкерится в панель (inline render) — как и раньше.
  const wrap = (node: React.ReactNode): React.ReactNode =>
    isMobile && typeof document !== 'undefined' ? createPortal(node, document.body) : node

  if (!rule) {
    return wrap(
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

  return wrap(
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
          {tab === 'comparison' && <ComparisonTab evaluated={evaluated} />}
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

