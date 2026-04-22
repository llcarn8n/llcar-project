import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties } from 'react'
import { useDashboardStore } from '../../stores/dashboardStore'
import { searchKB, highlightSegments, type KBSearchEntry } from '../../utils/kbSearchIndex'
import { theme } from '../../theme'

interface KBGlobalSearchProps {
  /** Optional className for wrapper (outer width control) */
  className?: string
}

/**
 * Global KB search — autocomplete по brand / model / generation.
 * Ctrl+K / Cmd+K — focus shortcut. ↑↓ — navigate, Enter — select, Esc — close.
 * При select устанавливает vehicleProfile, после чего KnowledgeBase
 * автоматически загружает мануал выбранного поколения.
 */
export function KBGlobalSearch({ className }: KBGlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { vehicleProfile, setVehicleProfile } = useDashboardStore()

  // Debounce 120ms для fuzzy-поиска
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 120)
    return () => clearTimeout(t)
  }, [query])

  // Fuse-поиск по debouncedQuery
  const results = useMemo<KBSearchEntry[]>(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) return []
    return searchKB(q, 10)
  }, [debouncedQuery])

  // Сбрасываем активный индекс при смене результатов
  useEffect(() => {
    setActiveIdx(0)
  }, [results])

  // Ctrl/Cmd+K — фокус на input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Click-outside close
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        inputRef.current && !inputRef.current.contains(t) &&
        dropdownRef.current && !dropdownRef.current.contains(t)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const applySelection = useCallback((entry: KBSearchEntry) => {
    setVehicleProfile({
      brand: entry.bnru || entry.bn,
      brandId: entry.vid,
      model: entry.mn,
      year: entry.ys ?? 0,
      engine: '',
      generationId: entry.gid ?? null,
      generationName: entry.gn,
      // Direct path — guarantees ManualViewer fetches the exact kb folder
      // we indexed (bypasses deriveKBGenPath heuristics).
      kbGenPath: entry.path,
    })
    setQuery('')
    setDebouncedQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }, [setVehicleProfile])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === 'Escape') {
        setQuery('')
        inputRef.current?.blur()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      applySelection(results[activeIdx])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }, [open, results, activeIdx, applySelection])

  // Current-selection pill
  const currentLabel = vehicleProfile
    ? `${vehicleProfile.brand} ${vehicleProfile.model}${vehicleProfile.year ? ` · ${vehicleProfile.year}` : ''}`
    : null

  const hasResults = results.length > 0
  const showDropdown = open && debouncedQuery.trim().length >= 2

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', fontFamily: 'var(--f-body)' }}
    >
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 14,
          opacity: 0.55,
          color: theme.accent.cyan,
          pointerEvents: 'none',
        }}>&#x1F50D;</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={currentLabel ? `${currentLabel} · Ctrl+K` : 'Поиск руководства — марка, модель, поколение…  Ctrl+K'}
          aria-label="Поиск по базе знаний"
          style={{
            width: '100%',
            padding: '11px 54px 11px 38px',
            borderRadius: 4,
            border: open ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(0,229,255,0.18)',
            background: 'rgba(12,18,32,0.55)',
            color: theme.text.primary,
            fontFamily: 'var(--f-body)',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: open ? '0 0 0 1px rgba(0,229,255,0.12), 0 0 18px rgba(0,229,255,0.08)' : 'none',
          }}
        />
        {/* Hint: Ctrl+K chip */}
        <span style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--f-display)',
          fontSize: 9,
          letterSpacing: '0.08em',
          color: 'var(--c-champagne)',
          padding: '3px 6px',
          border: '1px solid rgba(230,212,168,0.3)',
          borderRadius: 3,
          opacity: query ? 0 : 0.7,
          pointerEvents: 'none',
          transition: 'opacity 0.2s',
        }}>
          CTRL+K
        </span>
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: 'min(60vh, 420px)',
            overflowY: 'auto',
            background: 'rgba(12,18,32,0.98)',
            border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 24px rgba(0,229,255,0.08)',
            zIndex: 9999,
            backdropFilter: 'blur(10px)',
          }}
        >
          {hasResults ? (
            results.map((r, i) => (
              <ResultRow
                key={`${r.path}-${i}`}
                entry={r}
                query={debouncedQuery}
                active={i === activeIdx}
                onClick={() => applySelection(r)}
                onHover={() => setActiveIdx(i)}
              />
            ))
          ) : (
            <div style={{
              padding: '14px 16px',
              fontSize: 12,
              color: theme.text.muted,
              fontFamily: 'var(--f-body)',
            }}>
              Ничего не найдено по запросу «{debouncedQuery}»
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ResultRowProps {
  entry: KBSearchEntry
  query: string
  active: boolean
  onClick: () => void
  onHover: () => void
}

function ResultRow({ entry, query, active, onClick, onHover }: ResultRowProps) {
  const baseStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '9px 14px',
    borderBottom: '1px solid rgba(0,229,255,0.06)',
    background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
    cursor: 'pointer',
    transition: 'background 0.12s',
    borderLeft: active ? '2px solid var(--c-champagne)' : '2px solid transparent',
  }

  const brandSegments = highlightSegments(entry.bnru || entry.bn, query)
  const modelSegments = highlightSegments(entry.mn, query)
  // Если gen_name начинается с model_name — показываем только gen_name без дубликата model
  const mnLower = entry.mn.trim().toLowerCase()
  const gnLower = entry.gn.trim().toLowerCase()
  const genCleaned = gnLower.startsWith(mnLower + ' ')
    ? entry.gn.trim().slice(entry.mn.length).trim()
    : entry.gn
  const genSegments = highlightSegments(genCleaned, query)
  const isGenTrivial = genCleaned.length === 0 || genCleaned.toLowerCase() === mnLower

  const years = entry.ys ? `${entry.ys}${entry.ye && entry.ye !== entry.ys ? `–${entry.ye}` : ''}` : null

  return (
    <div
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onHover}
      style={baseStyle}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: theme.text.primary, fontWeight: 500, lineHeight: 1.3 }}>
          {renderHighlight(brandSegments)}
          <span style={{ color: theme.text.muted, margin: '0 6px' }}>·</span>
          {renderHighlight(modelSegments)}
        </div>
        {!isGenTrivial && (
          <div style={{ fontSize: 11, color: theme.text.muted, marginTop: 2, lineHeight: 1.3 }}>
            {renderHighlight(genSegments)}
          </div>
        )}
      </div>
      {years && (
        <span style={{
          fontFamily: 'var(--f-display)',
          fontSize: 10,
          color: theme.accent.cyan,
          letterSpacing: '0.05em',
          flexShrink: 0,
          padding: '2px 6px',
          border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 2,
          background: 'rgba(0,229,255,0.03)',
        }}>
          {years}
        </span>
      )}
    </div>
  )
}

function renderHighlight(segments: Array<{ text: string; match: boolean }>) {
  return segments.map((seg, i) => seg.match ? (
    <mark key={i} style={{
      background: 'rgba(255,220,120,0.2)',
      color: 'var(--c-champagne)',
      padding: '0 1px',
      borderRadius: 2,
      fontWeight: 600,
    }}>{seg.text}</mark>
  ) : (
    <span key={i}>{seg.text}</span>
  ))
}
