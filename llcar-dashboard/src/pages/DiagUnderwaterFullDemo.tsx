import { useMemo } from 'react'

const PALETTE = {
  deepBlue:  '#021528',
  cobalt:    '#0a4a6e',
  azure:     '#1a5a8a',
  surface:   '#6ab5ff',
  cyan:      '#6a9eff',
  white:     '#eef4fb',
  warmCoral: '#e8a878',
  warnAmber: '#f2c480',
}

const glass = {
  background: 'rgba(10,40,70,0.35)',
  backdropFilter: 'blur(16px) saturate(140%)',
  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 8,
} as const

// Mini sparkline SVG inline
function Sparkline({ color, width = 48, height = 14 }: { color: string; width?: number; height?: number }) {
  const pts = useMemo(() => {
    const ys = Array.from({ length: 6 }, (_, i) => Math.sin(i * 0.9 + Math.random()) * 0.4 + 0.5)
    return ys.map((y, i) => `${(i / 5) * width},${height - y * height}`).join(' ')
  }, [width, height])
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  )
}

function Bubbles({ count = 28 }: { count?: number }) {
  const bubbles = useMemo(() =>
    Array.from({ length: count }).map(() => ({
      x: Math.random() * 100,
      size: Math.random() * 5 + 2,
      delay: Math.random() * 12,
      duration: Math.random() * 10 + 14,
      opacity: Math.random() * 0.4 + 0.2,
    })), [count])
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${b.x}%`,
          bottom: -20,
          width: b.size,
          height: b.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.white}, transparent 70%)`,
          opacity: b.opacity,
          boxShadow: `0 0 ${b.size * 2}px ${PALETTE.surface}80`,
          animation: `bubbleRise ${b.duration}s linear ${b.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

// DataDot — coloured 6px circle
function DataDot({ status }: { status: 'crit' | 'warn' | 'ok' }) {
  const color = status === 'crit' ? PALETTE.warmCoral : status === 'warn' ? PALETTE.warnAmber : PALETTE.surface
  return (
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      flexShrink: 0,
      marginTop: 3,
    }} />
  )
}

const DIAGNOSES: Array<{
  title: string
  status: 'crit' | 'warn' | 'ok'
  pct: number
  evidence: string[]
  repair: string
  price: string
}> = [
  {
    title: 'Риск перегрева',
    status: 'crit',
    pct: 72,
    evidence: ['Coolant 104 °C', 'Speed 8 km/h'],
    repair: 'Проверить термостат',
    price: '5–8 тыс₽',
  },
  {
    title: 'Люфт подвески',
    status: 'warn',
    pct: 48,
    evidence: ['Accel Z σ = 0.42'],
    repair: 'Заменить амортизаторы',
    price: '12–18 тыс₽',
  },
  {
    title: 'Разряжен АКБ',
    status: 'ok',
    pct: 32,
    evidence: ['U bat 11.8 V при старте'],
    repair: 'Проверить генератор',
    price: '3–5 тыс₽',
  },
]

const TELEMETRY: Array<{ label: string; value: string }> = [
  { label: 'RPM',      value: '1200' },
  { label: 'Coolant',  value: '104' },
  { label: 'Speed',    value: '8' },
  { label: 'Throttle', value: '35%' },
  { label: 'Battery',  value: '11.8' },
  { label: 'O2',       value: '0.85' },
  { label: 'Accel Z',  value: '0.42' },
]

const TABS: Array<{ label: string; score: number | null }> = [
  { label: 'ОБЗОР',    score: null },
  { label: 'ПОДВЕСКА', score: 82 },
  { label: 'ДВС',      score: 74 },
  { label: 'ЭЛЕК',     score: 91 },
  { label: 'АУДИО',    score: null },
]

const TIME_PILLS = ['12Ч', '24Ч', '7Д', '30Д']

// Hotspot positions around a circle (degrees: top, right, bottom, left)
const HOTSPOT_ANGLES = [270, 0, 90, 180]

export function DiagUnderwaterFullDemo() {
  const BG_URL = `${import.meta.env.BASE_URL}luma-refs/nebula-underwater-v1-a.jpg`

  return (
    <div style={{
      position: 'fixed', inset: 0,
      overflow: 'hidden',
      fontFamily: 'var(--f-body), system-ui, sans-serif',
      color: PALETTE.white,
      backgroundColor: PALETTE.deepBlue,
    }}>
      <style>{`
        @keyframes bubbleRise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: var(--o, 0.4); }
          100% { transform: translateY(-110vh) translateX(40px); opacity: 0; }
        }
        @keyframes causticShift {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50%      { opacity: 0.55; transform: translateY(-8px); }
        }
        @keyframes hotspotPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${PALETTE.surface}60, 0 0 8px ${PALETTE.surface}80; }
          50%      { box-shadow: 0 0 0 5px ${PALETTE.surface}20, 0 0 14px ${PALETTE.surface}aa; }
        }
      `}</style>

      {/* Layer 1 — photo background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'saturate(1.1) brightness(0.92)',
      }} />

      {/* Layer 2 — vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(2,21,40,0.35) 70%, rgba(2,21,40,0.8) 100%),
          linear-gradient(180deg, rgba(2,21,40,0.1) 0%, rgba(2,21,40,0.0) 35%, rgba(2,21,40,0.4) 85%, rgba(2,21,40,0.75) 100%)
        `,
      }} />

      {/* Layer 3 — caustics */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${PALETTE.surface}25 0%, transparent 55%)`,
        mixBlendMode: 'screen',
        animation: 'causticShift 9s ease-in-out infinite',
      }} />

      {/* Layer 4 — bubbles */}
      <Bubbles count={32} />

      {/* ─── UI LAYER ────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>

        {/* ── TOP STATUS BAR ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 44,
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '0 18px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(2,21,40,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>

          {/* CAN DRIVE pill */}
          <div style={{
            padding: '6px 12px',
            border: `1px solid ${PALETTE.surface}`,
            borderRadius: 20,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: PALETTE.surface,
            background: `${PALETTE.surface}15`,
            whiteSpace: 'nowrap',
          }}>
            CAN DRIVE
          </div>

          {/* Health score hero */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, minWidth: 38 }}>
            <span style={{ fontFamily: 'var(--f-display)', fontSize: 22, color: PALETTE.white, lineHeight: 1 }}>78</span>
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: PALETTE.cyan, marginTop: 2 }}>HEALTH</span>
          </div>

          {/* Trend arrow */}
          <span style={{ fontSize: 16, color: PALETTE.warmCoral, lineHeight: 1 }}>↑</span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Time pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {TIME_PILLS.map(tp => {
              const active = tp === '24Ч'
              return (
                <div key={tp} style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 10,
                  fontFamily: 'var(--f-mono)',
                  letterSpacing: '0.08em',
                  color: active ? PALETTE.white : `${PALETTE.white}80`,
                  background: active ? `${PALETTE.surface}25` : 'transparent',
                  border: active ? `1px solid ${PALETTE.surface}` : '1px solid rgba(255,255,255,0.15)',
                }}>
                  {tp}
                </div>
              )
            })}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.14em', color: `${PALETTE.white}70` }}>
              ОНЛАЙН
            </span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: `${PALETTE.white}60` }}>
              17.04.2026
            </span>
            <div style={{
              padding: '3px 8px', borderRadius: 10,
              border: `1px solid ${PALETTE.surface}80`,
              background: `${PALETTE.surface}15`,
              fontSize: 9, fontFamily: 'var(--f-mono)',
              color: PALETTE.surface, letterSpacing: '0.1em',
            }}>
              БАЗА ✓
            </div>
            <div style={{
              padding: '3px 8px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              fontSize: 9, fontFamily: 'var(--f-mono)',
              color: `${PALETTE.white}c0`, letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              LEXUS LX570 <span style={{ color: `${PALETTE.white}50` }}>✕</span>
            </div>
          </div>
        </div>

        {/* ── SYSTEM TAB ROW ── */}
        <div style={{
          position: 'absolute', top: 56, left: 18,
          display: 'flex', gap: 6,
        }}>
          {TABS.map((tab, idx) => {
            const active = idx === 0
            return (
              <div key={tab.label} style={{
                width: 90, height: 56,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${active ? PALETTE.surface : 'rgba(255,255,255,0.14)'}`,
                background: active ? `${PALETTE.surface}20` : 'rgba(2,21,40,0.45)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', justifyContent: 'space-between',
                cursor: 'default',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: active ? PALETTE.surface : `${PALETTE.white}40`,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 9, textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: active ? PALETTE.surface : `${PALETTE.white}80`,
                    fontFamily: 'var(--f-body)',
                    overflow: 'hidden', whiteSpace: 'nowrap',
                  }}>
                    {tab.label}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, color: PALETTE.white, lineHeight: 1 }}>
                  {tab.score !== null ? tab.score : '—'}
                </div>
                <Sparkline color={PALETTE.surface} width={66} height={8} />
              </div>
            )
          })}
        </div>

        {/* ── 3D TWIN PLACEHOLDER (centred) ── */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 640, height: 480,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* radial glow backdrop */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(26,90,138,0.25) 0%, transparent 70%)',
            borderRadius: 24,
          }} />

          {/* Dashed circle imitating car outline */}
          <div style={{
            position: 'absolute',
            width: 360, height: 360,
            borderRadius: '50%',
            border: `1px dashed ${PALETTE.surface}60`,
          }} />

          {/* Hotspots around circle */}
          {HOTSPOT_ANGLES.map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const r = 180
            const cx = Math.cos(rad) * r
            const cy = Math.sin(rad) * r
            return (
              <div key={i} style={{
                position: 'absolute',
                width: 10, height: 10,
                borderRadius: '50%',
                background: PALETTE.surface,
                left: `calc(50% + ${cx}px - 5px)`,
                top: `calc(50% + ${cy}px - 5px)`,
                animation: `hotspotPulse 2.4s ease-in-out ${i * 0.6}s infinite`,
              }} />
            )
          })}

          {/* Centre label */}
          <div style={{
            position: 'relative', zIndex: 1,
            fontFamily: 'var(--f-mono)', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.22em',
            color: PALETTE.cyan,
            textShadow: `0 0 16px ${PALETTE.cyan}aa`,
          }}>
            3D TWIN · LEXUS LX570
          </div>
        </div>

        {/* ── RIGHT COLUMN — DIAGNOSES FEED ── */}
        <div style={{
          position: 'absolute', top: 56, right: 18,
          width: 300,
        }}>
          {/* Header */}
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: 9,
            textTransform: 'uppercase', letterSpacing: '0.28em',
            color: PALETTE.warmCoral,
            textShadow: `0 0 10px ${PALETTE.warmCoral}80`,
            marginBottom: 10,
          }}>
            ДИАГНОЗЫ · 3
          </div>

          {DIAGNOSES.map((d) => {
            const statusColor = d.status === 'crit' ? PALETTE.warmCoral : d.status === 'warn' ? PALETTE.warnAmber : PALETTE.surface
            const statusLabel = d.status === 'crit' ? 'CRIT' : d.status === 'warn' ? 'WARN' : 'OK'
            return (
              <div key={d.title} style={{
                ...glass,
                padding: 10,
                marginBottom: 8,
              }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 4 }}>
                  <DataDot status={d.status} />
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: PALETTE.white,
                      fontFamily: 'var(--f-body)',
                    }}>
                      {d.title}
                    </span>
                    <span style={{
                      fontFamily: 'var(--f-mono)', fontSize: 9,
                      color: statusColor, marginLeft: 6,
                      letterSpacing: '0.1em',
                    }}>
                      {statusLabel} {d.pct}%
                    </span>
                  </div>
                </div>

                {/* Evidence */}
                <div style={{
                  fontSize: 10, fontFamily: 'var(--f-body)',
                  color: `${PALETTE.white}cc`,
                  lineHeight: 1.4,
                  marginBottom: 6,
                  paddingLeft: 13,
                }}>
                  {d.evidence.join(' · ')}
                </div>

                {/* Repair row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  paddingLeft: 13,
                }}>
                  <span style={{
                    fontSize: 8, fontFamily: 'var(--f-body)',
                    textTransform: 'uppercase', letterSpacing: '0.14em',
                    color: PALETTE.warmCoral,
                  }}>
                    РЕМОНТ
                  </span>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--f-body)',
                    color: `${PALETTE.white}b0`, flex: 1,
                  }}>
                    {d.repair}
                  </span>
                  <div style={{
                    fontFamily: 'var(--f-mono)', fontSize: 9,
                    padding: '2px 7px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.06)',
                    color: `${PALETTE.white}c0`,
                    whiteSpace: 'nowrap',
                  }}>
                    {d.price}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── BOTTOM TELEMETRY RIBBON ── */}
        <div style={{
          position: 'absolute', bottom: 18, left: 18, right: 338,
          height: 72,
          display: 'flex', gap: 0,
          borderTop: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'rgba(10,40,70,0.3)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          {TELEMETRY.map((cell, idx) => (
            <div key={cell.label} style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 10,
              borderRight: idx < TELEMETRY.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <span style={{
                fontSize: 8, textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: PALETTE.surface,
                fontFamily: 'var(--f-body)',
                lineHeight: 1,
              }}>
                {cell.label}
              </span>
              <span style={{
                fontFamily: 'var(--f-display)', fontSize: 16,
                color: PALETTE.white, lineHeight: 1,
              }}>
                {cell.value}
              </span>
              <Sparkline color={PALETTE.surface} width={40} height={12} />
            </div>
          ))}
        </div>

        {/* Demo watermark */}
        <div style={{
          position: 'absolute', bottom: 6, right: 18,
          fontFamily: 'var(--f-mono)', fontSize: 9,
          letterSpacing: '0.16em', color: `${PALETTE.white}40`,
          textTransform: 'uppercase',
        }}>
          /diag-underwater-full · mockup
        </div>
      </div>
    </div>
  )
}

export default DiagUnderwaterFullDemo
