// src/components/three/FloatingMetrics.tsx
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'

interface FloatingMetricsProps {
  speed: number
  rpm: number
  coolant: number
  vibration: number
  suspSeverity: number
  onVibrationClick?: () => void
}

// Utility functions
const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
  const s = polarToCartesian(cx, cy, r, end)
  const e = polarToCartesian(cx, cy, r, start)
  const large = end - start <= 180 ? '0' : '1'
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`
}

const valueToAngle = (val: number, min: number, max: number, startA: number, endA: number) => {
  const pct = Math.max(0, Math.min(1, (val - min) / (max - min)))
  return startA + (endA - startA) * pct
}

// SVG Circular Gauge
function SvgGauge({ value, min, max, unit, color, size = 180, labelDivider = 1, majorTicks = 5 }: {
  value: number; min: number; max: number; unit: string; color: string; size?: number; labelDivider?: number; majorTicks?: number
}) {
  const cx = size / 2, cy = size / 2
  const r = size * 0.4
  const startA = 135, endA = 405
  const valAngle = valueToAngle(value, min, max, startA, endA)
  const majorCount = majorTicks

  const glowId = `glow-${unit.replace(/[^a-zA-Z0-9]/g, '')}`
  const glassId = `glassRef-${unit.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div style={{ width: size, height: size, filter: `drop-shadow(0 0 12px ${color}44)` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id={glassId}>
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
          </radialGradient>
        </defs>

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="#1a1a28" strokeWidth="3" />
        {/* Face */}
        <circle cx={cx} cy={cy} r={r} fill="rgba(5,8,12,0.9)" stroke="#2a2a3a" strokeWidth="1.5" />
        {/* Glass reflection */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${glassId})`} opacity="0.3" />

        {/* Background arc */}
        <path d={describeArc(cx, cy, r * 0.85, startA, endA)} fill="none" stroke="#1a2030" strokeWidth={size * 0.035} strokeLinecap="round" />
        {/* Fill arc */}
        {valAngle > startA && (
          <path
            d={describeArc(cx, cy, r * 0.85, startA, valAngle)}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.035}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            opacity="0.85"
          />
        )}

        {/* Tick marks + numbers */}
        {Array.from({ length: majorCount }).map((_, i) => {
          const a = startA + ((endA - startA) * i) / (majorCount - 1)
          const p1 = polarToCartesian(cx, cy, r * 0.7, a)
          const p2 = polarToCartesian(cx, cy, r * 0.82, a)
          const pLabel = polarToCartesian(cx, cy, r * 0.58, a)
          const tickVal = Math.round(min + ((max - min) * i) / (majorCount - 1))
          const displayVal = labelDivider > 1 ? Math.round(tickVal / labelDivider) : tickVal
          return (
            <g key={i}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#6688aa" strokeWidth="1" strokeLinecap="round" />
              <text x={pLabel.x} y={pLabel.y} textAnchor="middle" dominantBaseline="middle" fill="#8899aa" fontSize={size * 0.05} fontFamily="Consolas, 'Lucida Console', monospace">{displayVal}</text>
            </g>
          )
        })}

        {/* Minor ticks */}
        {Array.from({ length: (majorCount - 1) * 4 }).map((_, i) => {
          if (i % 4 === 0) return null
          const a = startA + ((endA - startA) * i) / ((majorCount - 1) * 4)
          const p1 = polarToCartesian(cx, cy, r * 0.76, a)
          const p2 = polarToCartesian(cx, cy, r * 0.82, a)
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#445566" strokeWidth="0.8" />
        })}

        {/* Center display */}
        <circle cx={cx} cy={cy} r={size * 0.2} fill="#030306" stroke="#2a3040" strokeWidth="1" />
        <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={size * 0.15} fontFamily="Consolas, 'Lucida Console', Monaco, monospace" fontWeight="bold">{Math.round(value)}</text>
        <text x={cx} y={cy + size * 0.1} textAnchor="middle" fill="#6688aa" fontSize={size * 0.04} fontFamily="Consolas, 'Lucida Console', monospace" letterSpacing="1">{unit}</text>

        {/* Needle */}
        <g transform={`rotate(${valAngle}, ${cx}, ${cy})`}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.65} stroke="#fff" strokeWidth="2" strokeLinecap="round" filter={`url(#${glowId})`} />
          <circle cx={cx} cy={cy} r={size * 0.025} fill="#334455" />
        </g>

        {/* Corner bolts */}
        {[45, 135, 225, 315].map((a, i) => {
          const p = polarToCartesian(cx, cy, r + 5, a)
          return <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#556677" stroke="#334455" strokeWidth="0.8" />
        })}
      </svg>
    </div>
  )
}

// Temperature display with mini chart
function TempDisplay({ value, color }: { value: number; color: string }) {
  return (
    <div style={{
      padding: '6px 14px',
      background: 'rgba(8,14,22,0.75)',
      backdropFilter: 'blur(8px)',
      borderRadius: 4,
      border: `1px solid ${color}33`,
      borderTop: `1px solid ${color}55`,
      boxShadow: `0 0 12px ${color}10`,
      textAlign: 'center' as const,
      pointerEvents: 'none' as const,
    }}>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 8, color: `${color}88`, letterSpacing: '0.15em', marginBottom: 3 }}>ТЕМП. ОЖ</div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 22, color: '#fff', textShadow: `0 0 8px ${color}88`, lineHeight: 1 }}>{value}<span style={{ fontSize: 11, color: `${color}88` }}>°C</span></div>
    </div>
  )
}

// Tether line component
function Tether({ from, to, color = '#00E5FF' }: { from: [number, number, number]; to: [number, number, number]; color?: string }) {
  return (
    <>
      <Line points={[from, to]} color={color} lineWidth={1} dashed dashSize={0.1} gapSize={0.06} transparent opacity={0.35} />
      <mesh position={from}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </>
  )
}

// Mini 3D Accelerometer Scatter Cloud
function MiniAccelCloud({ position, vibration, severity, onClick }: {
  position: [number, number, number]
  vibration: number
  severity: number
  onClick?: () => void
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const color = severity > 0.7 ? '#FF1744' : severity > 0.3 ? '#FFAB00' : '#00E5FF'

  // Generate scatter points simulating vibration cloud
  const { positions, colors } = useMemo(() => {
    const count = 200
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Gaussian-like distribution, spread proportional to vibration
      const spread = 0.3 + vibration * 0.05
      const x = (Math.random() - 0.5) * spread * 2
      const y = (Math.random() - 0.5) * spread * 2
      const z = (Math.random() - 0.5) * spread * 2

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      // Color intensity by distance from center (brighter = further = worse)
      const dist = Math.sqrt(x*x + y*y + z*z)
      const intensity = Math.min(dist / spread, 1)
      const pointColor = new THREE.Color().lerpColors(
        new THREE.Color('#00E5FF'),
        new THREE.Color(severity > 0.5 ? '#FF1744' : '#FFAB00'),
        intensity
      )
      col[i * 3] = pointColor.r
      col[i * 3 + 1] = pointColor.g
      col[i * 3 + 2] = pointColor.b
    }
    return { positions: pos, colors: col }
  }, [vibration, severity])

  // Slow rotation
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.elapsedTime * 0.3
      pointsRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Wireframe sphere (normal zone envelope) */}
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.08} />
      </mesh>

      {/* Center point (ideal = zero vibration) */}
      <mesh>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} />
      </mesh>

      {/* Scatter cloud */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Axis lines */}
      <Line points={[[-0.4, 0, 0], [0.4, 0, 0]]} color="#ef4444" lineWidth={1} transparent opacity={0.3} />
      <Line points={[[0, -0.4, 0], [0, 0.4, 0]]} color="#4ade80" lineWidth={1} transparent opacity={0.3} />
      <Line points={[[0, 0, -0.4], [0, 0, 0.4]]} color="#60a5fa" lineWidth={1} transparent opacity={0.3} />

      {/* Value label */}
      <Html position={[0, -0.5, 0]} center distanceFactor={10} zIndexRange={[1, 0]}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 14,
          color: color,
          textShadow: `0 0 6px ${color}88`,
          textAlign: 'center',
          background: 'rgba(8,16,28,0.7)',
          padding: '4px 10px',
          borderRadius: 4,
          border: `1px solid ${color}33`,
          whiteSpace: 'nowrap',
          pointerEvents: 'auto',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={onClick}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = `${color}88`; (e.target as HTMLElement).style.boxShadow = `0 0 16px ${color}44` }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = `${color}33`; (e.target as HTMLElement).style.boxShadow = 'none' }}
        >
          <div style={{ fontSize: 9, color: `${color}88`, letterSpacing: '0.15em', fontFamily: "'Orbitron', sans-serif" }}>ВИБРАЦИЯ</div>
          <div>{vibration.toFixed(1)} <span style={{ fontSize: 10, opacity: 0.6 }}>m/s²</span></div>
          <div style={{ fontSize: 7, color: `${color}55`, marginTop: 2 }}>нажмите для деталей</div>
        </div>
      </Html>
    </group>
  )
}

// Main component
export function FloatingMetrics({ speed, rpm, coolant, vibration, suspSeverity, onVibrationClick }: FloatingMetricsProps) {
  const vibColor = suspSeverity > 0.7 ? '#FF1744' : suspSeverity > 0.3 ? '#FFAB00' : '#00E5FF'
  const coolColor = coolant > 100 ? '#FF1744' : coolant > 95 ? '#FFAB00' : '#00E5FF'

  return (
    <>
      {/* Tether lines */}
      <Tether from={[0.8, 0.2, 0.5]} to={[-3.8, 2.0, 0]} />
      <Tether from={[1.0, 0.3, 1.5]} to={[3.8, 2.0, 0]} />
      <Tether from={[0, 0.4, 0.8]} to={[0, 3.0, 0]} />
      <Tether from={[0, -0.3, 0]} to={[2.5, -0.5, 0.5]} color={vibColor} />

      {/* Обороты -- left */}
      <Html position={[-3.0, 1.6, 0]} center distanceFactor={18} zIndexRange={[1, 0]}>
        <SvgGauge value={rpm} min={0} max={8000} unit="×1000 ОБ/МИН" color="#00E5FF" size={120} labelDivider={1000} majorTicks={9} />
      </Html>

      {/* Speed -- right */}
      <Html position={[3.0, 1.6, 0]} center distanceFactor={18} zIndexRange={[1, 0]}>
        <SvgGauge value={speed} min={0} max={200} unit="КМ/Ч" color="#00E5FF" size={120} majorTicks={6} />
      </Html>

      {/* Coolant -- top center */}
      <Html position={[0, 2.2, 0]} center distanceFactor={12} zIndexRange={[1, 0]}>
        <TempDisplay value={coolant} color={coolColor} />
      </Html>

      {/* Vibration — 3D scatter cloud (bottom right) */}
      <MiniAccelCloud
        position={[2.5, -0.5, 0.5]}
        vibration={vibration}
        severity={suspSeverity}
        onClick={onVibrationClick}
      />
    </>
  )
}
