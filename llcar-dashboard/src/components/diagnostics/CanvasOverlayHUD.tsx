import { useMemo } from 'react'

interface PidEntry {
  ts: string
  rpm: number
  speed: number
  coolant: number
  voltage: number
  engine_load: number
  throttle: number
  ltft: number
  stft: number
}

interface CanvasOverlayHUDProps {
  pids?: PidEntry[]
}

function tempColor(t: number): string {
  if (t < 95) return '#00e676'
  if (t <= 105) return '#ffb800'
  return '#ff1744'
}

function voltColor(v: number): string {
  if (v >= 13.2 && v <= 14.8) return '#00e676'
  if (v >= 12.5 && v <= 15.2) return '#ffb800'
  return '#ff1744'
}

function MiniSparkline({ data, color = '#00e5ff', width = 80, height = 20 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
    </svg>
  )
}

export function CanvasOverlayHUD({ pids }: CanvasOverlayHUDProps) {
  const latest = pids && pids.length > 0 ? pids[pids.length - 1] : null
  const rpmHistory = useMemo(() => (pids || []).slice(-60).map(p => p.rpm), [pids])

  if (!latest) return null

  const cardStyle: React.CSSProperties = {
    pointerEvents: 'auto',
    background: 'rgba(6,18,30,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: 4,
    padding: '4px 8px',
    minWidth: 70,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 8,
    fontFamily: "'Rajdhani', sans-serif",
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    lineHeight: 1,
    marginBottom: 2,
  }

  const valueStyle = (color: string): React.CSSProperties => ({
    fontSize: 14,
    fontFamily: "'Share Tech Mono', monospace",
    color,
    lineHeight: 1.2,
    textShadow: `0 0 6px ${color}40`,
  })

  return (
    <div className="canvas-overlay-hud" style={{
      position: 'absolute',
      top: 48,
      right: 8,
      zIndex: 20,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      {/* RPM + sparkline */}
      {latest.rpm != null && <div style={cardStyle}>
        <div style={labelStyle}>RPM</div>
        <div style={valueStyle('#00e5ff')}>{Math.round(latest.rpm)}</div>
        <MiniSparkline data={rpmHistory} color="#00e5ff" width={70} height={16} />
      </div>}

      {/* Coolant Temp */}
      {latest.coolant != null && <div style={cardStyle}>
        <div style={labelStyle}>Т° ОЖ</div>
        <div style={valueStyle(tempColor(latest.coolant))}>
          {latest.coolant.toFixed(1)}°C
        </div>
      </div>}

      {/* Voltage */}
      {latest.voltage != null && <div style={cardStyle}>
        <div style={labelStyle}>Напряжение</div>
        <div style={valueStyle(voltColor(latest.voltage))}>
          {latest.voltage.toFixed(1)}V
        </div>
      </div>}

      {/* Throttle — fill bar */}
      {latest.throttle != null && <div style={cardStyle}>
        <div style={labelStyle}>Газ</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, latest.throttle)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00e5ff, #64ffda)',
              borderRadius: 3,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 10, fontFamily: "'Share Tech Mono', monospace", color: '#00e5ff', minWidth: 28, textAlign: 'right' }}>
            {Math.round(latest.throttle)}%
          </span>
        </div>
      </div>}
    </div>
  )
}
