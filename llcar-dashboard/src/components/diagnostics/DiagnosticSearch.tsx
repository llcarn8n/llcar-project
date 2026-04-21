import { useState, useMemo, useRef, useCallback } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'
import { cachedFetch } from '../../utils/fetchCache'

interface SearchResult {
  type: 'dtc' | 'situation' | 'rule' | 'article'
  id: string
  title: string
  preview: string
  severity?: string
}

type DtcEntry = { c: string; t: string }
type SituationEntry = { id: string; title: string; qa: string }
type RulesBundle = { articles: Array<{ id: string; title: string; qa: string }>; rules: Array<{ id: string; title: string }> }

// Lightweight search across all data sources.
// Heavy JSON bundles (~1.5 MB total) are fetched ONLY on first user interaction
// (focus or typing), not on mount — prevents blocking the Diagnostics initial render on mobile.
export function DiagnosticSearch() {
  const [query, setQuery] = useState('')
  const [dtcData, setDtcData] = useState<DtcEntry[]>([])
  const [situations, setSituations] = useState<SituationEntry[]>([])
  const [rules, setRules] = useState<RulesBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  const ensureLoaded = useCallback(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    const base = import.meta.env.BASE_URL
    Promise.allSettled([
      cachedFetch<DtcEntry[]>(`${base}data/dtc-search.json`).then(setDtcData),
      cachedFetch<SituationEntry[]>(`${base}data/situations-universal.json`).then(setSituations),
      cachedFetch<RulesBundle>(`${base}data/diagnostic-rules.json`).then(setRules),
    ]).finally(() => setLoading(false))
  }, [])

  const results = useMemo<SearchResult[]>(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    const res: SearchResult[] = []

    dtcData.filter(d => d.c.toLowerCase().includes(q) || d.t.toLowerCase().includes(q))
      .slice(0, 10)
      .forEach(d => res.push({ type: 'dtc', id: d.c, title: d.c, preview: d.t }))

    situations.filter(s => s.title.toLowerCase().includes(q) || s.qa.toLowerCase().includes(q))
      .slice(0, 10)
      .forEach(s => res.push({ type: 'situation', id: s.id, title: s.title, preview: s.qa.slice(0, 150) }))

    if (rules) {
      rules.articles.filter(a => a.title.toLowerCase().includes(q) || a.qa.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(a => res.push({ type: 'article', id: a.id, title: a.title, preview: a.qa.slice(0, 150) }))
      rules.rules.filter(r => r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(r => res.push({ type: 'rule', id: r.id, title: r.title, preview: '' }))
    }

    return res.slice(0, 25)
  }, [query, dtcData, situations, rules])

  const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    dtc: { label: 'DTC', color: theme.status.warning },
    situation: { label: 'Ситуация', color: theme.accent.cyan },
    article: { label: 'Статья', color: theme.status.ok },
    rule: { label: 'Правило', color: '#FF8C00' },
  }

  return (
    <GlassPanel>
      <div className="hud-header mb-3">Поиск по диагностике</div>
      <input
        type="text"
        placeholder="Катализатор, P0420, подвеска, масло..."
        value={query}
        onChange={e => { ensureLoaded(); setQuery(e.target.value) }}
        onFocus={e => {
          ensureLoaded()
          e.target.style.borderColor = 'var(--c-amber)'
          e.target.style.boxShadow = '0 0 0 3px rgba(255,159,28,0.15)'
        }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-frost)'; e.target.style.boxShadow = 'none' }}
        style={{
          width: '100%', padding: '12px 16px', marginBottom: 10,
          fontFamily: 'var(--f-body)', fontSize: 15, fontWeight: 500,
          color: 'var(--c-text)', background: 'rgba(5,7,13,0.65)',
          border: '1px solid var(--border-frost)', borderRadius: 'var(--r-card)', outline: 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      />

      {loading && query.length >= 2 && (
        <div style={{ padding: 12, textAlign: 'center', fontFamily: 'var(--f-body)', fontSize: 11, color: theme.text.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Загрузка базы…
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: 'var(--f-body)', marginBottom: 4 }}>
            {results.length} результатов
          </div>
          {results.map((r, i) => {
            const typeInfo = TYPE_LABELS[r.type]
            return (
              <div key={`${r.type}-${r.id}-${i}`} style={{
                padding: '8px 12px', borderRadius: 4,
                background: 'rgba(240,240,250,0.02)', border: '1px solid var(--border-frost)',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{
                  fontSize: 9, fontFamily: 'var(--f-section)', fontWeight: 700,
                  color: typeInfo.color, padding: '2px 6px', borderRadius: 2,
                  background: `${typeInfo.color}10`, border: `1px solid ${typeInfo.color}20`,
                  flexShrink: 0, marginTop: 2,
                }}>{typeInfo.label}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--f-body)', fontSize: 13, fontWeight: 700, color: theme.text.secondary }}>
                    {r.title}
                  </div>
                  {r.preview && (
                    <div style={{ fontFamily: 'var(--f-body)', fontSize: 11, color: theme.text.muted, lineHeight: 1.3, marginTop: 2 }}>
                      {r.preview}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div style={{ padding: 16, textAlign: 'center', fontFamily: 'var(--f-body)', fontSize: 13, color: theme.text.muted }}>
          Ничего не найдено по запросу "{query}"
        </div>
      )}
    </GlassPanel>
  )
}
