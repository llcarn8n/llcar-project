import { useState, useEffect, useMemo } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface Situation {
  id: string
  title: string
  qa: string              // quick answer (truncated) — universal/brand format
  urg: number             // urgency 1-10
  cat: string             // category
  layers: string[]
  dtc: string[]           // related DTC codes — universal/brand format
  // Generation KB extended fields (optional)
  quickAnswer?: string    // generation-level quick answer
  level1_ru?: string      // detailed explanation
  facts_ru?: string[]     // cost/maintenance facts
  dtc_codes?: string[]    // generation-level DTC codes
  urgency?: number        // generation-level urgency field
  category?: string       // generation-level category field
  severity?: string       // generation-level severity
  priceData?: { items?: { name: string; min: number; max: number }[]; disclaimer?: string }
  season?: string
}

/** Extended situation with source level for display badges */
interface SituationWithLevel extends Situation {
  _level: 'generation' | 'brand' | 'universal'
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
  chassis: { label: 'Шасси', icon: '\u{1F6E0}', color: '#FF6B35' },
  drivetrain: { label: 'Привод', icon: '\u{1F504}', color: '#FF6B35' },
  hvac: { label: 'Климат', icon: '\u2744', color: '#00BCD4' },
  infotainment: { label: 'Мультимедиа', icon: '\u{1F4F1}', color: theme.accent.teal },
  lighting: { label: 'Освещение', icon: '\u{1F4A1}', color: '#FFD700' },
  safety: { label: 'Безопасность', icon: '\u{1F6E1}', color: theme.status.critical },
  tires: { label: 'Шины', icon: '\u{1F6DE}', color: theme.text.muted },
  general: { label: 'Общее', icon: '\u{1F4CB}', color: theme.text.secondary },
}

function urgencyColor(urg: number): string {
  if (urg >= 8) return theme.status.critical
  if (urg >= 5) return theme.status.warning
  return theme.accent.cyan
}

interface SituationsListProps {
  brandId?: string | null
  /** KB generation path like "kia/k5/k5_i_2020" for loading generation-level situations */
  kbGenPath?: string | null
}

export function SituationsList({ brandId, kbGenPath }: SituationsListProps) {
  const [situations, setSituations] = useState<Situation[]>([])
  const [loading, setLoading] = useState(true)
  const [brandSituations, setBrandSituations] = useState<Situation[]>([])
  const [genSituations, setGenSituations] = useState<Situation[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showBrandOnly, setShowBrandOnly] = useState(false)
  const [showGenOnly, setShowGenOnly] = useState(false)
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

  // Load generation-specific KB situations (highest priority)
  useEffect(() => {
    if (!kbGenPath) { setGenSituations([]); return }
    fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/situations.json`)
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        // Normalize generation KB fields to match universal format
        const normalized: Situation[] = data.map(s => ({
          ...s,
          urg: s.urg ?? s.urgency ?? 5,
          cat: s.cat ?? s.category ?? '',
          qa: s.qa ?? s.quickAnswer ?? '',
          dtc: s.dtc ?? s.dtc_codes ?? [],
          layers: s.layers ?? [],
        }))
        setGenSituations(normalized)
      })
      .catch(() => setGenSituations([]))
  }, [kbGenPath])

  // Available categories from all sources
  const categories = useMemo(() => {
    const all = [...situations, ...brandSituations, ...genSituations]
    const cats = new Set(all.map(s => s.cat).filter(Boolean))
    return Array.from(cats).sort()
  }, [situations, brandSituations, genSituations])

  // Merge with priority: generation > brand > universal (dedup by id)
  const filtered = useMemo(() => {
    let source: SituationWithLevel[]

    if (showGenOnly && genSituations.length > 0) {
      source = genSituations.map(s => ({ ...s, _level: 'generation' as const }))
    } else if (showBrandOnly && brandSituations.length > 0) {
      source = brandSituations.map(s => ({ ...s, _level: 'brand' as const }))
    } else {
      // Merge all three layers with deduplication: generation > brand > universal
      const seen = new Set<string>()
      source = []

      // Generation-level first (highest priority)
      for (const s of genSituations) {
        if (!seen.has(s.id)) {
          seen.add(s.id)
          source.push({ ...s, _level: 'generation' })
        }
      }
      // Brand-level second
      for (const s of brandSituations) {
        if (!seen.has(s.id)) {
          seen.add(s.id)
          source.push({ ...s, _level: 'brand' })
        }
      }
      // Universal last
      for (const s of situations) {
        if (!seen.has(s.id)) {
          seen.add(s.id)
          source.push({ ...s, _level: 'universal' })
        }
      }
    }

    const q = search.toLowerCase().trim()
    return source
      .filter(s => {
        if (catFilter && s.cat !== catFilter) return false
        if (q && !s.title.toLowerCase().includes(q) && !s.qa.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => b.urg - a.urg)
      .slice(0, 50)
  }, [situations, brandSituations, genSituations, showBrandOnly, showGenOnly, search, catFilter])

  return (
    <GlassPanel>
      <div className="hud-header mb-3">
        Ситуации
        {!loading && (
          <span style={{ fontSize: 10, color: theme.text.muted, marginLeft: 8, fontWeight: 400 }}>
            {situations.length} универсальных
            {brandSituations.length > 0 && ` + ${brandSituations.length} для марки`}
            {genSituations.length > 0 && ` + ${genSituations.length} для поколения`}
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
        {genSituations.length > 0 && (
          <button
            onClick={() => { setShowGenOnly(!showGenOnly); if (!showGenOnly) setShowBrandOnly(false) }}
            style={{
              padding: '10px 14px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: showGenOnly ? '#0C1220' : theme.accent.teal,
              background: showGenOnly ? theme.accent.teal : 'rgba(0,200,180,0.06)',
              border: `1px solid ${showGenOnly ? 'transparent' : 'rgba(0,200,180,0.2)'}`,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            Для поколения ({genSituations.length})
          </button>
        )}
        {brandSituations.length > 0 && (
          <button
            onClick={() => { setShowBrandOnly(!showBrandOnly); if (!showBrandOnly) setShowGenOnly(false) }}
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
            const isGen = s._level === 'generation'
            return (
              <div
                key={s.id}
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 4,
                  background: isGen
                    ? 'rgba(0,200,180,0.06)'
                    : isExpanded ? 'rgba(0,229,255,0.05)' : 'rgba(0,229,255,0.02)',
                  border: `1px solid ${isGen
                    ? 'rgba(0,200,180,0.18)'
                    : isExpanded ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.06)'}`,
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

                  {/* Title + generation badge */}
                  <div style={{
                    flex: 1,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.text.secondary,
                    lineHeight: 1.3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}>
                    <span>{s.title}</span>
                    {isGen && (
                      <span style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 9,
                        fontWeight: 700,
                        color: theme.accent.teal,
                        padding: '1px 6px',
                        borderRadius: 3,
                        background: 'rgba(0,200,180,0.1)',
                        border: '1px solid rgba(0,200,180,0.25)',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        для вашего поколения
                      </span>
                    )}
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

                {/* Expanded: quick answer + DTCs + generation extras */}
                {isExpanded && (() => {
                  const answer = s.quickAnswer || s.qa
                  const dtcList = s.dtc_codes || s.dtc || []
                  const layers = s.layers || []
                  return (
                    <div style={{ marginTop: 10, paddingLeft: 14 }}>
                      <div style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 12,
                        color: theme.text.muted,
                        lineHeight: 1.5,
                        marginBottom: 8,
                      }}>
                        {answer}
                      </div>

                      {/* Generation-level detailed explanation */}
                      {isGen && s.level1_ru && (
                        <div style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: 12,
                          color: theme.text.secondary,
                          lineHeight: 1.6,
                          marginBottom: 10,
                          padding: '8px 12px',
                          background: 'rgba(0,200,180,0.04)',
                          border: '1px solid rgba(0,200,180,0.1)',
                          borderRadius: 4,
                          borderLeft: `3px solid ${theme.accent.teal}`,
                        }}>
                          {s.level1_ru}
                        </div>
                      )}

                      {/* Generation-level facts */}
                      {isGen && s.facts_ru && s.facts_ru.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          {s.facts_ru.map((fact, i) => (
                            <div key={i} style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: 11,
                              color: theme.text.muted,
                              lineHeight: 1.5,
                              paddingLeft: 10,
                              borderLeft: '2px solid rgba(0,200,180,0.15)',
                              marginBottom: 3,
                            }}>
                              {fact}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Generation-level price data */}
                      {isGen && s.priceData?.items && s.priceData.items.length > 0 && (
                        <div style={{
                          marginBottom: 10,
                          padding: '8px 10px',
                          background: 'rgba(255,140,0,0.04)',
                          border: '1px solid rgba(255,140,0,0.1)',
                          borderRadius: 4,
                        }}>
                          <div style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#FF8C00',
                            marginBottom: 6,
                            letterSpacing: '0.05em',
                          }}>
                            ОРИЕНТИРОВОЧНЫЕ ЦЕНЫ
                          </div>
                          {s.priceData.items.map((item, i) => (
                            <div key={i} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: 11,
                              color: theme.text.muted,
                              padding: '2px 0',
                            }}>
                              <span>{item.name}</span>
                              <span style={{ color: theme.text.secondary, fontWeight: 600 }}>
                                {item.min.toLocaleString('ru-RU')}&ndash;{item.max.toLocaleString('ru-RU')} &#8381;
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {dtcList.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {dtcList.map(code => (
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

                      {layers.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                          {layers.map(l => (
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

                      {/* Season badge for generation-level */}
                      {isGen && s.season && (
                        <div style={{
                          marginTop: 6,
                          display: 'inline-block',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: 9,
                          fontWeight: 700,
                          color: s.season === 'winter' ? '#80D8FF' : s.season === 'summer' ? '#FFD54F' : theme.text.muted,
                          padding: '2px 8px',
                          borderRadius: 3,
                          background: s.season === 'winter' ? 'rgba(128,216,255,0.08)' : s.season === 'summer' ? 'rgba(255,213,79,0.08)' : 'rgba(0,229,255,0.04)',
                          border: `1px solid ${s.season === 'winter' ? 'rgba(128,216,255,0.2)' : s.season === 'summer' ? 'rgba(255,213,79,0.2)' : 'rgba(0,229,255,0.1)'}`,
                          letterSpacing: '0.05em',
                        }}>
                          {s.season === 'winter' ? '\u2744 ЗИМНИЙ ПЕРИОД' : s.season === 'summer' ? '\u2600 ЛЕТНИЙ ПЕРИОД' : s.season.toUpperCase()}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </GlassPanel>
  )
}
