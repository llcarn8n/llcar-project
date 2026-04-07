import { useRef, useState, useCallback, useMemo } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface HistoryPoint {
  time: string
  score: number | null
  suspension?: number | null
  engine?: number | null
  electrical?: number | null
  audio?: number | null
  degradation?: boolean
}

interface TimelineScrubberProps {
  history: HistoryPoint[]
  onTimeSelect?: (index: number, time: string) => void
}

function scoreColor(score: number | null): string {
  if (score === null || score < 0) return 'rgba(255,255,255,0.05)'
  if (score >= 80) return theme.status.ok
  if (score >= 50) return theme.status.warning
  return theme.status.critical
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const day = d.getDate().toString().padStart(2, '0')
    const mon = (d.getMonth() + 1).toString().padStart(2, '0')
    const hr = d.getHours().toString().padStart(2, '0')
    const mn = d.getMinutes().toString().padStart(2, '0')
    return `${day}.${mon} ${hr}:${mn}`
  } catch { return iso }
}

export function TimelineScrubber({ history, onTimeSelect }: TimelineScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [playhead, setPlayhead] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const count = history.length

  const getIndexFromX = useCallback((clientX: number) => {
    if (!containerRef.current || count === 0) return null
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    return Math.min(Math.floor(pct * count), count - 1)
  }, [count])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const idx = getIndexFromX(e.clientX)
    if (idx !== null && history[idx]) {
      setPlayhead(idx)
      onTimeSelect?.(idx, history[idx].time)
    }
  }, [getIndexFromX, history, onTimeSelect])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true)
    handleClick(e)
  }, [handleClick])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const idx = getIndexFromX(e.clientX)
    setHoverIdx(idx)
    if (dragging && idx !== null && history[idx]) {
      setPlayhead(idx)
      onTimeSelect?.(idx, history[idx].time)
    }
  }, [dragging, getIndexFromX, history, onTimeSelect])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setDragging(false)
    setHoverIdx(null)
  }, [])

  // Time labels (show ~6 evenly spaced)
  const labels = useMemo(() => {
    if (count < 2) return []
    const step = Math.max(1, Math.floor(count / 6))
    const result = []
    for (let i = 0; i < count; i += step) {
      result.push({ idx: i, label: formatTime(history[i].time), pct: (i / (count - 1)) * 100 })
    }
    return result
  }, [history, count])

  // Hovered point info
  const hoverPoint = hoverIdx !== null ? history[hoverIdx] : null
  const activePoint = playhead !== null ? history[playhead] : null
  const displayPoint = hoverPoint || activePoint

  if (count === 0) {
    return (
      <GlassPanel className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span className="hud-header" style={{ marginBottom: 0, fontSize: '0.6rem' }}>Таймлайн</span>
          <span className="text-[10px]" style={{ color: theme.text.muted }}>Нет истории</span>
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel className="py-2 px-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="hud-header" style={{ marginBottom: 0, fontSize: '0.6rem' }}>Таймлайн</span>
        {displayPoint && (
          <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: theme.text.secondary }}>
            <span>{formatTime(displayPoint.time)}</span>
            <span>Здоровье: <b style={{ color: scoreColor(displayPoint.score) }}>{displayPoint.score ?? '--'}</b></span>
            {displayPoint.degradation && (
              <span style={{ color: theme.status.critical }}>⚠ Деградация</span>
            )}
          </div>
        )}
      </div>

      {/* Timeline bar */}
      <div
        ref={containerRef}
        className="relative cursor-crosshair select-none"
        style={{ height: 28, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Colored segments */}
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox={`0 0 ${count} 28`} style={{ display: 'block' }}>
          {history.map((pt, i) => (
            <rect
              key={i}
              x={i}
              y={0}
              width={1.2}
              height={28}
              fill={scoreColor(pt.score)}
              opacity={pt.score !== null && pt.score >= 0 ? 0.6 : 0.1}
            />
          ))}
        </svg>

        {/* Hover indicator */}
        {hoverIdx !== null && (
          <div style={{
            position: 'absolute',
            left: `${(hoverIdx / count) * 100}%`,
            top: 0,
            width: 1,
            height: '100%',
            background: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }} />
        )}

        {/* Playhead */}
        {playhead !== null && (
          <div style={{
            position: 'absolute',
            left: `${(playhead / count) * 100}%`,
            top: -2,
            width: 2,
            height: 32,
            background: '#fff',
            boxShadow: '0 0 6px rgba(255,255,255,0.6)',
            pointerEvents: 'none',
            borderRadius: 1,
          }}>
            {/* Grab handle */}
            <div style={{
              position: 'absolute',
              top: -4,
              left: -3,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: theme.accent.cyan,
              border: '2px solid #fff',
              boxShadow: `0 0 6px ${theme.accent.cyan}`,
            }} />
          </div>
        )}
      </div>

      {/* Time labels */}
      <div className="relative" style={{ height: 14, marginTop: 2 }}>
        {labels.map(l => (
          <span
            key={l.idx}
            className="absolute text-[8px] font-mono"
            style={{
              left: `${l.pct}%`,
              transform: 'translateX(-50%)',
              color: theme.text.muted,
            }}
          >
            {l.label}
          </span>
        ))}
      </div>
    </GlassPanel>
  )
}
