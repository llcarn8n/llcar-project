import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { SceneSetup } from './SceneSetup'
import { CarWireframe, type WheelRefs, type WheelCorner } from './CarWireframe'
import { AccelWaves, type AccelSample, type WheelBounce } from './AccelWaves'

interface DiagnosticTwinCanvasProps {
  activeSystem: string | null
  accelData?: AccelSample | null
}

// Shared bounce ref — written by AccelWaves, read by CarBouncer
const bounceRef = { y: 0, roll: 0, pitch: 0 }
const wheelBounceRef: WheelBounce = { fl: 0, fr: 0, rl: 0, rr: 0 }

// Corner → bounce key mapping
const CORNER_KEY: Record<WheelCorner, keyof WheelBounce> = {
  'ПЛ': 'fl', 'ПП': 'fr', 'ЗЛ': 'rl', 'ЗП': 'rr',
}

// Applies bounce to car body + per-wheel pivoted spin (no React re-renders)
function CarBouncer({ activeSystem, groupRef }: {
  activeSystem: string | null
  groupRef: React.RefObject<THREE.Group | null>
}) {
  const suspRefLocal = useRef<THREE.Object3D | null>(null)
  const wheelPivots = useRef<Map<WheelCorner, THREE.Group>>(new Map())
  const pivotOrigY = useRef<Map<WheelCorner, number>>(new Map())
  const origY = useRef<Map<THREE.Object3D, number>>(new Map())
  const wheelRotation = useRef(0)

  const handleWheelRefs = useCallback((refs: WheelRefs, susp: THREE.Object3D | null) => {
    suspRefLocal.current = susp
    origY.current.clear()
    pivotOrigY.current.clear()
    for (const pv of wheelPivots.current.values()) pv.parent?.remove(pv)
    wheelPivots.current.clear()

    const parent = groupRef.current
    if (!parent) return
    parent.updateMatrixWorld(true)

    for (const corner of Object.keys(refs) as WheelCorner[]) {
      const meshes = refs[corner]
      if (meshes.length === 0) continue

      // Pivot = center of TIRE only (шина is symmetric around axle).
      // Using full bbox pulls pivot below axle (brake/caliper) → wheel swings below ground.
      const tires = meshes.filter(m => (m.name ?? '').toLowerCase().includes('шина'))
      const pivotSources = tires.length > 0 ? tires : meshes
      const box = new THREE.Box3()
      for (const m of pivotSources) box.expandByObject(m)
      const worldCenter = box.getCenter(new THREE.Vector3())

      const pivot = new THREE.Group()
      pivot.name = `wheelPivot_${corner}`
      pivot.position.copy(worldCenter)
      parent.worldToLocal(pivot.position)
      parent.add(pivot)
      for (const m of meshes) pivot.attach(m)

      wheelPivots.current.set(corner, pivot)
      pivotOrigY.current.set(corner, pivot.position.y)
    }
    if (susp) origY.current.set(susp, susp.position.y)
  }, [groupRef])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    groupRef.current.position.y = -0.15 + bounceRef.y
    groupRef.current.rotation.z = bounceRef.roll
    groupRef.current.rotation.x = bounceRef.pitch

    const brakeAmount = Math.abs(bounceRef.pitch) / 0.05
    const spinSpeed = Math.max(1 - brakeAmount * 0.9, 0.1)
    wheelRotation.current += delta * 3.0 * spinSpeed

    for (const [corner, pivot] of wheelPivots.current) {
      const key = CORNER_KEY[corner]
      const oy = pivotOrigY.current.get(corner) ?? pivot.position.y
      pivot.position.y = oy + wheelBounceRef[key]
      pivot.rotation.x = wheelRotation.current
    }

    const susp = suspRefLocal.current
    if (susp) {
      const maxGap = Math.max(
        Math.abs(wheelBounceRef.fl - bounceRef.y),
        Math.abs(wheelBounceRef.fr - bounceRef.y),
        Math.abs(wheelBounceRef.rl - bounceRef.y),
        Math.abs(wheelBounceRef.rr - bounceRef.y),
      )
      susp.scale.y = THREE.MathUtils.lerp(1.0, 0.6, Math.min(maxGap * 8, 1))
    }
  })

  return (
    <group ref={groupRef}>
      <CarWireframe activeSystem={activeSystem} onWheelRefs={handleWheelRefs} />
    </group>
  )
}

function HorizonBloom() {
  // Flat plane below car with radial amber gradient — evokes luxury-auto HUD horizon
  return (
    <mesh position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[4.5, 64]} />
      <meshBasicMaterial
        color="#FF9F1C"
        transparent
        opacity={0.09}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function SceneContent({
  activeSystem, accelData,
}: DiagnosticTwinCanvasProps) {
  const carGroupRef = useRef<THREE.Group>(null)

  const handleBounce = useCallback((y: number, roll: number, pitch: number, wheels: WheelBounce) => {
    bounceRef.y = y
    bounceRef.roll = roll
    bounceRef.pitch = pitch
    wheelBounceRef.fl = wheels.fl
    wheelBounceRef.fr = wheels.fr
    wheelBounceRef.rl = wheels.rl
    wheelBounceRef.rr = wheels.rr
  }, [])

  return (
    <>
      <SceneSetup />
      <HorizonBloom />
      <CarBouncer activeSystem={activeSystem} groupRef={carGroupRef} />
      <AccelWaves
        accelData={accelData ?? null}
        visible={true}
        onBounce={handleBounce}
      />
    </>
  )
}

export default function DiagnosticTwinCanvas(props: DiagnosticTwinCanvasProps) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  return (
    <Canvas camera={{ position: [5, 2.5, 5], fov: 38 }} style={{ background: 'transparent' }}>
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
