import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, ContactShadows } from '@react-three/drei'
import { theme } from '../../theme'

export interface AccelSample { x_std: number; y_std: number; z_std: number; ts: string }

const C_OK = '#00E676', C_WARN = '#FFAB00', C_CRIT = '#FF1744'
const SCALE = 0.4
const ZONE_OK = 2, ZONE_WARN = 5

function getStatus(t: number, x: number, y: number, z: number) {
  const worst = [
    { v: z, ax: 'вертикально', why: 'ямы, амортизаторы' },
    { v: x, ax: 'вбок', why: 'колея, сайлентблоки' },
    { v: y, ax: 'продольно', why: 'опоры двигателя' },
  ].sort((a, b) => b.v - a.v)[0]
  if (t < 2) return { label: 'НОРМА', color: C_OK, text: 'Подвеска ок' }
  if (t < 5) return { label: 'УМЕРЕННАЯ', color: C_WARN, text: `Больше ${worst.ax}` }
  if (t < 8) return { label: 'ПОВЫШЕННАЯ', color: C_WARN, text: `Проверить. ${worst.ax} — ${worst.why}` }
  return { label: 'ВЫСОКАЯ', color: C_CRIT, text: `Диагностика! ${worst.ax} — ${worst.why}` }
}

// ── 3D History Chart along an axis ──
// Renders history as a ribbon/corridor + line inside the bar space
function AxisChart({ data, dataKey, axis, color }: {
  data: AccelSample[]; dataKey: 'x_std'|'y_std'|'z_std'
  axis: 'x'|'y'|'z'; color: string
}) {
  const samples = useMemo(() => data.slice(-40), [data])
  if (samples.length < 2) return null

  const values = samples.map(s => s[dataKey])
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  // avg for reference
  void values.reduce((a, b) => a + b, 0)

  // Chart extends along the axis direction, amplitude perpendicular
  // Length of chart along axis = 5 units, amplitude = scaled value
  const chartLen = 5
  const ampScale = 0.15 // amplitude perpendicular to axis

  // Build line points + corridor (min/max envelope)
  const { linePoints, corridorTop, corridorBot, zoneLine2, zoneLine5 } = useMemo(() => {
    const lp: THREE.Vector3[] = []
    const ct: THREE.Vector3[] = []
    const cb: THREE.Vector3[] = []
    const z2: THREE.Vector3[] = []
    const z5: THREE.Vector3[] = []

    for (let i = 0; i < values.length; i++) {
      const t = (i / (values.length - 1)) * chartLen
      const v = values[i] * SCALE
      const mn = minVal * SCALE
      const mx = maxVal * SCALE

      if (axis === 'x') {
        // Along X, amplitude on Y
        lp.push(new THREE.Vector3(t, v, 0))
        ct.push(new THREE.Vector3(t, mx, 0))
        cb.push(new THREE.Vector3(t, mn, 0))
        z2.push(new THREE.Vector3(t, ZONE_OK * SCALE, 0))
        z5.push(new THREE.Vector3(t, ZONE_WARN * SCALE, 0))
      } else if (axis === 'y') {
        // Along Z (depth), amplitude on Y
        lp.push(new THREE.Vector3(0, v, t))
        ct.push(new THREE.Vector3(0, mx, t))
        cb.push(new THREE.Vector3(0, mn, t))
        z2.push(new THREE.Vector3(0, ZONE_OK * SCALE, t))
        z5.push(new THREE.Vector3(0, ZONE_WARN * SCALE, t))
      } else {
        // Along Y (up), amplitude on X
        lp.push(new THREE.Vector3(v * ampScale * 3, t, 0))
        ct.push(new THREE.Vector3(mx * ampScale * 3, t, 0))
        cb.push(new THREE.Vector3(mn * ampScale * 3, t, 0))
        z2.push(new THREE.Vector3(ZONE_OK * SCALE * ampScale * 3, t, 0))
        z5.push(new THREE.Vector3(ZONE_WARN * SCALE * ampScale * 3, t, 0))
      }
    }
    return { linePoints: lp, corridorTop: ct, corridorBot: cb, zoneLine2: z2, zoneLine5: z5 }
  }, [values, axis, minVal, maxVal])

  // Corridor mesh (min-max envelope as ribbon)
  const corridorGeo = useMemo(() => {
    const positions: number[] = []
    const indices: number[] = []
    for (let i = 0; i < corridorTop.length; i++) {
      positions.push(corridorBot[i].x, corridorBot[i].y, corridorBot[i].z)
      positions.push(corridorTop[i].x, corridorTop[i].y, corridorTop[i].z)
      if (i < corridorTop.length - 1) {
        const base = i * 2
        indices.push(base, base + 1, base + 2)
        indices.push(base + 1, base + 3, base + 2)
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [corridorTop, corridorBot])

  const histLine = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(linePoints)
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }))
  }, [linePoints, color])

  const z2Line = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(zoneLine2)
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: C_OK, transparent: true, opacity: 0.2 }))
  }, [zoneLine2])

  const z5Line = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(zoneLine5)
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: C_WARN, transparent: true, opacity: 0.2 }))
  }, [zoneLine5])

  return (
    <group>
      {/* Min-max corridor */}
      <mesh geometry={corridorGeo}>
        <meshStandardMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} metalness={0.2} roughness={0.6} />
      </mesh>
      <primitive object={histLine} />
      <primitive object={z2Line} />
      <primitive object={z5Line} />
      {/* Min/Max labels at end */}
      <Html position={axis === 'x' ? [chartLen+0.3, maxVal*SCALE, 0] : axis === 'y' ? [0, maxVal*SCALE, chartLen+0.3] : [maxVal*SCALE*ampScale*3, chartLen+0.3, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: 'Consolas' }}>max {maxVal.toFixed(1)}</span>
      </Html>
      <Html position={axis === 'x' ? [chartLen+0.3, minVal*SCALE, 0] : axis === 'y' ? [0, minVal*SCALE, chartLen+0.3] : [minVal*SCALE*ampScale*3, chartLen+0.3, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: 'Consolas' }}>min {minVal.toFixed(1)}</span>
      </Html>
    </group>
  )
}

// ── Current value bar (end cap) ──
function CurrentBar({ value, axis, color }: { value: number; axis: 'x'|'y'|'z'; color: string }) {
  const ref = useRef<any>(null)
  const len = value * SCALE
  const chartLen = 5

  useFrame(({ clock }) => {
    if (!ref.current) return
    const isCrit = value > ZONE_WARN
    const isWarn = value > ZONE_OK
    const base = isCrit ? 1.0 : isWarn ? 0.6 : 0.4
    const pulse = isCrit ? 0.5 : 0.2
    ref.current.material.emissiveIntensity = base + Math.sin(clock.elapsedTime * (isCrit ? 4 : 2)) * pulse
  })

  // Position at the END of the history chart
  const pos: [number,number,number] = axis === 'x' ? [chartLen, len/2, 0] : axis === 'y' ? [0, len/2, chartLen] : [0, chartLen + len/2, 0]

  return (
    <group>
      <mesh ref={ref} position={pos}>
        <boxGeometry args={[axis === 'z' ? 0.5 : 0.3, len, axis === 'z' ? 0.5 : 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.85} />
      </mesh>
      {/* Value label */}
      <Html position={[pos[0], pos[1]+len/2+0.4, pos[2]]} center style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.85)', border: `1px solid ${color}`, borderRadius: 3, padding: '2px 6px', boxShadow: `0 0 6px ${color}40` }}>
          <span style={{ fontFamily: 'Consolas', fontSize: 12, fontWeight: 'bold', color }}>{value.toFixed(1)}</span>
        </div>
      </Html>
      {/* Axis label */}
      <Html position={[pos[0], -0.5, pos[2]]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontSize: 9, color: `${color}aa`, fontFamily: 'Consolas', whiteSpace: 'nowrap' }}>
          {axis === 'x' ? 'X Боковая' : axis === 'y' ? 'Y Продольная' : 'Z Вертикальная'}
        </span>
      </Html>
    </group>
  )
}

// ── Axis guide line ──
function AxisLine({ dir, color, len }: { dir: 'x'|'y'|'z'; color: string; len: number }) {
  const line = useMemo(() => {
    const end = dir === 'x' ? new THREE.Vector3(len,0,0) : dir === 'y' ? new THREE.Vector3(0,0,len) : new THREE.Vector3(0,len,0)
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), end])
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15 }))
  }, [dir, color, len])
  return <primitive object={line} />
}

// ── 3D Scene ──
function VibrationScene({ data, latest }: { data: AccelSample[]; latest: AccelSample }) {
  return (
    <>
      <fog attach="fog" args={['#0C1220', 8, 20]} />
      <gridHelper args={[14, 14, 'rgba(0,229,255,0.1)', 'rgba(0,229,255,0.03)']} position={[0,-0.01,0]} />
      <ContactShadows position={[0, -0.02, 0]} opacity={0.3} scale={16} blur={2} far={6} color="#00E5FF" />

      {/* Axis guide lines */}
      <AxisLine dir="x" color="#ef4444" len={7} />
      <AxisLine dir="y" color="#4ade80" len={7} />
      <AxisLine dir="z" color="#60a5fa" len={7} />

      {/* Origin */}
      <mesh><sphereGeometry args={[0.1,8,8]} /><meshBasicMaterial color="#fff" transparent opacity={0.3} /></mesh>

      {/* History charts inside each axis */}
      <AxisChart data={data} dataKey="x_std" axis="x" color="#ef4444" />
      <AxisChart data={data} dataKey="y_std" axis="y" color="#4ade80" />
      <AxisChart data={data} dataKey="z_std" axis="z" color="#60a5fa" />

      {/* Current value bars at the end of each chart */}
      <CurrentBar value={latest.x_std} axis="x" color="#ef4444" />
      <CurrentBar value={latest.y_std} axis="y" color="#4ade80" />
      <CurrentBar value={latest.z_std} axis="z" color="#60a5fa" />

      <ambientLight intensity={0.35} color="#4488ff" />
      <pointLight position={[8, 8, 8]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-4, 6, 3]} intensity={0.4} color="#00E5FF" />
      <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.1}
        autoRotate autoRotateSpeed={0.3}
        minPolarAngle={Math.PI*0.1} maxPolarAngle={Math.PI*0.45} />
    </>
  )
}

// ── Main ──
export function SmartSphere({ data }: { data: AccelSample[] }) {
  const latest = data.length > 0 ? data[data.length - 1] : null
  const x = latest?.x_std ?? 0, y = latest?.y_std ?? 0, z = latest?.z_std ?? 0
  const total = Math.sqrt(x**2 + y**2 + z**2)
  const st = getStatus(total, x, y, z)

  if (!latest) return (
    <div className="glass-panel p-4" style={{ height: 'min(420px, 55vh)' }}>
      <div className="hud-header mb-3">Вибрация 3D</div>
      <div className="flex items-center justify-center" style={{ height: 200, color: theme.text.muted, fontSize: 12 }}>Нет данных</div>
    </div>
  )

  return (
    <div className="glass-panel !p-0 overflow-hidden relative" style={{ height: 'min(420px, 55vh)' }}>
      <Canvas camera={{ position: [10, 10, 10], fov: 38 }} style={{ background: 'transparent' }}>
        <VibrationScene data={data} latest={latest} />
      </Canvas>

      {/* Status overlay */}
      <div className="absolute top-3 left-3 z-10" style={{ background: 'rgba(5,10,15,0.88)', borderRadius: 4, padding: '6px 10px', border: '1px solid rgba(0,229,255,0.1)' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, boxShadow: `0 0 8px ${st.color}` }}/>
          <span className="text-xs font-bold" style={{ color: st.color }}>{st.label}</span>
          <span className="font-mono text-lg font-bold ml-1" style={{ color: st.color, textShadow: `0 0 8px ${st.color}44` }}>{total.toFixed(1)}</span>
          <span className="text-[9px]" style={{ color: theme.text.muted }}>м/с²</span>
        </div>
        <p className="text-[9px]" style={{ color: theme.text.muted, maxWidth: 180 }}>{st.text}</p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-10" style={{ background: 'rgba(5,10,15,0.88)', borderRadius: 4, padding: '6px 8px', border: '1px solid rgba(0,229,255,0.1)' }}>
        {[
          { c: '#ef4444', n: 'X Боковая', d: 'крены, колея', v: x },
          { c: '#4ade80', n: 'Y Продольная', d: 'клевки, рывки', v: y },
          { c: '#60a5fa', n: 'Z Вертикальная', d: 'ямы, лежачие', v: z },
        ].map(a => (
          <div key={a.n} className="flex items-center gap-1.5 mb-1">
            <div style={{ width: 6, height: 6, borderRadius: 1, background: a.c, boxShadow: `0 0 4px ${a.c}` }} />
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{a.n}</span>
            <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{a.d}</span>
          </div>
        ))}
        <div className="text-[7px] mt-1 pt-1" style={{ color: 'rgba(255,255,255,0.12)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          Линия = история | Коридор = min-max | Столб = сейчас
        </div>
      </div>

      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, mixBlendMode: 'screen',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.01) 2px, rgba(0,229,255,0.01) 4px)' }}/>
    </div>
  )
}
