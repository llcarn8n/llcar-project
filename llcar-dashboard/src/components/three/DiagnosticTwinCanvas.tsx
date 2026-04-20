import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { SceneSetup } from './SceneSetup'
import { CarWireframe, type WheelRefs, type WheelCorner } from './CarWireframe'
import { AccelWaves, type AccelSample, type WheelBounce } from './AccelWaves'
import { SeverityHalos, type SystemCentroids, type HealthScores } from './SeverityHalos'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { DiagSystem } from './materialClassifier'

interface DiagnosticTwinCanvasProps {
  activeSystem: string | null
  accelData?: AccelSample | null
  speedKmh?: number | null
  healthScores?: HealthScores | null
}

// Визуальный радиус шины GLB (~0.33 м) и верхний кап для читабельности
const WHEEL_RADIUS_M = 0.33
const VISUAL_OMEGA_MAX = 15

// Shared bounce ref — written by AccelWaves, read by CarBouncer
const bounceRef = { y: 0, roll: 0, pitch: 0 }
const wheelBounceRef: WheelBounce = { fl: 0, fr: 0, rl: 0, rr: 0 }

// Corner → bounce key mapping
const CORNER_KEY: Record<WheelCorner, keyof WheelBounce> = {
  'ПЛ': 'fl', 'ПП': 'fr', 'ЗЛ': 'rl', 'ЗП': 'rr',
}

// Shared speed ref — parent пишет при каждом ре-рендере, useFrame читает без re-render
const speedRef = { kmh: 0 }

// Маппинг rule_name → диагностическая система по ключевым словам
// (fallback: null — автопилот не меняет камеру для этого правила).
function ruleNameToSystem(ruleName: string | null | undefined): Exclude<DiagSystem, null> | null {
  if (!ruleName) return null
  const n = ruleName.toLowerCase()
  if (n.includes('suspen') || n.includes('подвеск') || n.includes('wheel') ||
      n.includes('колес') || n.includes('колёс') || n.includes('brake') ||
      n.includes('тормоз') || n.includes('шасс') || n.includes('rumble') ||
      n.includes('bounce') || n.includes('strut') || n.includes('damper')) return 'suspension'
  if (n.includes('engine') || n.includes('двигат') || n.includes('мотор') ||
      n.includes('misfire') || n.includes('idle') || n.includes('coolant') ||
      n.includes('turbo') || n.includes('oil') || n.includes('fuel') ||
      n.includes('p0')) return 'engine'
  if (n.includes('electr') || n.includes('электр') || n.includes('battery') ||
      n.includes('аккум') || n.includes('charg') || n.includes('volt') ||
      n.includes('alternator') || n.includes('generator')) return 'electrical'
  if (n.includes('audio') || n.includes('звук') || n.includes('аудио') ||
      n.includes('noise') || n.includes('шум') || n.includes('сабвуфер')) return 'audio'
  return null
}

// Default orbit position + target (совпадает с Canvas camera defaults)
const DEFAULT_CAM_POS_DESKTOP = new THREE.Vector3(5.9, 2.0, 2.6)
const DEFAULT_CAM_POS_MOBILE = new THREE.Vector3(8.0, 2.7, 3.8)
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0)

// Плавный перелёт камеры к системе активного диагноза.
// Работает только во время активного «перелёта»; по достижении цели отпускает
// OrbitControls, чтобы пользователь мог свободно крутить/зумить компонент.
// При закрытии drawer / смене системы — начинается новый перелёт.
function CameraAutopilot({ centroids, isMobile }: {
  centroids: SystemCentroids
  isMobile: boolean
}) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as
    | { target: THREE.Vector3; enabled: boolean; update: () => void }
    | null
  const activeRuleDrawer = useDashboardStore((s) => s.activeRuleDrawer)
  const targetPos = useRef(new THREE.Vector3().copy(isMobile ? DEFAULT_CAM_POS_MOBILE : DEFAULT_CAM_POS_DESKTOP))
  const targetLook = useRef(new THREE.Vector3(0, 0.3, 0))
  const isPiloting = useRef(false)

  useEffect(() => {
    const system = ruleNameToSystem(activeRuleDrawer?.ruleName ?? null)
    const defaultPos = isMobile ? DEFAULT_CAM_POS_MOBILE : DEFAULT_CAM_POS_DESKTOP
    if (!system || !centroids[system]) {
      // Drawer закрыт или правило не матчится — ничего не трогаем, отпускаем контроль
      isPiloting.current = false
      if (controls) controls.enabled = true
      return
    }
    // Halos рендерятся со смещением [0,-0.5,0], учитываем для lookAt
    const centroid = centroids[system]!.clone()
    centroid.y += -0.5
    targetLook.current.copy(centroid)
    // Камеру ставим в стороне от centroid — 3.2м по направлению из defaultPos
    const offset = defaultPos.clone().sub(DEFAULT_TARGET).normalize().multiplyScalar(3.2)
    targetPos.current.copy(centroid).add(offset)
    isPiloting.current = true
    if (controls) controls.enabled = false
  }, [activeRuleDrawer, centroids, isMobile, controls])

  useFrame((_, delta) => {
    if (!isPiloting.current) return
    const lerpAmount = Math.min(1, delta * 3.5)
    camera.position.lerp(targetPos.current, lerpAmount)
    if (controls) {
      controls.target.lerp(targetLook.current, lerpAmount)
      controls.update()
    } else {
      camera.lookAt(targetLook.current)
    }
    // По достижении цели отпускаем контроль — пользователь уточнит обзор сам
    if (camera.position.distanceTo(targetPos.current) < 0.05) {
      isPiloting.current = false
      if (controls) controls.enabled = true
    }
  })

  return null
}

// Applies bounce to car body + per-wheel pivoted spin (no React re-renders)
function CarBouncer({ activeSystem, groupRef, onSystemCentroids }: {
  activeSystem: string | null
  groupRef: React.RefObject<THREE.Group | null>
  onSystemCentroids?: (c: SystemCentroids) => void
}) {
  const suspRefLocal = useRef<THREE.Object3D | null>(null)
  const wheelPivots = useRef<Map<WheelCorner, THREE.Group>>(new Map())
  const pivotOrigY = useRef<Map<WheelCorner, number>>(new Map())
  const pivotAxle = useRef<Map<WheelCorner, 'x' | 'y' | 'z'>>(new Map())
  const origY = useRef<Map<THREE.Object3D, number>>(new Map())
  const wheelRotation = useRef(0)
  // Base Y чтобы низ шины лежал ровно на плоскости дороги (-0.52). Авто-калибровка после загрузки мешей.
  const baseCarY = useRef(-0.15)

  const handleWheelRefs = useCallback((refs: WheelRefs, susp: THREE.Object3D | null) => {
    suspRefLocal.current = susp
    origY.current.clear()
    pivotOrigY.current.clear()
    pivotAxle.current.clear()
    for (const pv of wheelPivots.current.values()) pv.parent?.remove(pv)
    wheelPivots.current.clear()

    const parent = groupRef.current
    if (!parent) return
    parent.updateMatrixWorld(true)

    // Замер самой низкой точки шин в мире ДО перепарентинга в pivot.
    const globalTireBox = new THREE.Box3()
    let hasTire = false
    for (const corner of Object.keys(refs) as WheelCorner[]) {
      const tires = refs[corner].filter(m => (m.name ?? '').toLowerCase().includes('шина'))
      for (const m of tires) { globalTireBox.expandByObject(m); hasTire = true }
    }
    if (hasTire) {
      // Хотим: minTireWorldY = -0.52 (уровень дороги). Car Y сейчас = parent.position.y.
      // delta = -0.52 - minTireWorldY, новая base = parent.position.y + delta.
      baseCarY.current = parent.position.y + (-0.52 - globalTireBox.min.y)
    }

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
      const size = box.getSize(new THREE.Vector3())

      // Car wheels spin around lateral axis → в world всегда X.
      // Если bbox-detection путается на некоторых колёсах (mixed sub-mesh sizes),
      // жёстко задаём X — стандарт автомобильной геометрии.
      void size
      const axle: 'x' | 'y' | 'z' = 'x'

      const pivot = new THREE.Group()
      pivot.name = `wheelPivot_${corner}`
      pivot.position.copy(worldCenter)
      parent.worldToLocal(pivot.position)
      parent.add(pivot)
      for (const m of meshes) pivot.attach(m)

      wheelPivots.current.set(corner, pivot)
      pivotOrigY.current.set(corner, pivot.position.y)
      pivotAxle.current.set(corner, axle)
    }
    if (susp) origY.current.set(susp, susp.position.y)
  }, [groupRef])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    groupRef.current.position.y = baseCarY.current + bounceRef.y
    groupRef.current.rotation.z = bounceRef.roll
    groupRef.current.rotation.x = bounceRef.pitch

    const brakeAmount = Math.abs(bounceRef.pitch) / 0.05
    const spinSpeed = Math.max(1 - brakeAmount * 0.9, 0.1)
    // Если есть реальная скорость — используем её как ω = v/R (cap для визуальной читабельности).
    // Нет данных → idle-анимация (3.0 rad/s), чтобы сцена не выглядела мёртвой на пустом клиенте.
    const kmh = speedRef.kmh
    const omega = kmh > 0
      ? Math.min((kmh / 3.6) / WHEEL_RADIUS_M, VISUAL_OMEGA_MAX)
      : 3.0
    wheelRotation.current += delta * omega * spinSpeed

    for (const [corner, pivot] of wheelPivots.current) {
      const key = CORNER_KEY[corner]
      const oy = pivotOrigY.current.get(corner) ?? pivot.position.y
      pivot.position.y = oy + wheelBounceRef[key]
      const axle = pivotAxle.current.get(corner) ?? 'x'
      pivot.rotation.set(0, 0, 0)
      pivot.rotation[axle] = wheelRotation.current
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
      <CarWireframe
        activeSystem={activeSystem}
        onWheelRefs={handleWheelRefs}
        onSystemCentroids={onSystemCentroids}
      />
    </group>
  )
}

function SceneContent({
  activeSystem, accelData, speedKmh, healthScores, isMobile,
}: DiagnosticTwinCanvasProps & { isMobile: boolean }) {
  const carGroupRef = useRef<THREE.Group>(null)
  const [centroids, setCentroids] = useState<SystemCentroids>({})
  // Синхронизируем в shared ref перед каждым кадром, чтобы useFrame читал актуальное
  speedRef.kmh = typeof speedKmh === 'number' && Number.isFinite(speedKmh) ? speedKmh : 0

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
      <CarBouncer
        activeSystem={activeSystem}
        groupRef={carGroupRef}
        onSystemCentroids={setCentroids}
      />
      {/* Halos — сиблинг CarWireframe'а внутри группы CarBouncer'а,
          чтобы наследовать bounce/roll/pitch. Offset [0,-0.5,0] повторяет
          position primitive-группы внутри CarWireframe. */}
      <group position={[0, -0.5, 0]}>
        <SeverityHalos centroids={centroids} healthScores={healthScores ?? null} />
      </group>
      <CameraAutopilot centroids={centroids} isMobile={isMobile} />
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
    <Canvas
      camera={isMobile
        ? { position: [8.0, 2.7, 3.8], fov: 44 }
        : { position: [5.9, 2.0, 2.6], fov: 36 }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} isMobile={isMobile} />
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
