import React from 'react'
import { theme } from '../../theme'

// ── Constants ──
const COLORS = {
  bg: 'var(--bg-primary)',
  border: 'var(--border-glow)',
  accent: 'var(--accent-cyan)',
  accentDim: 'var(--border-glow)',
  text: 'var(--text-primary)',
  textDim: 'var(--text-secondary)',
}

const CHAMFER = 'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)'

// ── Screw dot ──
function Screw({ top, bottom, left, right }: { top?: string; bottom?: string; left?: string; right?: string }) {
  return (
    <div style={{
      position: 'absolute', top, bottom, left, right,
      width: 8, height: 8, borderRadius: '50%',
      background: 'var(--bg-primary)', border: `1px solid ${COLORS.accent}`,
      boxShadow: `0 0 6px ${COLORS.accent}, inset 0 0 2px ${COLORS.accent}`,
      zIndex: 20,
    }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 3, height: 3, borderRadius: '50%', background: COLORS.accent, boxShadow: `0 0 4px ${COLORS.accent}` }} />
    </div>
  )
}

// ── Base panel ──
function Panel({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      position: 'relative', backgroundColor: COLORS.bg, clipPath: CHAMFER,
      border: `1px solid ${COLORS.border}`,
      boxShadow: `0 0 20px rgba(0,229,255,0.08), inset 0 0 30px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.5)`,
      overflow: 'hidden', height: 160, ...style,
    }}>
      <Screw top="8px" left="8px" />
      <Screw top="8px" right="8px" />
      <Screw bottom="8px" left="8px" />
      <Screw bottom="8px" right="8px" />
      {/* L-shaped corner brackets */}
      <svg style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, zIndex: 20 }} viewBox="0 0 20 20">
        <path d="M0 0 H16 V3 M0 0 V16 H3" stroke="var(--accent-cyan, #00E5FF)" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
      <svg style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, zIndex: 20 }} viewBox="0 0 20 20">
        <path d="M20 0 H4 V3 M20 0 V16 H17" stroke="var(--accent-cyan, #00E5FF)" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
      <svg style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, zIndex: 20 }} viewBox="0 0 20 20">
        <path d="M0 20 H16 V17 M0 20 V4 H3" stroke="var(--accent-cyan, #00E5FF)" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
      <svg style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, zIndex: 20 }} viewBox="0 0 20 20">
        <path d="M20 20 H4 V17 M20 20 V4 H17" stroke="var(--accent-cyan, #00E5FF)" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
      {/* Glass reflection */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, var(--glass-border-top) 0%, transparent 40%)', pointerEvents: 'none', zIndex: 10, opacity: 0.4 }} />
      <div style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', padding: 12 }}>
        {children}
      </div>
    </div>
  )
}

// ── Sparkline ──
function Sparkline({ width = 90, height = 28, color = COLORS.accent }: { width?: number; height?: number; color?: string }) {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const x = (i / 19) * width
    const y = height - (Math.sin(i * 0.7 + 1) * 0.4 + 0.5) * (height - 4) - 2
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={`${pts} L ${width} ${height} L 0 ${height} Z`} fill={`${color}25`} />
      <path d={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color})` }} />
    </svg>
  )
}

// ── Circular gauge SVG ──
function GaugeSVG({ value, max, size, label }: { value: number; max: number; size: number; label?: string }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38
  const pct = Math.min(value / max, 1)
  const circ = r * Math.PI * 1.5 // 270 degrees
  const offset = circ * (1 - pct)

  // Ticks
  const ticks = []
  for (let i = 0; i <= 24; i++) {
    const a = (135 + i * 270 / 24) * Math.PI / 180
    const major = i % 3 === 0
    const r1 = r + 2, r2 = r + (major ? 8 : 5)
    ticks.push(
      <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
        stroke={major ? COLORS.accent : COLORS.accentDim} strokeWidth={major ? 1.5 : 0.8} opacity="0.7" />
    )
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.accentDim} strokeWidth="6"
        strokeDasharray={`${circ} ${circ * 0.33}`} strokeLinecap="butt" transform={`rotate(135 ${cx} ${cy})`} />
      {/* Fill */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.accent} strokeWidth="6"
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`} style={{ filter: `drop-shadow(0 0 6px ${COLORS.accent}) drop-shadow(0 0 12px ${COLORS.accent}40)`, transition: 'stroke-dashoffset 0.5s ease' }} />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={r - 10} fill="none" stroke={COLORS.accentDim} strokeWidth="0.8" strokeDasharray="2 4" />
      {/* Ticks */}
      {ticks}
      {/* Center value */}
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary, #fff)" fontSize={size * 0.2}
        fontFamily="Consolas, 'Lucida Console', monospace" fontWeight="bold">{value}</text>
      {label && <text x={cx} y={cy + size * 0.12} textAnchor="middle" fill={COLORS.textDim} fontSize="10"
        fontFamily="var(--f-display)" letterSpacing="2">{label}</text>}
    </svg>
  )
}

// ── Equalizer bars ──
function Equalizer({ active, total = 18 }: { active: number; total?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 36, padding: 4, background: 'rgba(0,0,0,0.15)', borderRadius: 2, border: `1px solid ${COLORS.accentDim}` }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 5, height: '100%', borderRadius: i < active ? '2px 2px 0 0' : 1,
          background: i < active ? `linear-gradient(to top, ${COLORS.accent} 0%, ${COLORS.accentDim} 100%)` : COLORS.accentDim,
          opacity: i < active ? 0.9 : 0.3,
          boxShadow: i < active ? `0 0 3px ${COLORS.accent}` : 'none',
        }} />
      ))}
    </div>
  )
}

// ════════════════════════════════════════
// EXPORTED PANELS
// ════════════════════════════════════════

export function RPMPanel({ value }: { value: number }) {
  return (
    <Panel style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <div style={{ flex: '0 0 45%', display: 'flex', justifyContent: 'center' }}>
          <GaugeSVG value={value} max={8000} size={120} label="об/мин" />
        </div>
        <div style={{ flex: 1, paddingLeft: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, color: COLORS.text, letterSpacing: 2, fontFamily: "var(--f-display)", marginBottom: 4 }}>ОБОРОТЫ</div>
          <div style={{ fontSize: 34, color: COLORS.text, fontFamily: "Consolas, monospace", fontWeight: 'bold', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 9, color: COLORS.textDim, fontFamily: "Consolas, monospace", marginTop: 2 }}>об/мин</div>
          <div style={{ marginTop: 8, opacity: 0.8 }}><Sparkline /></div>
        </div>
      </div>
    </Panel>
  )
}

export function SpeedPanel({ value }: { value: number }) {
  return (
    <Panel style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: `1px solid ${COLORS.accentDim}`, paddingRight: 10 }}>
          <div style={{ fontSize: 9, color: COLORS.accent, letterSpacing: 2, marginBottom: 6, opacity: 0.7 }}>
            <span style={{ border: '1px solid currentColor', padding: '1px 4px', fontSize: 7, marginRight: 4 }}>OBD-II</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: 1, marginBottom: 4 }}>СКОРОСТЬ</div>
          <Equalizer active={Math.round((value / 200) * 18)} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: COLORS.accent, letterSpacing: 3, fontWeight: 'bold', textShadow: `0 0 10px ${COLORS.accent}`, fontFamily: "var(--f-display)" }}>СКОРОСТЬ</div>
          <div style={{ fontSize: 48, color: COLORS.text, fontFamily: "Consolas, monospace", fontWeight: 'bold', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: COLORS.textDim, fontFamily: "var(--f-display)", letterSpacing: 1 }}>км/ч</div>
        </div>
      </div>
    </Panel>
  )
}

export function CoolantVoltagePanel({ coolant }: { coolant: number; voltage?: number }) {
  const coolColor = coolant > 100 ? theme.status.critical : coolant > 95 ? theme.status.warning : COLORS.accent
  return (
    <Panel style={{ borderTop: `2px solid ${COLORS.accentDim}`, borderLeft: `3px solid ${coolColor}` }}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <div style={{ flex: '0 0 45%', display: 'flex', justifyContent: 'center' }}>
          <GaugeSVG value={coolant} max={120} size={120} label="°C" />
        </div>
        <div style={{ flex: 1, paddingLeft: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, color: COLORS.text, letterSpacing: 2, fontFamily: "var(--f-display)", marginBottom: 4 }}>ТЕМП. ОЖ</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 34, color: coolColor, fontFamily: "Consolas, monospace", fontWeight: 'bold', lineHeight: 1, textShadow: `0 0 10px ${coolColor}44` }}>{coolant}</span>
            <span style={{ fontSize: 14, color: COLORS.textDim }}>°C</span>
          </div>
          <div style={{ fontSize: 9, color: COLORS.textDim, marginTop: 2 }}>норма: 80-95°C</div>
          <div style={{ marginTop: 6, opacity: 0.7 }}><Sparkline width={90} height={20} color={coolColor} /></div>
        </div>
      </div>
    </Panel>
  )
}

export function VibrationPanel({ value, onClick }: { value: number; onClick?: () => void }) {
  const color = value > 10 ? theme.status.critical : value > 5 ? theme.status.warning : COLORS.accent
  return (
    <Panel style={{ borderBottom: `2px solid ${color}33`, borderLeft: `3px solid ${color}`, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <div style={{ flex: '0 0 40%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* Animated vibration bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 70 }}>
            {[0.5, 0.8, 1.0, 0.7, 0.9, 0.6, 0.85, 0.55, 0.75].map((h, i) => {
              const barColor = value > 0 ? (i < 3 ? COLORS.accent : i < 6 ? 'var(--status-warning, #FFAB00)' : 'var(--status-critical, #FF1744)') : color
              return (
                <div key={i} style={{
                  width: 5, borderRadius: 2, minHeight: 4,
                  height: `${h * (25 + value * 3)}%`,
                  backgroundColor: barColor,
                  boxShadow: `0 0 5px ${barColor}`,
                  animation: `vibBar 0.8s ease-in-out ${i * 0.07}s infinite alternate`,
                  transition: 'height 0.3s ease',
                }} />
              )
            })}
          </div>
          <style>{`@keyframes vibBar { from { transform: scaleY(0.6); } to { transform: scaleY(1.4); } }`}</style>
        </div>
        <div style={{ flex: 1, paddingLeft: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: COLORS.text, letterSpacing: 2, fontFamily: "var(--f-display)", marginBottom: 4 }}>ВИБРАЦИЯ</div>
          <div style={{ fontSize: 34, color, fontFamily: "Consolas, monospace", fontWeight: 'bold', lineHeight: 1, textShadow: `0 0 10px ${color}44` }}>
            {value.toFixed(1)}
          </div>
          <div style={{ fontSize: 9, color: COLORS.textDim, marginTop: 2 }}>м/с²</div>
          <div style={{ fontSize: 8, color: `${color}66`, marginTop: 6 }}>нажмите для деталей →</div>
        </div>
      </div>
    </Panel>
  )
}

// ── Legacy compat wrapper ──
interface InstrumentCardProps {
  label: string; value: number | string; unit: string; max?: number
  type?: 'gauge' | 'simple' | 'vibration'; severity?: 'ok' | 'warning' | 'critical'
  onClick?: () => void; labelDivider?: number; majorTicks?: number
}
export function InstrumentCard(props: InstrumentCardProps) {
  // Fallback - shouldn't be used anymore but keeps imports working
  return <RPMPanel value={typeof props.value === 'number' ? props.value : 0} />
}
