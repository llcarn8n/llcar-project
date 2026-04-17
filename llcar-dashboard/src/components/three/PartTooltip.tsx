import { useEffect, useMemo, useState } from 'react'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useLatestTelemetry } from '../../hooks/useLatestTelemetry'
import { resolvePartValue } from '../../utils/partDataResolver'
import type { PartCategory } from '../../types/rules'

const TOOLTIP_WIDTH = 260
const TOOLTIP_GAP = 16

const CATEGORY_COLOR: Record<PartCategory, string> = {
  suspension: '#6B5AE0', // indigo
  engine:     '#C8B48E', // champagne
  electrical: '#8AB4F8', // cool blue
  audio:      '#F7A76E', // warm
  body:       '#B09A7A', // soft champagne
  light:      '#EFF2F7', // spectral
  interior:   '#B09A7A',
  other:      '#B0A890',
}

function formatValue(value: number | string | null, precision?: number): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (!Number.isFinite(value)) return null
  const p = typeof precision === 'number' ? precision : 2
  return value.toFixed(p)
}

export default function PartTooltip() {
  const hoveredPart = useDashboardStore((s) => s.hoveredPart)
  const telemetry = useLatestTelemetry()
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  )

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { rows, pendingLabels } = useMemo(() => {
    const empty = { rows: [] as Array<{ label: string; value: string; unit?: string }>, pendingLabels: [] as string[] }
    if (!hoveredPart || !hoveredPart.partSpec) return empty
    const spec = hoveredPart.partSpec
    if (!Array.isArray(spec.params) || spec.params.length === 0) return empty
    const liveRows: Array<{ label: string; value: string; unit?: string }> = []
    const pending: string[] = []
    for (const p of spec.params) {
      const raw = resolvePartValue(p.key, telemetry)
      const formatted = formatValue(raw, p.precision)
      if (formatted == null) {
        pending.push(p.label)
        continue
      }
      liveRows.push({ label: p.label, value: formatted, unit: p.unit })
    }
    return { rows: liveRows, pendingLabels: pending }
  }, [hoveredPart, telemetry])

  if (!hoveredPart || !hoveredPart.partSpec) return null

  const spec = hoveredPart.partSpec
  const displayName = spec.display || hoveredPart.nodeName || 'Деталь'
  const categoryColor = CATEGORY_COLOR[spec.category] ?? CATEGORY_COLOR.other

  // Flip to left side if the tooltip would overflow right edge.
  const overflowRight = hoveredPart.screenX + TOOLTIP_WIDTH + TOOLTIP_GAP > viewportWidth
  const left = overflowRight
    ? Math.max(hoveredPart.screenX - TOOLTIP_WIDTH - TOOLTIP_GAP, 8)
    : hoveredPart.screenX + TOOLTIP_GAP
  const top = hoveredPart.screenY + TOOLTIP_GAP

  return (
    <div
      key={hoveredPart.nodeName}
      style={{
        position: 'fixed',
        top,
        left,
        width: TOOLTIP_WIDTH,
        maxWidth: TOOLTIP_WIDTH,
        pointerEvents: 'none',
        zIndex: 40,
        background: 'rgba(10, 12, 22, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid var(--c-spectral-divider)',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        animation: 'partTooltipFadeIn 160ms ease-out',
        fontFamily: 'var(--f-mono, ui-monospace, SFMono-Regular, monospace)',
      }}
      data-part-tooltip
    >
      <style>{`
        @keyframes partTooltipFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          height: 2,
          width: '100%',
          background: categoryColor,
          boxShadow: `0 0 10px ${categoryColor}`,
        }}
      />
      <div style={{ padding: '10px 12px 12px' }}>
        <div
          style={{
            fontSize: 13,
            fontFamily: 'var(--f-mono, ui-monospace, SFMono-Regular, monospace)',
            color: '#EFF2F7',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            lineHeight: 1.25,
            fontWeight: 600,
          }}
        >
          {displayName}
        </div>
        {rows.length > 0 && (
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              borderTop: '1px solid rgba(239,242,247,0.08)',
              paddingTop: 8,
            }}
          >
            {rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 10,
                  fontSize: 11,
                }}
              >
                <span style={{ color: 'rgba(239,242,247,0.58)', letterSpacing: '0.04em' }}>
                  {r.label}
                </span>
                <span
                  style={{
                    color: '#EFF2F7',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 500,
                  }}
                >
                  {r.value}
                  {r.unit ? (
                    <span style={{ marginLeft: 4, color: 'rgba(200,180,142,0.8)', fontSize: 10 }}>
                      {r.unit}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
        {pendingLabels.length > 0 && (
          <div
            style={{
              marginTop: rows.length > 0 ? 8 : 10,
              borderTop: rows.length > 0 ? 'none' : '1px solid rgba(239,242,247,0.08)',
              paddingTop: rows.length > 0 ? 0 : 8,
              fontSize: 10,
              lineHeight: 1.4,
              color: 'rgba(239,242,247,0.38)',
              letterSpacing: '0.03em',
            }}
          >
            <span style={{ color: 'rgba(200,180,142,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 9, marginRight: 6 }}>
              отслеживается
            </span>
            {pendingLabels.join(' · ')}
            <span style={{ color: 'rgba(239,242,247,0.28)', marginLeft: 6, fontStyle: 'italic' }}>
              пока нет данных
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
