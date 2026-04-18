import { useMemo } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

// ── Types ──

interface CusumTerm {
  alarm: boolean
  cusum_value: number
  magnitude: number
}

interface DegradationData {
  degradation_detected: boolean
  trend_per_day: number
  short_term: CusumTerm
  medium_term: CusumTerm
  long_term: CusumTerm
}

export interface CUSUMChartProps {
  degradation?: DegradationData
  history?: Array<{
    time: string
    overall: number
    trend: number
    degradation: boolean
  }>
}

// ── Constants ──

interface GaugeConfig {
  key: 'short_term' | 'medium_term' | 'long_term'
  label: string
  period: string
  threshold: number
}

const GAUGES: GaugeConfig[] = [
  { key: 'short_term', label: 'КРАТКОСР.', period: '30 мин', threshold: 10 },
  { key: 'medium_term', label: 'СРЕДНЕСР.', period: '1 день', threshold: 15 },
  { key: 'long_term', label: 'ДОЛГОСР.', period: '1 неделя', threshold: 25 },
]

// ── SVG Arc Gauge ──

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180
  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

function ArcGauge({ term, config }: { term: CusumTerm; config: GaugeConfig }) {
  const { threshold, label, period } = config
  const value = term.cusum_value
  const ratio = Math.min(value / threshold, 1.5) // clamp at 150% for visual
  const normalizedRatio = Math.min(ratio, 1)

  // Color by alarm state and ratio
  const color = useMemo(() => {
    if (term.alarm || ratio > 0.8) return theme.status.critical
    if (ratio > 0.5) return theme.status.warning
    return theme.status.ok
  }, [term.alarm, ratio])

  // Arc geometry: 180-degree arc from left to right (bottom-open semicircle)
  const cx = 56
  const cy = 50
  const r = 36
  const startAngle = 150 // starting from bottom-left
  const endAngle = 390 // ending at bottom-right (240 degree sweep)
  const sweepRange = endAngle - startAngle

  const valueAngle = startAngle + sweepRange * normalizedRatio

  // Tick marks at 50% and 80% thresholds
  const tick50Angle = startAngle + sweepRange * 0.5
  const tick80Angle = startAngle + sweepRange * 0.8

  function tickLine(angle: number, inner: number, outer: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x1: cx + inner * Math.cos(rad),
      y1: cy + inner * Math.sin(rad),
      x2: cx + outer * Math.cos(rad),
      y2: cy + outer * Math.sin(rad),
    }
  }

  const t50 = tickLine(tick50Angle, r - 4, r + 4)
  const t80 = tickLine(tick80Angle, r - 4, r + 4)

  // Needle endpoint
  const needleRad = (valueAngle * Math.PI) / 180
  const needleLen = r - 8
  const nx = cx + needleLen * Math.cos(needleRad)
  const ny = cy + needleLen * Math.sin(needleRad)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        minWidth: 100,
      }}
    >
      <svg width="112" height="80" viewBox="0 0 112 80">
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${config.key}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={arcPath(cx, cy, r, startAngle, endAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Value arc */}
        {normalizedRatio > 0 && (
          <path
            d={arcPath(cx, cy, r, startAngle, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            filter={`url(#glow-${config.key})`}
            style={{
              opacity: term.alarm ? undefined : 0.9,
              animation: term.alarm ? 'pulse-critical 1.5s infinite' : 'none',
            }}
          />
        )}

        {/* Threshold tick marks */}
        <line
          x1={t50.x1} y1={t50.y1} x2={t50.x2} y2={t50.y2}
          stroke={theme.status.warning}
          strokeWidth="1"
          opacity="0.4"
        />
        <line
          x1={t80.x1} y1={t80.y1} x2={t80.x2} y2={t80.y2}
          stroke={theme.status.critical}
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Needle */}
        <line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Needle center dot */}
        <circle cx={cx} cy={cy} r="3" fill={color} opacity="0.9" />

        {/* Value text */}
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fill={color}
          fontSize="13"
          fontFamily="var(--f-mono)"
          fontWeight="bold"
        >
          {value.toFixed(1)}
        </text>
      </svg>

      {/* Label */}
      <div
        style={{
          fontFamily: "var(--f-display)",
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: '0.15em',
          color: term.alarm ? color : theme.text.secondary,
          textAlign: 'center',
          marginTop: -4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--f-body)",
          fontSize: 10,
          color: theme.text.muted,
          letterSpacing: '0.05em',
          marginTop: 1,
        }}
      >
        {period}
      </div>
      {/* Threshold label */}
      <div
        style={{
          fontFamily: "Consolas, monospace",
          fontSize: 9,
          color: theme.text.muted,
          marginTop: 1,
        }}
      >
        h={threshold}
      </div>
    </div>
  )
}

// ── Trend Indicator ──

function TrendIndicator({ trend }: { trend: number }) {
  const isStable = Math.abs(trend) < 0.1
  const isDegrading = trend > 0.1
  const isImproving = trend < -0.1

  const color = isDegrading
    ? theme.status.critical
    : isImproving
    ? theme.status.ok
    : theme.text.muted

  const arrow = isDegrading ? '↑' : isImproving ? '↓' : '→'
  const sign = trend > 0 ? '+' : ''

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 0',
      }}
    >
      <span
        style={{
          fontSize: 22,
          color,
          textShadow: isStable ? 'none' : `0 0 8px ${color}80`,
          lineHeight: 1,
        }}
      >
        {arrow}
      </span>
      <span
        style={{
          fontFamily: "var(--f-body)",
          fontSize: 13,
          color: theme.text.secondary,
          letterSpacing: '0.03em',
        }}
      >
        тренд:{' '}
        <span
          style={{
            fontFamily: "Consolas, 'Lucida Console', monospace",
            fontWeight: 'bold',
            color,
            textShadow: isStable ? 'none' : `0 0 6px ${color}60`,
          }}
        >
          {sign}{trend.toFixed(1)}
        </span>
        <span style={{ color: theme.text.muted, marginLeft: 4 }}>очк/день</span>
      </span>
    </div>
  )
}

// ── Degradation Banner ──

function DegradationBanner({ detected }: { detected: boolean }) {
  if (detected) {
    return (
      <div
        style={{
          padding: '6px 12px',
          fontSize: 11,
          fontFamily: "var(--f-display)",
          fontWeight: 600,
          letterSpacing: '0.15em',
          color: theme.status.critical,
          background: `${theme.status.critical}10`,
          border: `1px solid ${theme.status.critical}30`,
          borderRadius: 2,
          textAlign: 'center',
          animation: 'pulse-critical 2s ease-in-out infinite',
          textShadow: `0 0 8px ${theme.status.critical}60`,
        }}
      >
        ОБНАРУЖЕНА ДЕГРАДАЦИЯ
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '6px 12px',
        fontSize: 11,
        fontFamily: "var(--f-display)",
        fontWeight: 600,
        letterSpacing: '0.15em',
        color: theme.status.ok,
        background: `${theme.status.ok}10`,
        border: `1px solid ${theme.status.ok}30`,
        borderRadius: 2,
        textAlign: 'center',
        textShadow: `0 0 6px ${theme.status.ok}40`,
      }}
    >
      СТАБИЛЬНОЕ СОСТОЯНИЕ
    </div>
  )
}

// ── Main Component ──

export function CUSUMChart({ degradation }: CUSUMChartProps) {
  // Empty state
  if (!degradation) {
    return (
      <GlassPanel>
        <div className="hud-header" style={{ marginBottom: 12 }}>
          CUSUM ДЕГРАДАЦИЯ
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 120,
            color: theme.text.muted,
            fontFamily: "var(--f-body)",
            fontSize: 13,
            letterSpacing: '0.1em',
          }}
        >
          Нет данных CUSUM
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel>
      {/* Header */}
      <div className="hud-header" style={{ marginBottom: 14 }}>
        CUSUM ДЕГРАДАЦИЯ
      </div>

      {/* 3 Arc Gauges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          gap: 4,
          marginBottom: 8,
        }}
      >
        {GAUGES.map((g) => (
          <ArcGauge key={g.key} term={degradation[g.key] ?? { alarm: false, cusum_value: 0, magnitude: 0 }} config={g} />
        ))}
      </div>

      {/* Trend Indicator */}
      <div
        style={{
          borderTop: '1px solid rgba(0,229,255,0.1)',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
          marginBottom: 10,
        }}
      >
        <TrendIndicator trend={degradation.trend_per_day} />
      </div>

      {/* Degradation Banner */}
      <DegradationBanner detected={degradation.degradation_detected} />
    </GlassPanel>
  )
}
