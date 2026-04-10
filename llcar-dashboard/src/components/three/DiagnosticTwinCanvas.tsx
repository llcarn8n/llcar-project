import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { SceneSetup } from './SceneSetup'
import { CarWireframe, type WheelRefs, type WheelCorner } from './CarWireframe'
import { Hotspot } from './Hotspot'
import { AccelWaves, type AccelSample, type WheelBounce } from './AccelWaves'

interface SystemInfo {
  score: number
  severity: number
}

interface AudioSample {
  freqs: [number, number][]
  quality: number
}

interface DiagnosticTwinCanvasProps {
  systems: {
    suspension: SystemInfo
    engine: SystemInfo
    electrical: SystemInfo
    audio: SystemInfo
  }
  activeSystem: string | null
  onHotspotClick: (system: string) => void
  accelData?: AccelSample | null
  audioData?: AudioSample[]
}

const HOTSPOTS: { key: string; label: string; position: [number, number, number]; color: string }[] = [
  { key: 'engine',     label: 'Двигатель', position: [0, 0.5, 1.8],     color: '#4ade80' },  // front — engine bay
  { key: 'suspension', label: 'Подвеска',  position: [0, -0.4, 0.5],    color: '#00e5ff' },  // low — road/carpet level
  { key: 'electrical', label: 'Электрика', position: [0.7, 0.9, 1.5],   color: '#a78bfa' },  // front right — headlights/fuse area
  { key: 'audio',      label: 'Аудио',     position: [-1.2, 0.6, 1.3],  color: '#f97316' },  // near left front bearing audio zone
]

// 6 NVH audio zones — spread to ALL sides of the car for visual separation
// Based on automotive NVH source mapping, exaggerated positions for clarity
// Car model: bbox X ±1.07, Y 0..1.6, Z -2.44..+2.32 (offset Y -0.5)
const AUDIO_ZONES = [
  { key: 'road',    pos: [0.8, -0.5, 1.8] as [number, number, number],   color: '#60a5fa', minFreq: 0,    maxFreq: 80,    label: 'Дорога <80Гц',      waveSpeed: 0.3, maxRadius: 1.4 },  // blue — front RIGHT tire
  { key: 'engine',  pos: [0, 0.2, 2.0] as [number, number, number],      color: '#4ade80', minFreq: 80,   maxFreq: 150,   label: 'Двигатель 80–150Гц', waveSpeed: 0.5, maxRadius: 1.6 },  // green — FRONT engine bay
  { key: 'trans',   pos: [-0.8, -0.4, 0] as [number, number, number],    color: '#22d3ee', minFreq: 150,  maxFreq: 300,   label: 'Трансмиссия 150–300Гц', waveSpeed: 0.4, maxRadius: 1.2 },  // cyan — LEFT underside
  { key: 'acc',     pos: [-1.3, 0.3, 1.4] as [number, number, number],   color: '#f59e0b', minFreq: 300,  maxFreq: 600,   label: 'Навесное 300–600Гц', waveSpeed: 0.6, maxRadius: 1.0 },  // amber — LEFT side of engine bay
  { key: 'bearing', pos: [1.4, -0.2, -0.8] as [number, number, number],  color: '#f97316', minFreq: 600,  maxFreq: 2000,  label: 'Подшипники 0.6–2кГц', waveSpeed: 0.7, maxRadius: 0.9 },  // orange — RIGHT rear quarter (clearly separated)
  { key: 'hf',      pos: [0.8, 1.0, -1.5] as [number, number, number],   color: '#ef4444', minFreq: 2000, maxFreq: 99999, label: 'ВЧ шум >2кГц',      waveSpeed: 0.9, maxRadius: 0.7 },  // red — rear RIGHT, above trunk (visible from default camera angle)
]

// ── Spherical wave emitter with 1/r decay (physically-based sound propagation) ──
const WAVE_COUNT = 4 // concurrent expanding wavefronts per source

function AudioZoneEmitter({ color, amplitude, index, waveSpeed, maxRadius }: {
  color: string; amplitude: number; index: number; waveSpeed: number; maxRadius: number
}) {
  const coreRef = useRef<THREE.Mesh>(null)
  const wavesRef = useRef<THREE.Mesh[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const amp = Math.max(amplitude, 0.08) // always minimally visible

    // Core: soft glow at source — gentle breathing pulse
    if (coreRef.current) {
      const breath = 1 + Math.sin(t * (1.5 + index * 0.3)) * 0.15 * amp
      coreRef.current.scale.setScalar(0.5 + amp * 0.5 * breath)
      ;(coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + amp * 0.5
    }

    // Spherical wavefronts: expand outward, fade as 1/r (inverse distance)
    for (let w = 0; w < WAVE_COUNT; w++) {
      const sphere = wavesRef.current[w]
      if (!sphere) continue

      // Stagger wavefronts evenly across the cycle
      const cycleTime = maxRadius / (waveSpeed * (0.5 + amp * 0.5))
      const phase = ((t + w * (cycleTime / WAVE_COUNT)) % cycleTime) / cycleTime // 0→1

      // Radius grows from 0 to maxRadius
      const r = phase * maxRadius

      // Physically-based 1/r decay with damping: A·e^(-decay·r) / (1 + r)
      const decay = 1.5 - amp * 0.5 // stronger signal = slower decay
      const envelope = Math.exp(-decay * r) / (1 + r * 2)

      sphere.scale.setScalar(Math.max(r, 0.01))
      const mat = sphere.material as THREE.MeshBasicMaterial
      mat.opacity = envelope * amp * 0.35
    }
  })

  return (
    <group>
      {/* Source core: small bright dot */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding spherical wavefronts — wireframe spheres, fewer segments for lighter look */}
      {Array.from({ length: WAVE_COUNT }, (_, w) => (
        <mesh
          key={w}
          ref={el => { if (el) wavesRef.current[w] = el }}
        >
          <sphereGeometry args={[1, 20, 12]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0}
            wireframe
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function AudioZones3D({ audioData }: { audioData?: AudioSample[] }) {
  // Compute zone amplitudes from latest audio sample
  const ZONE_COUNT = AUDIO_ZONES.length
  const demoBaseline = useMemo(() => new Array(ZONE_COUNT).fill(0.25), [])
  const zoneAmps = useMemo(() => {
    if (!audioData || audioData.length === 0) return demoBaseline
    const last = audioData[audioData.length - 1]
    if (!last.freqs || last.freqs.length === 0) return demoBaseline

    return AUDIO_ZONES.map(zone => {
      let sum = 0
      for (const [freq, amp] of last.freqs) {
        const f = Math.abs(freq)
        const a = Math.abs(amp)
        if (f >= zone.minFreq && f < zone.maxFreq) sum += a
      }
      return Math.max(Math.min(sum / 300, 1), 0.1) // normalize 0.1..1
    })
  }, [audioData, demoBaseline])

  return (
    <group>
      {AUDIO_ZONES.map((zone, i) => (
        <group key={zone.key} position={zone.pos}>
          <AudioZoneEmitter
            color={zone.color}
            amplitude={zoneAmps[i]}
            index={i}
            waveSpeed={zone.waveSpeed}
            maxRadius={zone.maxRadius}
          />
        </group>
      ))}
    </group>
  )
}

// Shared bounce ref — written by AccelWaves, read by CarBouncer
const bounceRef = { y: 0, roll: 0, pitch: 0 }
const wheelBounceRef: WheelBounce = { fl: 0, fr: 0, rl: 0, rr: 0 }

// Corner → bounce key mapping
const CORNER_KEY: Record<WheelCorner, keyof WheelBounce> = {
  'ПЛ': 'fl', 'ПП': 'fr', 'ЗЛ': 'rl', 'ЗП': 'rr',
}

// Applies bounce to car body + per-wheel offsets (no React re-renders)
function CarBouncer({ activeSystem, groupRef }: {
  activeSystem: string | null
  groupRef: React.RefObject<THREE.Group | null>
}) {
  const wheelRefsLocal = useRef<WheelRefs | null>(null)
  const suspRefLocal = useRef<THREE.Object3D | null>(null)
  // Store original Y positions for each wheel mesh
  const origY = useRef<Map<THREE.Object3D, number>>(new Map())

  const handleWheelRefs = useCallback((refs: WheelRefs, susp: THREE.Object3D | null) => {
    wheelRefsLocal.current = refs
    suspRefLocal.current = susp
    // Cache original Y positions
    origY.current.clear()
    for (const corner of Object.keys(refs) as WheelCorner[]) {
      for (const obj of refs[corner]) {
        origY.current.set(obj, obj.position.y)
      }
    }
    if (susp) origY.current.set(susp, susp.position.y)
  }, [])

  const wheelRotation = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Body movement (slow lerp applied in AccelWaves)
    groupRef.current.position.y = -0.15 + bounceRef.y
    groupRef.current.rotation.z = bounceRef.roll
    groupRef.current.rotation.x = bounceRef.pitch

    // Wheel spin: slows when pitch is high (braking)
    const brakeAmount = Math.abs(bounceRef.pitch) / 0.05 // 0..1 at max brake pitch
    const spinSpeed = Math.max(1 - brakeAmount * 0.9, 0.1) // slow to 10% on brake
    wheelRotation.current += delta * 3.0 * spinSpeed // ~3 rad/s base speed

    // Per-wheel Y offset + rotation
    const wRefs = wheelRefsLocal.current
    if (wRefs) {
      for (const corner of Object.keys(wRefs) as WheelCorner[]) {
        const key = CORNER_KEY[corner]
        const wheelY = wheelBounceRef[key]
        for (const obj of wRefs[corner]) {
          const oy = origY.current.get(obj) ?? obj.position.y
          obj.position.y = oy + wheelY
          // Spin wheels around X axis (rolling forward)
          const name = obj.name?.toLowerCase() ?? ''
          if (name.includes('шина') || name.includes('колесо') || name.includes('тормоз')) {
            obj.rotation.x = wheelRotation.current
          }
        }
      }
    }

    // Suspension compression: scale Y based on max wheel-body gap
    const susp = suspRefLocal.current
    if (susp) {
      const maxGap = Math.max(
        Math.abs(wheelBounceRef.fl - bounceRef.y),
        Math.abs(wheelBounceRef.fr - bounceRef.y),
        Math.abs(wheelBounceRef.rl - bounceRef.y),
        Math.abs(wheelBounceRef.rr - bounceRef.y),
      )
      // Compress when gap is large (wheel far from body)
      susp.scale.y = THREE.MathUtils.lerp(1.0, 0.6, Math.min(maxGap * 8, 1))
    }
  })

  return (
    <group ref={groupRef}>
      <CarWireframe activeSystem={activeSystem} onWheelRefs={handleWheelRefs} />
    </group>
  )
}

function SceneContent({
  systems, activeSystem, onHotspotClick, accelData, audioData,
}: DiagnosticTwinCanvasProps) {
  const carGroupRef = useRef<THREE.Group>(null)

  const handleBounce = (y: number, roll: number, pitch: number, wheels: WheelBounce) => {
    bounceRef.y = y
    bounceRef.roll = roll
    bounceRef.pitch = pitch
    wheelBounceRef.fl = wheels.fl
    wheelBounceRef.fr = wheels.fr
    wheelBounceRef.rl = wheels.rl
    wheelBounceRef.rr = wheels.rr
  }

  return (
    <>
      <SceneSetup />
      <CarBouncer activeSystem={activeSystem} groupRef={carGroupRef} />
      <AccelWaves
        accelData={accelData ?? null}
        visible={activeSystem === 'suspension' || activeSystem === null}
        onBounce={handleBounce}
      />
      {(activeSystem === 'audio' || activeSystem === null) && (
        <AudioZones3D audioData={audioData} />
      )}
      {HOTSPOTS.map(hs => {
        const sys = systems[hs.key as keyof typeof systems]
        return (
          <Hotspot
            key={hs.key}
            position={hs.position}
            label={hs.label}
            value={`${sys.score}`}
            severity={sys.severity}
            color={hs.color}
            active={activeSystem === hs.key}
            onClick={() => onHotspotClick(hs.key)}
          />
        )
      })}
    </>
  )
}

export default function DiagnosticTwinCanvas(props: DiagnosticTwinCanvasProps) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  return (
    <Canvas camera={{ position: [3.5, 1.5, 3.5], fov: 42 }} style={{ background: 'transparent' }}>
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
      {!isMobile && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette offset={0.3} darkness={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
