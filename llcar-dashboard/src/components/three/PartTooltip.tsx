import { useEffect, useMemo, useState } from 'react'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useLatestTelemetry } from '../../hooks/useLatestTelemetry'
import { useIsMobile } from '../../hooks/useIsMobile'
import { resolvePartValue } from '../../utils/partDataResolver'
import type { PartCategory } from '../../types/rules'

const TOOLTIP_WIDTH = 260
const TOOLTIP_GAP = 16

const CATEGORY_COLOR: Record<PartCategory, string> = {
  suspension: '#D4A54A', // warm brake-gold — подвеска/подрамники/тормоза
  engine:     '#C8B48E', // champagne
  electrical: '#E4D4B2', // warm cream (было cool blue — не вписывалось)
  audio:      '#F7A76E', // warm amber
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
  const clearHoveredPart = useDashboardStore((s) => s.clearHoveredPart)
  const telemetry = useLatestTelemetry()
  const isMobile = useIsMobile()
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  )

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { rows, pendingLabels, freezeSnapshot } = useMemo(() => {
    type FreezeRow = { label: string; value: string; unit?: string }
    const empty = {
      rows: [] as Array<{ label: string; value: string; unit?: string }>,
      pendingLabels: [] as string[],
      freezeSnapshot: null as { ruleName: string; rows: FreezeRow[] } | null,
    }
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

    // Freeze-frame snapshot — find first active diagnosis whose rule_name
    // matches one of spec.relatedRules AND has a freeze_frame attached.
    let freezeSnapshot: { ruleName: string; rows: FreezeRow[] } | null = null
    const related = Array.isArray(spec.relatedRules) ? spec.relatedRules : []
    const diagnoses = telemetry.report?.diagnoses ?? []
    if (related.length > 0 && diagnoses.length > 0) {
      for (const d of diagnoses) {
        const ruleName = (d as { rule_name?: string; rule?: string }).rule_name
          ?? (d as { rule?: string }).rule
          ?? ''
        if (!ruleName || !related.includes(ruleName)) continue
        const ff = (d as { freeze_frame?: Record<string, unknown> }).freeze_frame
        if (!ff || typeof ff !== 'object') continue
        const rows: FreezeRow[] = []
        const pushNum = (label: string, val: unknown, unit?: string, precision = 1) => {
          if (typeof val !== 'number' || !Number.isFinite(val)) return
          rows.push({ label, value: val.toFixed(precision), unit })
        }
        const pushStr = (label: string, val: unknown) => {
          if (typeof val !== 'string' || !val) return
          rows.push({ label, value: val })
        }
        const ffo = ff as Record<string, unknown>
        pushNum('RPM', ffo.rpm, 'об/мин', 0)
        pushNum('Скорость', ffo.speed, 'км/ч', 0)
        pushNum('Coolant', ffo.coolant_temp, '°C', 0)
        pushNum('Нагрузка', ffo.engine_load, '%', 0)
        pushNum('Дроссель', ffo.throttle, '%', 0)
        pushNum('Напряж.', ffo.voltage, 'В', 1)
        pushNum('LTFT', ffo.ltft, '%', 1)
        pushNum('STFT', ffo.stft, '%', 1)
        pushNum('T° улицы', ffo.outdoor_temp, '°C', 0)
        pushStr('Погода', ffo.weather)
        if (rows.length > 0) {
          freezeSnapshot = { ruleName: (d as { display?: string }).display || ruleName, rows }
          break
        }
      }
    }

    return { rows: liveRows, pendingLabels: pending, freezeSnapshot }
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

  // На мобиле тултип превращается в fixed-sheet в верхней части экрана.
  // Hover-based позиционирование возле пальца на touch-устройстве бесполезно:
  // палец перекрывает сам tooltip, а click-события без hover не повторяются.
  const mobileStyle: React.CSSProperties = {
    position: 'fixed',
    top: 60,
    left: 8,
    right: 8,
    width: 'auto',
    maxWidth: 'none',
    pointerEvents: 'auto',
    zIndex: 1050,
  }
  const desktopStyle: React.CSSProperties = {
    position: 'fixed',
    top,
    left,
    width: TOOLTIP_WIDTH,
    maxWidth: TOOLTIP_WIDTH,
    pointerEvents: 'none',
    zIndex: 40,
  }

  return (
    <div
      key={hoveredPart.nodeName}
      style={{
        ...(isMobile ? mobileStyle : desktopStyle),
        background: 'rgba(10, 12, 22, 0.92)',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontFamily: 'var(--f-mono, ui-monospace, SFMono-Regular, monospace)',
              color: '#EFF2F7',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1.25,
              fontWeight: 600,
              flex: 1,
              minWidth: 0,
            }}
          >
            {displayName}
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={clearHoveredPart}
              aria-label="Закрыть"
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                fontSize: 16,
                lineHeight: 1,
                color: 'rgba(239,242,247,0.75)',
                background: 'transparent',
                border: '1px solid rgba(239,242,247,0.18)',
                borderRadius: 4,
                cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              ✕
            </button>
          )}
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
        {freezeSnapshot && (
          <div
            style={{
              marginTop: rows.length > 0 ? 10 : 10,
              paddingTop: 8,
              borderTop: '1px solid rgba(239,242,247,0.08)',
              fontSize: 10,
              lineHeight: 1.45,
            }}
          >
            <div style={{
              color: 'rgba(230,212,168,0.85)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: 9,
              marginBottom: 6,
            }}>
              ● При срабатывании: <span style={{ color: '#EFF2F7', textTransform: 'none', letterSpacing: 0 }}>{freezeSnapshot.ruleName}</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 12,
              rowGap: 3,
            }}>
              {freezeSnapshot.rows.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 6,
                  fontSize: 10,
                }}>
                  <span style={{ color: 'rgba(239,242,247,0.5)' }}>{r.label}</span>
                  <span style={{ color: '#EFF2F7', fontVariantNumeric: 'tabular-nums' }}>
                    {r.value}
                    {r.unit ? (
                      <span style={{ marginLeft: 3, color: 'rgba(200,180,142,0.7)', fontSize: 9 }}>{r.unit}</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
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
