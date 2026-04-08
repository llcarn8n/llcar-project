import { useState, useEffect, useMemo, useCallback } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface DTCEntry {
  c: string   // code
  t: string   // title
  s: string   // severity
  sys: string // system_id
  d: string   // can_drive
}

interface DTCSearchProps {
  onSelect: (code: string) => void
  selectedCode: string | null
  brandId?: string | null
}

const SYSTEM_TABS = [
  { prefix: '', label: 'Все', icon: '\u{1F50D}', color: theme.accent.cyan },
  { prefix: 'P', label: 'Двигатель (P)', icon: '\u2699', color: theme.status.warning },
  { prefix: 'B', label: 'Кузов (B)', icon: '\u{1F6AA}', color: theme.accent.teal },
  { prefix: 'C', label: 'Шасси (C)', icon: '\u{1F6DE}', color: '#FF6B35' },
  { prefix: 'U', label: 'Сеть (U)', icon: '\u{1F4E1}', color: '#bc13fe' },
]

const SEVERITY_COLORS: Record<string, string> = {
  critical: theme.status.critical,
  high: '#FF6B35',
  medium: theme.status.warning,
  low: theme.accent.cyan,
}

const CAN_DRIVE_LABELS: Record<string, { text: string; color: string }> = {
  no_stop: { text: 'СТОП', color: theme.status.critical },
  caution: { text: 'Осторожно', color: theme.status.warning },
  check: { text: 'Проверить', color: theme.accent.cyan },
  ok: { text: 'Можно ехать', color: theme.status.ok },
}

const SYSTEM_LABELS: Record<string, string> = {
  engine: 'Двигатель',
  transmission: 'Трансмиссия',
  sensors: 'Датчики',
  emissions: 'Выхлоп',
  body: 'Кузов',
  chassis: 'Шасси',
  network: 'Сеть',
  hybrid: 'Гибрид',
  ev: 'Электро',
}

export function DTCSearch({ onSelect, selectedCode, brandId }: DTCSearchProps) {
  const [allCodes, setAllCodes] = useState<DTCEntry[]>([])
  const [brandCodes, setBrandCodes] = useState<DTCEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [systemTab, setSystemTab] = useState('')
  const [showBrandOnly, setShowBrandOnly] = useState(false)

  // Load DTC index
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/dtc-search.json`)
      .then(r => r.json())
      .then((data: DTCEntry[]) => {
        setAllCodes(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Load brand-specific codes
  useEffect(() => {
    if (!brandId) { setBrandCodes([]); return }
    fetch(`${import.meta.env.BASE_URL}data/brands-dtc/${brandId}.json`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ c: string; n: string; f: string }>) => {
        setBrandCodes(data.map(d => ({
          c: d.c,
          t: d.n,
          s: 'medium' as string,
          sys: '',
          d: 'check',
        })))
      })
      .catch(() => setBrandCodes([]))
  }, [brandId])

  // System tab counts
  const systemCounts = useMemo(() => {
    const counts: Record<string, number> = { '': allCodes.length }
    for (const tab of SYSTEM_TABS) {
      if (tab.prefix) counts[tab.prefix] = allCodes.filter(e => e.c.startsWith(tab.prefix)).length
    }
    return counts
  }, [allCodes])

  // Filter results
  const results = useMemo(() => {
    const source = showBrandOnly && brandCodes.length > 0 ? brandCodes : allCodes
    if (!query && !severityFilter && !systemTab) return []
    const q = query.toUpperCase().trim()
    const qLower = query.toLowerCase().trim()

    return source.filter(e => {
      if (systemTab && !e.c.startsWith(systemTab)) return false
      if (severityFilter && e.s !== severityFilter) return false
      if (!q) return !!(severityFilter || systemTab)
      return e.c.includes(q) || e.t.toLowerCase().includes(qLower)
    }).slice(0, 100)
  }, [allCodes, brandCodes, showBrandOnly, query, severityFilter, systemTab])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  return (
    <GlassPanel>
      <div className="hud-header mb-3">
        Поиск кодов ошибок
        {!loading && (
          <span style={{ fontSize: 10, color: theme.text.muted, marginLeft: 8, fontWeight: 400 }}>
            {allCodes.length.toLocaleString()} кодов в базе
          </span>
        )}
      </div>

      {/* Search input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="P0420, катализатор, misfire..."
          value={query}
          onChange={handleInput}
          style={{
            flex: '1 1 250px',
            padding: '12px 16px',
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: '#ffffff',
            background: 'rgba(0,229,255,0.04)',
            border: `2px solid rgba(0,229,255,0.2)`,
            borderRadius: 4,
            outline: 'none',
            letterSpacing: '0.05em',
            transition: 'border-color 0.3s',
          }}
          onFocus={e => e.target.style.borderColor = theme.accent.cyan}
          onBlur={e => e.target.style.borderColor = 'rgba(0,229,255,0.2)'}
        />

        {/* Severity filter */}
        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: '#c0c8d4',
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.15)',
            borderRadius: 4,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Все уровни</option>
          <option value="critical">Критические</option>
          <option value="high">Высокие</option>
          <option value="medium">Средние</option>
          <option value="low">Низкие</option>
        </select>
      </div>

      {/* System tabs */}
      {!loading && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {SYSTEM_TABS.map(tab => {
            const active = systemTab === tab.prefix
            const count = systemCounts[tab.prefix] || 0
            return (
              <button
                key={tab.prefix}
                onClick={() => setSystemTab(active ? '' : tab.prefix)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: active ? '#0C1220' : tab.color,
                  background: active ? tab.color : `${tab.color}08`,
                  border: `1px solid ${active ? 'transparent' : `${tab.color}20`}`,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                }}
              >
                {tab.icon} {tab.label} <span style={{ opacity: 0.7 }}>({count.toLocaleString()})</span>
              </button>
            )
          })}

          {/* Brand toggle */}
          {brandId && brandCodes.length > 0 && (
            <button
              onClick={() => setShowBrandOnly(!showBrandOnly)}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: showBrandOnly ? '#0C1220' : theme.status.warning,
                background: showBrandOnly ? theme.status.warning : `${theme.status.warning}08`,
                border: `1px solid ${showBrandOnly ? 'transparent' : `${theme.status.warning}20`}`,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                transition: 'all 0.2s',
                marginLeft: 'auto',
              }}
            >
              Только для марки ({brandCodes.length})
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          textAlign: 'center', padding: 24,
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 12, color: theme.accent.cyan,
          letterSpacing: '0.15em',
        }}>
          LOADING DTC DATABASE...
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{
            fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: '0.05em', marginBottom: 4,
          }}>
            {results.length === 100 ? '100+ результатов' : `${results.length} результатов`}
          </div>

          {results.map(entry => {
            const sevColor = SEVERITY_COLORS[entry.s] || theme.text.muted
            const driveInfo = CAN_DRIVE_LABELS[entry.d]
            const isSelected = selectedCode === entry.c

            return (
              <button
                key={entry.c}
                onClick={() => onSelect(entry.c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 4,
                  background: isSelected ? `${theme.accent.cyan}10` : 'rgba(0,229,255,0.02)',
                  border: `1px solid ${isSelected ? `${theme.accent.cyan}30` : 'rgba(0,229,255,0.06)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {/* Code */}
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: sevColor,
                  letterSpacing: '0.08em',
                  minWidth: 70,
                  textShadow: `0 0 8px ${sevColor}40`,
                }}>
                  {entry.c}
                </div>

                {/* Title */}
                <div style={{
                  flex: 1,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.text.secondary,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {entry.t}
                </div>

                {/* System badge */}
                {entry.sys && (
                  <span style={{
                    fontSize: 9,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    color: theme.text.muted,
                    padding: '2px 6px',
                    borderRadius: 2,
                    background: 'rgba(0,229,255,0.05)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase' as const,
                    flexShrink: 0,
                  }}>
                    {SYSTEM_LABELS[entry.sys] || entry.sys}
                  </span>
                )}

                {/* Can drive badge */}
                {driveInfo && (
                  <span style={{
                    fontSize: 9,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    color: driveInfo.color,
                    padding: '2px 6px',
                    borderRadius: 2,
                    background: `${driveInfo.color}10`,
                    border: `1px solid ${driveInfo.color}20`,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase' as const,
                    flexShrink: 0,
                  }}>
                    {driveInfo.text}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && query && results.length === 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '24px 16px',
        }}>
          <span style={{ fontSize: 40, opacity: 0.4 }}>&#x1F50D;</span>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 14,
            color: theme.text.muted,
          }}>
            Код <strong style={{ color: theme.accent.cyan }}>{query}</strong> не найден.
            Попробуйте другой код или ключевое слово.
          </div>
        </div>
      )}

      {/* Hint when empty */}
      {!loading && !query && !severityFilter && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '20px 16px',
        }}>
          <span style={{ fontSize: 44, opacity: 0.4 }}>&#x26A0;</span>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 13,
            color: theme.text.muted,
            lineHeight: 1.5,
          }}>
            Введите код ошибки (например <strong style={{ color: theme.accent.cyan }}>P0420</strong>) или
            ключевое слово (<strong style={{ color: theme.accent.cyan }}>катализатор</strong>, <strong style={{ color: theme.accent.cyan }}>misfire</strong>).
            <br />
            В базе {allCodes.length.toLocaleString()} кодов с расшифровками.
          </div>
        </div>
      )}
    </GlassPanel>
  )
}
