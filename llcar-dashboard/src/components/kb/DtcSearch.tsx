import { useEffect, useMemo, useRef, useState } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface DtcSituationRef {
  sit_id: string
  title: string
  brand: string
  model: string
  generation: string
  urg: number
  cat: string
}

interface DtcTitleEntry {
  title_ru: string
  severity: string
  system_id: string
  can_drive: string
}

interface DtcIndex {
  generated_at: string
  total_codes: number
  total_mappings: number
  index: Record<string, DtcSituationRef[]>
  titles?: Record<string, DtcTitleEntry>
  titles_total?: number
}

interface DtcSearchProps {
  /** Callback when user clicks a situation from results. Receives sit_id. */
  onSelectSituation?: (ref: DtcSituationRef) => void
  /** Preselected DTC code (e.g. from URL param). */
  initialCode?: string
}

function urgencyColor(urg: number): string {
  if (urg >= 4) return theme.status.critical
  if (urg >= 3) return theme.status.warning
  return theme.accent.cyan
}

export function DtcSearch({ onSelectSituation, initialCode }: DtcSearchProps) {
  const [idx, setIdx] = useState<DtcIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(initialCode ?? '')
  const [selectedCode, setSelectedCode] = useState<string | null>(initialCode ?? null)
  const [catFilter, setCatFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/kb/_dtc_index.json`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((data: DtcIndex) => {
        setIdx(data)
        setLoading(false)
      })
      .catch(err => {
        setError(String(err))
        setLoading(false)
      })
  }, [])

  const allCodes = useMemo(() => {
    if (!idx) return []
    return Object.keys(idx.index).sort()
  }, [idx])

  const suggestions = useMemo(() => {
    if (!query || !idx) return []
    const q = query.toUpperCase().trim()
    return allCodes
      .filter(code => code.toUpperCase().startsWith(q))
      .slice(0, 12)
  }, [query, allCodes, idx])

  const currentSituations = useMemo(() => {
    if (!idx || !selectedCode) return []
    return idx.index[selectedCode.toUpperCase()] ?? []
  }, [idx, selectedCode])

  const availableCats = useMemo(() => {
    const cats = new Set<string>()
    for (const s of currentSituations) cats.add(s.cat)
    return Array.from(cats).sort()
  }, [currentSituations])

  const availableBrands = useMemo(() => {
    const brands = new Set<string>()
    for (const s of currentSituations) brands.add(s.brand)
    return Array.from(brands).sort()
  }, [currentSituations])

  const filteredSituations = useMemo(() => {
    return currentSituations
      .filter(s => {
        if (catFilter && s.cat !== catFilter) return false
        if (brandFilter && s.brand !== brandFilter) return false
        return true
      })
      .sort((a, b) => b.urg - a.urg)
  }, [currentSituations, catFilter, brandFilter])

  const handleSelect = (code: string) => {
    setSelectedCode(code.toUpperCase())
    setQuery(code.toUpperCase())
    setShowSuggestions(false)
    setCatFilter('')
    setBrandFilter('')
    inputRef.current?.blur()
  }

  return (
    <GlassPanel>
      <div className="hud-header mb-3">
        Поиск по DTC
        {idx && (
          <span
            style={{
              fontSize: 10,
              color: theme.text.muted,
              marginLeft: 8,
              fontWeight: 400,
            }}
          >
            {idx.total_codes.toLocaleString('ru-RU')} кодов · {idx.total_mappings.toLocaleString('ru-RU')} связей
          </span>
        )}
      </div>

      {loading && (
        <div
          style={{
            padding: 16,
            textAlign: 'center',
            fontFamily: 'var(--f-display), sans-serif',
            fontSize: 11,
            color: theme.accent.cyan,
            letterSpacing: '0.15em',
          }}
        >
          LOADING INDEX...
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 12,
            fontFamily: 'var(--f-body), sans-serif',
            fontSize: 12,
            color: theme.status.critical,
          }}
        >
          Ошибка загрузки индекса: {error}
        </div>
      )}

      {!loading && !error && idx && (
        <>
          {/* Search input with autocomplete */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Введите код DTC, напр. P0300"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={e => {
                if (e.key === 'Enter' && suggestions.length > 0) {
                  handleSelect(suggestions[0])
                } else if (e.key === 'Enter') {
                  handleSelect(query)
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false)
                }
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontFamily: 'var(--f-display), sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'rgba(0,229,255,0.04)',
                border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: 4,
                outline: 'none',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: 'var(--bg-panel)',
                  border: '1px solid rgba(0,229,255,0.2)',
                  borderRadius: 4,
                  maxHeight: 280,
                  overflowY: 'auto',
                  zIndex: 50,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                {suggestions.map(code => {
                  const count = idx.index[code].length
                  const title = idx.titles?.[code]?.title_ru
                  return (
                    <div
                      key={code}
                      onMouseDown={e => {
                        e.preventDefault()
                        handleSelect(code)
                      }}
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(0,229,255,0.06)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(0,229,255,0.08)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--f-display), sans-serif',
                          fontSize: 12,
                          fontWeight: 700,
                          color: theme.accent.cyan,
                          letterSpacing: '0.08em',
                        }}>
                          {code}
                        </span>
                        <span style={{ fontSize: 10, color: theme.text.muted, fontWeight: 400 }}>
                          {count} {count === 1 ? 'ситуация' : count < 5 ? 'ситуации' : 'ситуаций'}
                        </span>
                      </div>
                      {title && (
                        <div style={{
                          fontFamily: 'var(--f-body), sans-serif',
                          fontSize: 11,
                          color: theme.text.secondary,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {title}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filters (when code selected) */}
          {selectedCode && currentSituations.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <select
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
                style={{
                  padding: '8px 10px',
                  fontFamily: 'var(--f-body), sans-serif',
                  fontSize: 12,
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
                {availableCats.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                style={{
                  padding: '8px 10px',
                  fontFamily: 'var(--f-body), sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'rgba(0,229,255,0.04)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  borderRadius: 4,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Все бренды</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Results */}
          {selectedCode && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--f-body), sans-serif',
                  fontSize: 11,
                  color: theme.text.muted,
                  marginBottom: 8,
                  letterSpacing: '0.05em',
                }}
              >
                {filteredSituations.length} из {currentSituations.length} ситуаций для{' '}
                <span
                  style={{
                    fontFamily: 'var(--f-display), sans-serif',
                    color: theme.accent.cyan,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                >
                  {selectedCode}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  maxHeight: '55vh',
                  overflowY: 'auto',
                }}
              >
                {filteredSituations.length === 0 && (
                  <div
                    style={{
                      padding: 16,
                      textAlign: 'center',
                      fontFamily: 'var(--f-body), sans-serif',
                      fontSize: 12,
                      color: theme.text.muted,
                    }}
                  >
                    Нет ситуаций с выбранными фильтрами.
                  </div>
                )}
                {filteredSituations.map(s => (
                  <div
                    key={s.sit_id}
                    onClick={() => onSelectSituation?.(s)}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'rgba(0,229,255,0.02)',
                      border: '1px solid rgba(0,229,255,0.06)',
                      borderRadius: 4,
                      cursor: onSelectSituation ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!onSelectSituation) return
                      e.currentTarget.style.background = 'rgba(0,229,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'
                    }}
                    onMouseLeave={e => {
                      if (!onSelectSituation) return
                      e.currentTarget.style.background = 'rgba(0,229,255,0.02)'
                      e.currentTarget.style.borderColor = 'rgba(0,229,255,0.06)'
                    }}
                  >
                    <div
                      style={{
                        width: 3,
                        height: 24,
                        background: urgencyColor(s.urg),
                        borderRadius: 2,
                        flexShrink: 0,
                        boxShadow: `0 0 4px ${urgencyColor(s.urg)}60`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--f-body), sans-serif',
                          fontSize: 12,
                          fontWeight: 600,
                          color: theme.text.primary,
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--f-display), sans-serif',
                          fontSize: 9,
                          color: theme.text.muted,
                          letterSpacing: '0.06em',
                          marginTop: 2,
                        }}
                      >
                        {s.brand.toUpperCase()} · {s.model} · {s.generation} · {s.cat}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--f-display), sans-serif',
                        fontSize: 10,
                        fontWeight: 700,
                        color: urgencyColor(s.urg),
                        minWidth: 14,
                        textAlign: 'center',
                      }}
                    >
                      {s.urg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedCode && (
            <div
              style={{
                padding: 12,
                fontFamily: 'var(--f-body), sans-serif',
                fontSize: 12,
                color: theme.text.muted,
                fontStyle: 'italic',
              }}
            >
              Начните ввод кода DTC для получения списка ситуаций.
              Популярные: P0300, P0171, P0420, P0011, P0301.
            </div>
          )}
        </>
      )}
    </GlassPanel>
  )
}
