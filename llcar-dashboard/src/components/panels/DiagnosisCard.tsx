import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

// ── Interfaces ──

interface DiagnosticDetail {
  feature: string
  op: string
  threshold: number
  value: number
  matched: boolean
}

interface DiagnosticResult {
  name: string
  display: string
  confidence: number
  status: 'likely' | 'possible' | 'unlikely' | 'clear' | 'no_data'
  match_pct?: number
  details?: DiagnosticDetail[]
}

interface DegradationInfo {
  degradation_detected: boolean
  trend_per_day: number
  short_term: { alarm: boolean; cusum_value: number }
  medium_term: { alarm: boolean; cusum_value: number }
  long_term: { alarm: boolean; cusum_value: number }
}

interface DiagnosisCardProps {
  diagnostics: DiagnosticResult[]
  degradation?: DegradationInfo
  regime?: string
}

// ── Status colors ──

const STATUS_COLORS: Record<DiagnosticResult['status'], string> = {
  likely: '#FF1744',
  possible: '#FFAB00',
  unlikely: 'rgba(255,255,255,0.3)',
  clear: '#00E676',
  no_data: 'rgba(255,255,255,0.15)',
}

const STATUS_LABELS: Record<DiagnosticResult['status'], string> = {
  likely: 'ВЕРОЯТНО',
  possible: 'ВОЗМОЖНО',
  unlikely: 'МАЛОВЕРОЯТНО',
  clear: 'НОРМА',
  no_data: 'НЕТ ДАННЫХ',
}

// ── Segmented confidence bar ──

function ConfidenceBar({
  confidence,
  status,
  height = 10,
  gap = 2,
}: {
  confidence: number
  status: DiagnosticResult['status']
  height?: number
  gap?: number
}) {
  const color = STATUS_COLORS[status]
  const filledCount = Math.round(confidence / 10)

  return (
    <div style={{ display: 'flex', gap, alignItems: 'center', flex: 1 }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const filled = i < filledCount
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height,
              borderRadius: 1,
              backgroundColor: filled ? color : 'rgba(255,255,255,0.06)',
              boxShadow: filled ? `0 0 4px ${color}60` : 'none',
              transition: 'background-color 0.4s ease, box-shadow 0.4s ease',
            }}
          />
        )
      })}
    </div>
  )
}

// ── Status badge ──

function StatusBadge({ status }: { status: DiagnosticResult['status'] }) {
  const color = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]
  const isPulsing = status === 'likely'

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: 9,
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 600,
        letterSpacing: '0.1em',
        color,
        border: `1px solid ${color}50`,
        borderRadius: 2,
        background: `${color}12`,
        textShadow: `0 0 6px ${color}80`,
        whiteSpace: 'nowrap' as const,
        animation: isPulsing ? 'pulse-critical 2s ease-in-out infinite' : 'none',
      }}
    >
      {label}
    </span>
  )
}

// ── Trend arrow ──

function TrendArrow({ trend }: { trend: number }) {
  if (Math.abs(trend) < 0.05) {
    return <span style={{ fontSize: 18, color: theme.accent.cyan }}>→</span>
  }
  if (trend > 0) {
    return <span style={{ fontSize: 18, color: theme.status.critical }}>↑</span>
  }
  return <span style={{ fontSize: 18, color: theme.status.ok }}>↓</span>
}

// ── CUSUM alarm dot ──

function CusumDot({ alarm, label }: { alarm: boolean; label: string }) {
  const color = alarm ? theme.status.critical : theme.status.ok
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}, 0 0 12px ${color}40`,
          animation: alarm ? 'pulse-critical 1.5s infinite' : 'none',
        }}
      />
      <span
        style={{
          fontSize: 9,
          fontFamily: "'Rajdhani', sans-serif",
          color: theme.text.secondary,
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Main component ──

export function DiagnosisCard({ diagnostics, degradation, regime }: DiagnosisCardProps) {
  // Handle empty/null diagnostics
  if (!diagnostics || diagnostics.length === 0) {
    return (
      <GlassPanel>
        <div className="hud-header" style={{ marginBottom: 12 }}>
          АВТО-ДИАГНОСТИКА
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 80,
            color: theme.text.muted,
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 13,
            letterSpacing: '0.1em',
          }}
        >
          Нет данных диагностики
        </div>
      </GlassPanel>
    )
  }

  // Sort by confidence descending
  const sorted = [...diagnostics].sort((a, b) => b.confidence - a.confidence)
  const top = sorted[0]
  const rest = sorted.slice(1).filter((d) => d.confidence > 0)

  const topColor = STATUS_COLORS[top.status]

  return (
    <GlassPanel>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div className="hud-header">АВТО-ДИАГНОСТИКА</div>
        {regime && (
          <span
            style={{
              fontSize: 9,
              fontFamily: "'Orbitron', sans-serif",
              color: theme.accent.cyan,
              letterSpacing: '0.15em',
              opacity: 0.6,
              border: `1px solid ${theme.accent.cyan}30`,
              padding: '2px 6px',
              borderRadius: 2,
            }}
          >
            {regime.toUpperCase()}
          </span>
        )}
      </div>

      {/* Top diagnostic — prominent display */}
      <div
        style={{
          padding: '12px 14px',
          marginBottom: 14,
          background: `linear-gradient(135deg, ${topColor}08 0%, transparent 60%)`,
          borderLeft: `3px solid ${topColor}`,
          borderRadius: 2,
          boxShadow: `inset 0 0 20px ${topColor}06`,
        }}
      >
        {/* Name + badge row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: theme.text.primary,
              letterSpacing: '0.05em',
            }}
          >
            {top.display}
          </span>
          <StatusBadge status={top.status} />
        </div>

        {/* Confidence bar + percentage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ConfidenceBar confidence={top.confidence} status={top.status} height={12} gap={3} />
          <span
            style={{
              fontFamily: "Consolas, 'Lucida Console', monospace",
              fontSize: 14,
              fontWeight: 'bold',
              color: topColor,
              textShadow: `0 0 8px ${topColor}60`,
              minWidth: 40,
              textAlign: 'right' as const,
            }}
          >
            {top.confidence}%
          </span>
        </div>

        {/* Match percentage if available */}
        {top.match_pct !== undefined && (
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              fontFamily: "'Rajdhani', sans-serif",
              color: theme.text.muted,
              letterSpacing: '0.05em',
            }}
          >
            Совпадение условий:{' '}
            <span style={{ color: theme.text.secondary, fontFamily: "Consolas, monospace" }}>
              {top.match_pct}%
            </span>
          </div>
        )}
      </div>

      {/* Remaining diagnostics list */}
      {rest.length > 0 && (
        <div style={{ marginBottom: degradation ? 14 : 0 }}>
          <div
            style={{
              fontSize: 9,
              fontFamily: "'Orbitron', sans-serif",
              color: theme.text.muted,
              letterSpacing: '0.15em',
              marginBottom: 8,
            }}
          >
            ВСЕ ПРАВИЛА
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rest.map((diag) => {
              const dColor = STATUS_COLORS[diag.status]
              return (
                <div
                  key={diag.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 0',
                  }}
                >
                  {/* Status dot */}
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: dColor,
                      boxShadow: `0 0 4px ${dColor}80`,
                      flexShrink: 0,
                    }}
                  />

                  {/* Label */}
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 12,
                      color: theme.text.secondary,
                      letterSpacing: '0.03em',
                      minWidth: 120,
                      flexShrink: 0,
                    }}
                  >
                    {diag.display}
                  </span>

                  {/* Mini confidence bar */}
                  <ConfidenceBar confidence={diag.confidence} status={diag.status} height={6} gap={1} />

                  {/* Percentage */}
                  <span
                    style={{
                      fontFamily: "Consolas, 'Lucida Console', monospace",
                      fontSize: 11,
                      color: dColor,
                      minWidth: 32,
                      textAlign: 'right' as const,
                      flexShrink: 0,
                    }}
                  >
                    {diag.confidence}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Degradation section */}
      {degradation && (
        <div
          style={{
            borderTop: `1px solid rgba(0,229,255,0.1)`,
            paddingTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "'Orbitron', sans-serif",
              color: theme.text.muted,
              letterSpacing: '0.15em',
              marginBottom: 8,
            }}
          >
            ДЕГРАДАЦИЯ
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            {/* Trend arrow + value */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendArrow trend={degradation.trend_per_day} />
              <span
                style={{
                  fontFamily: "Consolas, 'Lucida Console', monospace",
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: degradation.trend_per_day > 0.05
                    ? theme.status.critical
                    : degradation.trend_per_day < -0.05
                    ? theme.status.ok
                    : theme.accent.cyan,
                  textShadow: degradation.trend_per_day > 0.05
                    ? `0 0 8px ${theme.status.critical}60`
                    : 'none',
                }}
              >
                {degradation.trend_per_day > 0 ? '+' : ''}
                {degradation.trend_per_day.toFixed(1)} pts/day
              </span>
            </div>

            {/* CUSUM alarm indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CusumDot alarm={degradation.short_term.alarm} label="S" />
              <CusumDot alarm={degradation.medium_term.alarm} label="M" />
              <CusumDot alarm={degradation.long_term.alarm} label="L" />
            </div>
          </div>

          {/* Degradation detected warning */}
          {degradation.degradation_detected && (
            <div
              style={{
                marginTop: 8,
                padding: '4px 8px',
                fontSize: 10,
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                color: theme.status.critical,
                background: `${theme.status.critical}10`,
                border: `1px solid ${theme.status.critical}30`,
                borderRadius: 2,
                letterSpacing: '0.05em',
                textAlign: 'center' as const,
                animation: 'pulse-critical 2s ease-in-out infinite',
              }}
            >
              ОБНАРУЖЕНА ДЕГРАДАЦИЯ
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  )
}
