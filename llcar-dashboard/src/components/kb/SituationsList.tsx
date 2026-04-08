import { useState, useEffect, useMemo } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface Situation {
  id: string
  title: string
  qa: string      // quick answer (truncated)
  urg: number     // urgency 1-10
  cat: string     // category
  layers: string[]
  dtc: string[]   // related DTC codes
}

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  engine: { label: 'Двигатель', icon: '\u2699', color: theme.status.warning },
  suspension: { label: 'Подвеска', icon: '\u{1F6DE}', color: theme.accent.cyan },
  electrical: { label: 'Электрика', icon: '\u26A1', color: '#FFD700' },
  body: { label: 'Кузов', icon: '\u{1F6AA}', color: theme.accent.teal },
  transmission: { label: 'Трансмиссия', icon: '\u{1F504}', color: '#FF6B35' },
  fuel: { label: 'Топливо', icon: '\u26FD', color: theme.status.warning },
  exhaust: { label: 'Выхлоп', icon: '\u{1F4A8}', color: theme.text.muted },
  brakes: { label: 'Тормоза', icon: '\u{1F6D1}', color: theme.status.critical },
  cooling: { label: 'Охлаждение', icon: '\u2744', color: '#00BCD4' },
  audio: { label: 'Шумы', icon: '\u{1F50A}', color: theme.accent.teal },
}

function urgencyColor(urg: number): string {
  if (urg >= 8) return theme.status.critical
  if (urg >= 5) return theme.status.warning
  return theme.accent.cyan
}

export function SituationsList({ brandId }: { brandId?: string | null }) {
  const [situations, setSituations] = useState<Situation[]>([])
  const [loading, setLoading] = useState(true)
  const [brandSituations, setBrandSituations] = useState<Situation[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showBrandOnly, setShowBrandOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/situations-universal.json`)
      .then(r => r.json())
      .then((data: Situation[]) => { setSituations(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Load brand-specific situations
  useEffect(() => {
    if (!brandId) return
    fetch(`${import.meta.env.BASE_URL}data/situations/brands/${brandId}.json`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Situation[]) => setBrandSituations(data))
      .catch(() => setBrandSituations([]))
  }, [brandId])

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set(situations.map(s => s.cat).filter(Boolean))
    return Array.from(cats).sort()
  }, [situations])

  // Filter
  const filtered = useMemo(() => {
    const source = showBrandOnly && brandSituations.length > 0 ? brandSituations : [...brandSituations, ...situations]
    const q = search.toLowerCase().trim()
    return source
      .filter(s => {
        if (catFilter && s.cat !== catFilter) return false
        if (q && !s.title.toLowerCase().includes(q) && !s.qa.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => b.urg - a.urg)
      .slice(0, 50)
  }, [situations, brandSituations, showBrandOnly, search, catFilter])

  return (
    <GlassPanel>
      <div className="hud-header mb-3">
        Ситуации
        {!loading && (
          <span style={{ fontSize: 10, color: theme.text.muted, marginLeft: 8, fontWeight: 400 }}>
            {situations.length} универсальных{brandSituations.length > 0 && ` + ${brandSituations.length} для марки`}
          </span>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Поиск по ситуациям..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 200px',
            padding: '10px 14px',
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.15)',
            borderRadius: 4,
            outline: 'none',
          }}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.15)',
            borderRadius: 4,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Все системы</option>
          {categories.map(cat => {
            const info = CATEGORY_MAP[cat]
            return <option key={cat} value={cat}>{info ? `${info.icon} ${info.label}` : cat}</option>
          })}
        </select>
        {brandSituations.length > 0 && (
          <button
            onClick={() => setShowBrandOnly(!showBrandOnly)}
            style={{
              padding: '10px 14px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: showBrandOnly ? '#0C1220' : '#FF8C00',
              background: showBrandOnly ? '#FF8C00' : 'rgba(255,140,0,0.06)',
              border: `1px solid ${showBrandOnly ? 'transparent' : 'rgba(255,140,0,0.2)'}`,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            Для марки ({brandSituations.length})
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 24, fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: theme.accent.cyan, letterSpacing: '0.15em' }}>
          LOADING...
        </div>
      )}

      {/* Situations list */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '65vh', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: theme.text.muted }}>
              Ничего не найдено
            </div>
          )}

          {filtered.map(s => {
            const catInfo = CATEGORY_MAP[s.cat]
            const isExpanded = expandedId === s.id
            return (
              <div
                key={s.id}
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 4,
                  background: isExpanded ? 'rgba(0,229,255,0.05)' : 'rgba(0,229,255,0.02)',
                  border: `1px solid ${isExpanded ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.06)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Urgency indicator */}
                  <div style={{
                    width: 4,
                    height: 32,
                    borderRadius: 2,
                    background: urgencyColor(s.urg),
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${urgencyColor(s.urg)}40`,
                  }} />

                  {/* Category badge */}
                  {catInfo && (
                    <span style={{
                      fontSize: 16,
                      flexShrink: 0,
                      opacity: 0.7,
                    }}>
                      {catInfo.icon}
                    </span>
                  )}

                  {/* Title */}
                  <div style={{
                    flex: 1,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.text.secondary,
                    lineHeight: 1.3,
                  }}>
                    {s.title}
                  </div>

                  {/* Urgency number */}
                  <span style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    color: urgencyColor(s.urg),
                    minWidth: 20,
                    textAlign: 'center',
                  }}>
                    {s.urg}
                  </span>
                </div>

                {/* Expanded: quick answer + DTCs */}
                {isExpanded && (
                  <div style={{ marginTop: 10, paddingLeft: 14 }}>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 12,
                      color: theme.text.muted,
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}>
                      {s.qa}
                    </div>

                    {s.dtc.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.dtc.map(code => (
                          <span key={code} style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: 9,
                            fontWeight: 700,
                            color: theme.accent.cyan,
                            padding: '2px 6px',
                            borderRadius: 2,
                            background: `${theme.accent.cyan}10`,
                            border: `1px solid ${theme.accent.cyan}20`,
                            letterSpacing: '0.08em',
                          }}>
                            {code}
                          </span>
                        ))}
                      </div>
                    )}

                    {s.layers.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                        {s.layers.map(l => (
                          <span key={l} style={{
                            fontSize: 9,
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 600,
                            color: theme.text.muted,
                            padding: '1px 5px',
                            borderRadius: 2,
                            background: 'rgba(0,229,255,0.04)',
                            letterSpacing: '0.03em',
                          }}>
                            {CATEGORY_MAP[l]?.label || l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </GlassPanel>
  )
}
