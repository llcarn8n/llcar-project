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
  { key: 'engine', label: 'Двигатель', position: [0, 1.0, -1.3], color: '#00e5ff' },
  { key: 'suspension', label: 'Подвеска', position: [-0.85, 0.5, 0.2], color: '#00e5ff' },
  { key: 'electrical', label: 'Электрика', position: [0.5, 0.5, 0.2], color: '#64ffda' },
  { key: 'audio', label: 'Аудио', position: [0, 0.85, 1.3], color: '#64ffda' },
]

// Audio zone positions on car and colors (matching AudioSpectrum zones)
const AUDIO_ZONES = [
  { key: 'road', pos: [0, -0.3, 0] as [number, number, number], color: '#00e5ff', maxFreq: 100, label: 'Дорога' },
  { key: 'engine', pos: [0, 0.2, -1.0] as [number, number, number], color: '#64ffda', minFreq: 100, maxFreq: 300, label: 'Двигатель' },
  { key: 'acc', pos: [0.4, 0.3, 0.5] as [number, number, number], color: '#00b8d4', minFreq: 300, maxFreq: 1000, label: 'Оборудование' },
  { key: 'hf', pos: [0, 0.6, 0.8] as [number, number, number], color: '#00e5ff', minFreq: 1000, label: 'ВЧ шум' },
]

// Single audio zone: pulsing core sphere + 3 expanding wave rings + particle spray
function AudioZoneEmitter({ color, amplitude, index }: { color: string; amplitude: number; index: number }) {
  const coreRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Mesh[]>([])
  const pointsRef = useRef<THREE.Points>(null)
  const PARTICLES = 60

  const particlePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLES * 3)
    for (let i = 0; i < PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 0.1 + Math.random() * 0.3
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.cos(phi)
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const amp = amplitude
    const baseAmp = 0.15 // always show something even with zero data

    // Core sphere: pulses with amplitude
    if (coreRef.current) {
      const s = (baseAmp + amp * 0.6) * (1 + Math.sin(t * (3 + index)) * 0.3)
      coreRef.current.scale.setScalar(s)
      ;(coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + amp * 0.5
    }

    // 3 expanding rings: staggered phase, grow outward, fade
    for (let r = 0; r < 3; r++) {
      const ring = ringsRef.current[r]
      if (!ring) continue
      // Each ring cycles 0→1 with phase offset
      const phase = ((t * (0.6 + amp * 0.8) + r * 0.33) % 1)
      const ringScale = 0.15 + phase * (0.8 + amp * 1.2)
      ring.scale.setScalar(ringScale)
      // Fade out as it expands
      ;(ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * (0.2 + amp * 0.5)
    }

    // Particles: expand outward proportional to amplitude, orbit slowly
    if (pointsRef.current) {
      const arr = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < PARTICLES; i++) {
        const theta = (i / PARTICLES) * Math.PI * 2 + t * 0.3
        const phi = (i * 2.399) % Math.PI // golden angle distribution
        const r = 0.15 + (baseAmp + amp) * 0.5 + Math.sin(t * 2 + i * 0.7) * 0.08
        arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        arr[i * 3 + 1] = r * Math.cos(phi) * 0.6 // flatten slightly
        arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
      ;(pointsRef.current.material as THREE.PointsMaterial).opacity = 0.12 + amp * 0.4
      ;(pointsRef.current.material as THREE.PointsMaterial).size = 0.03 + amp * 0.05
    }
  })

  return (
    <group>
      {/* Glowing core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3 expanding wave rings */}
      {[0, 1, 2].map(r => (
        <mesh
          key={r}
          ref={el => { if (el) ringsRef.current[r] = el }}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.5, 0.015, 8, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Particle spray */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.04}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

function AudioZones3D({ audioData }: { audioData?: AudioSample[] }) {
  // Compute zone amplitudes from latest audio sample
  const zoneAmps = useMemo(() => {
    if (!audioData || audioData.length === 0) return [0.3, 0.3, 0.3, 0.3] // demo baseline
    const last = audioData[audioData.length - 1]
    if (!last.freqs || last.freqs.length === 0) return [0.3, 0.3, 0.3, 0.3]

    return AUDIO_ZONES.map(zone => {
      let sum = 0
      for (const [freq, amp] of last.freqs) {
        const f = Math.abs(freq)
        const a = Math.abs(amp)
        const min = (zone as any).minFreq ?? 0
        const max = (zone as any).maxFreq ?? 99999
        if (f >= min && f < max) sum += a
      }
      return Math.max(Math.min(sum / 300, 1), 0.15) // normalize 0.15..1, never fully invisible
    })
  }, [audioData])

  return (
    <group>
      {AUDIO_ZONES.map((zone, i) => (
        <group key={zone.key} position={zone.pos}>
          <AudioZoneEmitter color={zone.color} amplitude={zoneAmps[i]} index={i} />
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

  useFrame(() => {
    if (!groupRef.current) return

    // Body movement (slow lerp applied in AccelWaves)
    groupRef.current.position.y = -0.15 + bounceRef.y
    groupRef.current.rotation.z = bounceRef.roll
    groupRef.current.rotation.x = bounceRef.pitch

    // Per-wheel Y offset (relative to body)
    const wRefs = wheelRefsLocal.current
    if (wRefs) {
      for (const corner of Object.keys(wRefs) as WheelCorner[]) {
        const key = CORNER_KEY[corner]
        const wheelY = wheelBounceRef[key]
        // Offset wheel meshes relative to their original position
        for (const obj of wRefs[corner]) {
          const oy = origY.current.get(obj) ?? obj.position.y
          obj.position.y = oy + wheelY
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
