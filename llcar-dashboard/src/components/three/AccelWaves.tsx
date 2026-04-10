import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// ── Types ──

export interface AccelSample {
  x_std: number
  y_std: number
  z_std: number
}

export interface WheelBounce {
  fl: number; fr: number; rl: number; rr: number
}

interface AccelWavesProps {
  accelData: AccelSample | null
  visible?: boolean
  onBounce?: (y: number, roll: number, pitch: number, wheels: WheelBounce) => void
}

// ── Constants ──

const SCROLL_SPEED = 0.5
const LOOP_LENGTH = 36
const MAX_WAVE_HEIGHT = 0.2

const WAVE_COLOR = 0x00e5ff

// Axle wave strips (front and rear, full width)
const AXLES: { name: string; pos: [number, number, number] }[] = [
  { name: 'front', pos: [0, -0.52, 1.2] },
  { name: 'rear',  pos: [0, -0.52, -1.2] },
]

// All vibration types
type ObsType = 'pothole_l' | 'pothole_r' | 'bump' | 'rut' | 'brake' | 'joint'

const OBSTACLES: { type: ObsType; baseZ: number; x: number; label: string; sub: string }[] = [
  { type: 'pothole_l', baseZ: 0,  x: -0.6, label: '⬇ Яма слева',        sub: 'Z ↓ + крен влево' },
  { type: 'bump',      baseZ: 6,  x: 0,    label: '⬆ Лежачий полицейский', sub: 'Z ↑ удар снизу' },
  { type: 'pothole_r', baseZ: 12, x: 0.6,  label: '⬇ Яма справа',       sub: 'Z ↓ + крен вправо' },
  { type: 'rut',       baseZ: 18, x: 0,    label: '↔ Колея',             sub: 'X ↔ боковой увод' },
  { type: 'brake',     baseZ: 24, x: 0,    label: '⏹ Резкое торможение',  sub: 'Y ↑ клевок вперёд' },
  { type: 'joint',     baseZ: 30, x: 0,    label: '▬ Стык дороги',       sub: 'Z ↑ короткий удар' },
]


// ── Shared materials ──

const waveMaterial = new THREE.MeshBasicMaterial({
  color: WAVE_COLOR,
  transparent: true,
  opacity: 0.4,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const zWaveMaterial = waveMaterial.clone()
zWaveMaterial.opacity = 0.25

const roadMaterial = new THREE.MeshBasicMaterial({
  color: '#0a1525',
  transparent: true,
  opacity: 0.6,
  side: THREE.DoubleSide,
  depthWrite: false,
})

const lineMaterial = new THREE.MeshBasicMaterial({
  color: '#00e5ff',
  transparent: true,
  opacity: 0.12,
  side: THREE.DoubleSide,
  depthWrite: false,
})

// ── Road strip ──

function RoadStrip() {
  return (
    <group position={[0, -0.52, 0]}>
      {/* Road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={roadMaterial}>
        <planeGeometry args={[2.5, 24]} />
      </mesh>
      {/* Left edge line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.001, 0]} material={lineMaterial}>
        <planeGeometry args={[0.03, 24]} />
      </mesh>
      {/* Right edge line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.001, 0]} material={lineMaterial}>
        <planeGeometry args={[0.03, 24]} />
      </mesh>
      {/* Center dashed line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} material={lineMaterial}>
        <planeGeometry args={[0.02, 24]} />
      </mesh>
    </group>
  )
}

// ── Tire smoke: soft clouds behind rear tires on braking ──

function BrakeSmoke() {
  const groupRef = useRef<THREE.Group>(null)
  // 2 rear tires only — smoke trails behind when braking
  const SMOKE_PER_TIRE = 6
  const meshRefs = useRef<THREE.Mesh[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const tire = i < SMOKE_PER_TIRE ? 0 : 1 // left or right
      const idx = i % SMOKE_PER_TIRE
      // Each puff cycles with offset
      const phase = ((t * 0.8 + idx * 0.18) % 1)
      const tireX = tire === 0 ? -0.65 : 0.65

      // Rise from tire level, drift backward (negative Z = behind)
      mesh.position.x = tireX + Math.sin(t + i) * 0.05
      mesh.position.y = 0.05 + phase * 0.35
      mesh.position.z = -phase * 0.6 // drift backward

      // Grow as it rises, fade out
      const scale = 0.08 + phase * 0.2
      mesh.scale.setScalar(scale)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.18
    })
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: SMOKE_PER_TIRE * 2 }, (_, i) => (
        <mesh
          key={i}
          ref={el => { if (el) meshRefs.current[i] = el }}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial
            color="#887766"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Obstacle mesh ──

function ObstacleMesh({ type }: { type: ObsType }) {
  const geo = useMemo(() => {
    if (type === 'pothole_l' || type === 'pothole_r') {
      const g = new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      g.scale(1, -0.4, 1.2)
      return g
    }
    if (type === 'bump') {
      const g = new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      g.scale(2.5, 0.35, 0.6)
      return g
    }
    if (type === 'brake') {
      // Skid marks — long gradient planes
      const g = new THREE.PlaneGeometry(0.1, 2.5, 1, 10)
      g.rotateX(-Math.PI / 2)
      // Gradient opacity via vertex colors: fade in from front to back
      const colors = new Float32Array(g.attributes.position.count * 3)
      for (let i = 0; i < g.attributes.position.count; i++) {
        const z = g.attributes.position.getZ(i)
        const fade = THREE.MathUtils.clamp((z + 1.25) / 2.5, 0, 1) // 0 at front → 1 at back
        colors[i * 3] = fade * 0.8     // R
        colors[i * 3 + 1] = fade * 0.1 // G
        colors[i * 3 + 2] = fade * 0.1 // B
      }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      return g
    }
    if (type === 'joint') {
      // Road joint — thin line across road
      const g = new THREE.BoxGeometry(2.2, 0.06, 0.06)
      return g
    }
    // rut
    const g = new THREE.CylinderGeometry(0.08, 0.12, 2.0, 8, 1, true)
    g.rotateZ(Math.PI / 2)
    return g
  }, [type])

  // Colors matching legend: Яма cyan, Бугор green, Торможение red, Колея amber, Стык purple
  const color = (type === 'pothole_l' || type === 'pothole_r') ? '#00e5ff'
    : type === 'bump' ? '#4ade80'
    : type === 'brake' ? '#ff4444'
    : type === 'rut' ? '#f59e0b'
    : type === 'joint' ? '#a78bfa'
    : '#00b8d4'

  if (type === 'brake') {
    return (
      <>
        {/* Left skid mark */}
        <mesh geometry={geo} position={[-0.25, 0.002, 0]}>
          <meshBasicMaterial color="#ff4444" transparent opacity={0.25} vertexColors side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Right skid mark */}
        <mesh geometry={geo} position={[0.25, 0.002, 0]}>
          <meshBasicMaterial color="#ff4444" transparent opacity={0.25} vertexColors side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Red glow zone */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <circleGeometry args={[0.6, 16]} />
          <meshBasicMaterial color="#ff2200" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Smoke particles */}
        <BrakeSmoke />
      </>
    )
  }

  return (
    <>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} wireframe />
      </mesh>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )
}


// ── Wheel wave plane ──

function AxleWave({ pos, axleRef }: {
  pos: [number, number, number]
  axleRef: React.MutableRefObject<THREE.Mesh | null>
}) {
  const geo = useMemo(() => {
    // Full-width strip under axle (wider than car, short depth)
    const g = new THREE.PlaneGeometry(2.2, 0.8, 20, 8)
    g.rotateX(-Math.PI / 2)
    g.userData.origPositions = new Float32Array(g.attributes.position.array)
    return g
  }, [])

  return <mesh ref={axleRef} position={pos} geometry={geo} material={waveMaterial} />
}

// ── Z-wave plane ──

function ZWave({ waveRef }: { waveRef: React.MutableRefObject<THREE.Mesh | null> }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2.5, 4.0, 32, 40)
    g.rotateX(-Math.PI / 2)
    g.userData.origPositions = new Float32Array(g.attributes.position.array)
    return g
  }, [])

  return <mesh ref={waveRef} position={[0, -0.53, 0]} geometry={geo} material={zWaveMaterial} />
}

// ── Main component ──

export function AccelWaves({ accelData, visible = true, onBounce }: AccelWavesProps) {
  void accelData // reserved for real data integration
  const axleRefs = [
    useRef<THREE.Mesh>(null), // front
    useRef<THREE.Mesh>(null), // rear
  ]
  const zWaveRef = useRef<THREE.Mesh>(null)
  const obstacleRefs = useRef<THREE.Group[]>([])
  const currentBounce = useRef({ y: 0, roll: 0, pitch: 0 })
  const currentWheels = useRef<WheelBounce>({ fl: 0, fr: 0, rl: 0, rr: 0 })
  const roadOffset = useRef(0) // accumulated road scroll (slows on brake)

  const setObstacleRef = useCallback((idx: number) => (el: THREE.Group | null) => {
    if (el) obstacleRefs.current[idx] = el
  }, [])

  useFrame(({ clock }, delta) => {
    if (!visible) return
    const t = clock.elapsedTime

    // ── Road scroll: slows to near-stop during braking ──
    let brakeSlowdown = 1.0
    OBSTACLES.forEach((obs) => {
      if (obs.type !== 'brake') return
      let z = obs.baseZ - roadOffset.current % LOOP_LENGTH
      while (z < -8) z += LOOP_LENGTH
      while (z > 28) z -= LOOP_LENGTH
      const dist = Math.abs(z) // distance brake obstacle from car center (z=0)
      if (dist < 5) {
        // Smooth deceleration: full stop at center, gradual approach
        const proximity = Math.max(0, 1 - dist / 5)
        brakeSlowdown = Math.min(brakeSlowdown, 1 - proximity * 0.97) // almost full stop (3% speed)
      }
    })
    roadOffset.current += SCROLL_SPEED * brakeSlowdown * delta
    const offset = roadOffset.current % LOOP_LENGTH

    let targetBounceY = 0
    let targetBounceRoll = 0
    let targetPitch = 0
    // Per-wheel immediate bounce (faster response than body)
    let wFL = 0, wFR = 0, wRL = 0, wRR = 0

    OBSTACLES.forEach((obs, i) => {
      const group = obstacleRefs.current[i]
      if (!group) return

      // Position: start far ahead (Z+), scroll toward camera (Z-), then loop
      let z = obs.baseZ - offset
      // Wrap into visible range
      while (z < -8) z += LOOP_LENGTH
      while (z > 28) z -= LOOP_LENGTH
      group.position.z = z

      // Front axle z≈+1.2, rear axle z≈-1.2
      const frontHit = Math.max(0, 1 - Math.abs(z - 1.2) / 0.8)
      const rearHit  = Math.max(0, 1 - Math.abs(z + 1.2) / 0.8)
      const anyHit = Math.max(frontHit, rearHit)

      if (anyHit > 0) {
        const pitchPhase = frontHit > 0 ? frontHit : -rearHit

        if (obs.type === 'pothole_l') {
          const damped = anyHit * Math.exp(-anyHit * 0.5)
          targetBounceY -= 0.12 * damped
          targetBounceRoll += 0.07 * anyHit
          targetPitch += 0.05 * pitchPhase
          // Left wheels drop hard, right barely affected
          wFL -= 0.18 * frontHit; wRL -= 0.18 * rearHit
          wFR -= 0.03 * frontHit; wRR -= 0.03 * rearHit
        } else if (obs.type === 'pothole_r') {
          const damped = anyHit * Math.exp(-anyHit * 0.5)
          targetBounceY -= 0.12 * damped
          targetBounceRoll -= 0.07 * anyHit
          targetPitch += 0.05 * pitchPhase
          // Right wheels drop hard, left barely affected
          wFR -= 0.18 * frontHit; wRR -= 0.18 * rearHit
          wFL -= 0.03 * frontHit; wRL -= 0.03 * rearHit
        } else if (obs.type === 'bump') {
          const smooth = Math.sin(anyHit * Math.PI)
          targetBounceY += 0.10 * smooth
          targetPitch -= 0.06 * pitchPhase
          // All wheels rise simultaneously
          wFL += 0.14 * frontHit; wFR += 0.14 * frontHit
          wRL += 0.14 * rearHit; wRR += 0.14 * rearHit
        } else if (obs.type === 'rut') {
          targetBounceRoll += 0.07 * anyHit * Math.sin(t * 6)
          targetBounceY -= 0.02 * anyHit
          // Left/right alternate
          const lat = Math.sin(t * 6) * anyHit * 0.1
          wFL -= lat * frontHit; wFR += lat * frontHit
          wRL -= lat * rearHit; wRR += lat * rearHit
        } else if (obs.type === 'brake') {
          const brakeRamp = 1 - Math.exp(-anyHit * 3)
          targetPitch += 0.05 * brakeRamp  // subtle nose dive
          targetBounceY -= 0.02 * brakeRamp
          // Front compressed, rear unloaded
          wFL -= 0.12 * brakeRamp; wFR -= 0.12 * brakeRamp
          wRL += 0.06 * brakeRamp; wRR += 0.06 * brakeRamp
        } else if (obs.type === 'joint') {
          const impulse = anyHit * anyHit
          targetBounceY += 0.08 * impulse
          targetPitch -= 0.03 * pitchPhase
          // All wheels spike equally
          wFL += 0.12 * frontHit; wFR += 0.12 * frontHit
          wRL += 0.12 * rearHit; wRR += 0.12 * rearHit
        }
      }
    })

    // Lerp body bounce (slow — body follows with delay)
    const BODY_LERP = 0.15
    currentBounce.current.y = THREE.MathUtils.lerp(currentBounce.current.y, targetBounceY, BODY_LERP)
    currentBounce.current.roll = THREE.MathUtils.lerp(currentBounce.current.roll, targetBounceRoll, BODY_LERP)
    currentBounce.current.pitch = THREE.MathUtils.lerp(currentBounce.current.pitch, targetPitch, BODY_LERP)

    // Lerp wheel bounce (fast — wheels respond immediately)
    const WHEEL_LERP = 0.55
    const cw = currentWheels.current
    cw.fl = THREE.MathUtils.lerp(cw.fl, wFL, WHEEL_LERP)
    cw.fr = THREE.MathUtils.lerp(cw.fr, wFR, WHEEL_LERP)
    cw.rl = THREE.MathUtils.lerp(cw.rl, wRL, WHEEL_LERP)
    cw.rr = THREE.MathUtils.lerp(cw.rr, wRR, WHEEL_LERP)

    onBounce?.(
      currentBounce.current.y,
      currentBounce.current.roll,
      currentBounce.current.pitch,
      { ...cw },
    )

    // ── Waves: road roughness baseline + amplified on impact ──
    // Z-wave (ground carpet): roughness + deformation AT each obstacle position
    const zMesh = zWaveRef.current
    if (zMesh) {
      const zGeo = zMesh.geometry
      const zPos = zGeo.attributes.position.array as Float32Array
      const zOrig = zGeo.userData.origPositions as Float32Array

      // Collect obstacle positions for carpet deformation
      const obsPositions: { z: number; x: number; strength: number; type: ObsType }[] = []
      OBSTACLES.forEach((obs, i) => {
        const group = obstacleRefs.current[i]
        if (!group) return
        obsPositions.push({ z: group.position.z, x: obs.x, strength: 1, type: obs.type })
      })

      for (let j = 0; j < zPos.length; j += 3) {
        const vx = zOrig[j], vz = zOrig[j + 2]

        // Road roughness baseline — always alive, multiple harmonics
        const scroll = roadOffset.current * 3 // tie to road movement
        let h = 0.025 * Math.sin(vx * 4 + scroll * 1.2 + t * 0.8)         // slow lateral wave
             + 0.020 * Math.sin(vz * 6 + scroll * 2.0 + t * 1.5)          // faster longitudinal ripple
             + 0.012 * Math.sin(vx * 9 + vz * 7 + t * 2.0)               // fine grain texture
             + 0.008 * Math.sin((vx + vz) * 12 + t * 3.0) * Math.cos(vx * 3 - t * 0.5) // shimmer

        // Add deformation centered on EACH obstacle's current position
        for (const obs of obsPositions) {
          const dx = vx - obs.x
          const dz = vz - obs.z
          const dist = Math.sqrt(dx * dx + dz * dz)

          if (dist < 2.5) {
            const falloff = Math.exp(-dist * 1.5)
            if (obs.type === 'pothole_l' || obs.type === 'pothole_r') {
              h -= 0.12 * falloff  // deep dip
            } else if (obs.type === 'bump') {
              h += 0.10 * falloff  // strong rise
            } else if (obs.type === 'rut') {
              h -= 0.06 * falloff * Math.sin(dx * 8)  // deep grooves
            } else if (obs.type === 'brake') {
              h -= 0.04 * falloff  // weight transfer dip
            } else if (obs.type === 'joint') {
              h += 0.08 * falloff * (dist < 0.4 ? 1 : 0)  // sharp ridge
            }
          }
        }

        zPos[j + 1] = h
      }
      ;(zMesh.material as THREE.MeshBasicMaterial).opacity = 0.3
      zGeo.attributes.position.needsUpdate = true
    }

    // Axle waves: concentric circles under wheels, stronger on hit
    AXLES.forEach((_axle, i) => {
      const mesh = axleRefs[i].current
      if (!mesh) return
      const geo = mesh.geometry
      const posArr = geo.attributes.position.array as Float32Array
      const origArr = geo.userData.origPositions as Float32Array

      const axleImpact = i === 0
        ? Math.abs(currentBounce.current.y) + Math.abs(currentBounce.current.pitch)
        : Math.abs(currentBounce.current.y) + Math.abs(currentBounce.current.pitch) * 0.7

      // Visible circles under wheels + amplified on hit
      const baseAmp = 0.025
      const hitAmp = Math.min(axleImpact * 1.5, MAX_WAVE_HEIGHT)

      for (let j = 0; j < posArr.length; j += 3) {
        const ox = origArr[j], oz = origArr[j + 2]
        const dist = Math.sqrt(ox ** 2 + oz ** 2)
        const damping = Math.exp(-dist * 2.5)
        // Baseline: gentle concentric rings (slow pulse)
        const base = baseAmp * damping * Math.sin(dist * 12 + t * 0.5)
        // Hit: frozen concentric deformation
        const hit = hitAmp * damping * Math.sin(dist * 10)
        posArr[j + 1] = base + hit
      }
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.min(axleImpact * 4, 0.45)
      geo.attributes.position.needsUpdate = true
    })
  })

  if (!visible) return null

  return (
    <group>
      <RoadStrip />

      {/* Scrolling obstacles */}
      {OBSTACLES.map((obs, i) => (
        <group key={obs.type + i} ref={setObstacleRef(i)} position={[obs.x, -0.52, obs.baseZ]}>
          <ObstacleMesh type={obs.type} />
        </group>
      ))}

      {/* Axle wave strips (front + rear) */}
      {AXLES.map((a, i) => (
        <AxleWave key={a.name} pos={a.pos} axleRef={axleRefs[i]} />
      ))}
      <ZWave waveRef={zWaveRef} />
    </group>
  )
}
