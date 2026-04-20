import { useEffect, useMemo, useState } from 'react'
import { partCatalog } from '../../data/partCatalog'
import { useDashboardStore } from '../../stores/dashboardStore'

/**
 * Нижняя панель навигации по деталям 3D-модели для мобильного.
 * Стрелки ‹/› листают уникальные компоненты (по display name), tap по центру
 * открывает тултип с live-данными. Подменяет hover-based UX, который на touch
 * не работает.
 */
export function MobilePartPicker() {
  const setHoveredPart = useDashboardStore((s) => s.setHoveredPart)
  const clearHoveredPart = useDashboardStore((s) => s.clearHoveredPart)
  const hoveredPart = useDashboardStore((s) => s.hoveredPart)

  // Дедуп по display (много записей шарят display, например "Тормоза (все 4)").
  const uniqueParts = useMemo(() => {
    const seen = new Set<string>()
    return partCatalog.filter((p) => {
      const key = p.display || p.nodeNames[0] || ''
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [])

  const [localIndex, setLocalIndex] = useState(0)

  const syncedIndex = useMemo(() => {
    if (!hoveredPart?.partSpec?.display) return localIndex
    const idx = uniqueParts.findIndex((p) => p.display === hoveredPart.partSpec?.display)
    return idx >= 0 ? idx : localIndex
  }, [hoveredPart?.partSpec?.display, uniqueParts, localIndex])

  // Следим за внешними hover-событиями (если пользователь всё-таки попал пальцем в меш).
  useEffect(() => {
    if (syncedIndex !== localIndex) setLocalIndex(syncedIndex)
  }, [syncedIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const select = (rawIdx: number) => {
    const n = uniqueParts.length
    if (n === 0) return
    const idx = ((rawIdx % n) + n) % n
    setLocalIndex(idx)
    const p = uniqueParts[idx]
    setHoveredPart({
      nodeName: p.nodeNames?.[0] ?? p.display ?? '',
      partSpec: p,
      screenX: 0,
      screenY: 0,
    })
  }

  if (uniqueParts.length === 0) return null

  const active = uniqueParts[syncedIndex]
  const total = uniqueParts.length

  const btn: React.CSSProperties = {
    minWidth: 44,
    minHeight: 44,
    padding: '8px 12px',
    fontFamily: 'var(--f-display)',
    fontSize: 16,
    fontWeight: 700,
    color: '#F2E4C2',
    background: 'rgba(200,180,142,0.08)',
    border: '1px solid rgba(230,212,168,0.35)',
    borderRadius: 4,
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'rgba(230,212,168,0.25)',
    flexShrink: 0,
  }
  const centerBtn: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    padding: '8px 10px',
    fontFamily: 'var(--f-body)',
    fontSize: 12,
    fontWeight: 600,
    color: hoveredPart ? '#F2E4C2' : 'rgba(239,242,247,0.85)',
    background: hoveredPart ? 'rgba(200,180,142,0.14)' : 'rgba(10,11,22,0.6)',
    border: `1px solid ${hoveredPart ? 'rgba(230,212,168,0.5)' : 'rgba(230,212,168,0.22)'}`,
    borderRadius: 4,
    cursor: 'pointer',
    textAlign: 'center',
    letterSpacing: '0.04em',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'rgba(230,212,168,0.2)',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'var(--c-void)',
        borderBottom: '1px solid rgba(230,212,168,0.12)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: 'var(--f-display)',
            fontSize: 8,
            fontWeight: 700,
            color: '#F2E4C2',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          ДЕТАЛЬ
        </span>
        <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', color: 'rgba(230,212,168,0.6)', fontVariantNumeric: 'tabular-nums' }}>
          {syncedIndex + 1}/{total}
        </span>
      </div>
      <button
        type="button"
        onClick={() => select(syncedIndex - 1)}
        aria-label="Предыдущая деталь"
        style={btn}
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => select(syncedIndex)}
        aria-label={`Открыть ${active?.display ?? 'деталь'}`}
        style={centerBtn}
      >
        {active?.display ?? '—'}
      </button>
      <button
        type="button"
        onClick={() => select(syncedIndex + 1)}
        aria-label="Следующая деталь"
        style={btn}
      >
        ›
      </button>
      {hoveredPart && (
        <button
          type="button"
          onClick={clearHoveredPart}
          aria-label="Закрыть"
          style={{ ...btn, fontSize: 14, background: 'transparent' }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default MobilePartPicker
