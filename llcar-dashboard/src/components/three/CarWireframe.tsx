import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import {
  classifyMaterial,
  classifyByNode,
  CATEGORY_SYSTEM_MAP,
  getHoloMaterial,
  type MaterialCategory,
  type DiagSystem,
} from './materialClassifier'
import type { SystemCentroids } from './SeverityHalos'
import { headlightOrigin } from './AccelWaves'
import { resolvePartByNode, normalizeNodeName } from '../../data/partCatalog'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { PartSpec } from '../../types/rules'

const HOVER_EMISSIVE_COLOR = new THREE.Color('#D4A54A')
const HOVER_EMISSIVE_INTENSITY = 0.42

// Pool of hover-state materials keyed by category, so we don't create a new
// MeshStandardMaterial on every hover event.
const hoverMaterialPool = new Map<MaterialCategory, THREE.Material>()

function getHoverMaterialForCategory(category: MaterialCategory): THREE.Material {
  const cached = hoverMaterialPool.get(category)
  if (cached) return cached
  const base = getHoloMaterial(category, 'default')
  const clone = base.clone()
  const std = clone as THREE.MeshStandardMaterial
  if ('emissive' in std && std.emissive instanceof THREE.Color) {
    std.emissive = HOVER_EMISSIVE_COLOR.clone()
    std.emissiveIntensity = HOVER_EMISSIVE_INTENSITY
  }
  hoverMaterialPool.set(category, clone)
  return clone
}

function findPartSpecInAncestors(obj: THREE.Object3D | null): {
  spec: PartSpec
  node: THREE.Object3D
} | null {
  let current: THREE.Object3D | null = obj
  while (current) {
    const spec = (current.userData?.partSpec ?? null) as PartSpec | null
    if (spec) return { spec, node: current }
    current = current.parent
  }
  return null
}

function findMeshInAncestors(obj: THREE.Object3D | null): THREE.Mesh | null {
  let current: THREE.Object3D | null = obj
  while (current) {
    if (current instanceof THREE.Mesh) return current
    current = current.parent
  }
  return null
}

// Multi-layer hit-test: outer meshes (body, hood) often occlude inner parts
// (engine, battery, HV wiring). Walk intersections and prefer deeper non-body
// hits (engine/interior/chassis) over the first body hit, so hover reveals
// parts behind the hood/body.
function pickPartFromIntersections(
  intersections: ThreeEvent<PointerEvent>['intersections'],
): { spec: PartSpec; node: THREE.Object3D; mesh: THREE.Mesh } | null {
  let firstBody: { spec: PartSpec; node: THREE.Object3D; mesh: THREE.Mesh } | null = null
  const debug: { name: string; cat: string; hasSpec: boolean }[] = []
  for (const hit of intersections) {
    const mesh = findMeshInAncestors(hit.object)
    const cat = (mesh?.userData?.materialCategory as string | undefined) ?? '—'
    const found = findPartSpecInAncestors(hit.object)
    debug.push({ name: hit.object.name || mesh?.name || '?', cat, hasSpec: !!found })
    if (!found || !mesh) continue
    // Body/chrome/glass layers — запомним как fallback, но ищем что-то глубже
    if (cat === 'body' || cat === 'chrome' || cat === 'glass') {
      if (!firstBody) firstBody = { spec: found.spec, node: found.node, mesh }
      continue
    }
    if (typeof window !== 'undefined') (window as any).__lastHover = debug
    return { spec: found.spec, node: found.node, mesh }
  }
  if (typeof window !== 'undefined') (window as any).__lastHover = debug
  return firstBody
}

// Wheel assembly node name patterns per corner
const WHEEL_CORNERS = ['ПЛ', 'ПП', 'ЗЛ', 'ЗП'] as const
export type WheelCorner = typeof WHEEL_CORNERS[number]
export type WheelRefs = Record<WheelCorner, THREE.Object3D[]>

interface CarWireframeProps {
  activeSystem?: string | null
  onWheelRefs?: (refs: WheelRefs, suspRef: THREE.Object3D | null) => void
  onSystemCentroids?: (centroids: SystemCentroids) => void
}

export function CarWireframe({ activeSystem = null, onWheelRefs, onSystemCentroids }: CarWireframeProps) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/car.glb`)
  const setHoveredPart = useDashboardStore((s) => s.setHoveredPart)
  const clearHoveredPart = useDashboardStore((s) => s.clearHoveredPart)

  // Remember the non-hover material for any mesh we've applied a hover clone to,
  // so we can restore it on pointer-out. Keyed by mesh uuid to avoid name clashes.
  const origMaterials = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map())
  const currentlyHovered = useRef<THREE.Mesh | null>(null)

  // Step 1: classify on ORIGINAL scene (material names are intact here)
  const classMap = useMemo(() => {
    const map = new Map<string, MaterialCategory>()
    const wheelNodes: string[] = []
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const matName =
          (Array.isArray(child.material)
            ? child.material[0]?.name
            : child.material?.name) || ''
        const nodeName = child.name || ''
        const nodeCat = classifyByNode(nodeName)
        const matCat = classifyMaterial(matName)
        // Material beats node when material clearly says interior/light but node says body.
        // Fixes inner door panels inside "Дверь_задняя_*_N" (split sub-meshes with koja/torpedka material).
        // НО: для чистых экстерьерных панелей (багажник/капот/крыша/крыло/бампер/порог) node ВСЕГДА побеждает,
        // иначе суб-меши с koja-материалом красятся бежевым и получаются «двухцветные» панели сзади сверху.
        const nl0 = nodeName.toLowerCase()
        const isHardExterior = nl0.includes('багажник') || nl0.includes('капот') ||
          nl0.includes('крыша') || nl0.includes('крыло') || nl0.includes('бампер') ||
          nl0.includes('порог') || nl0.includes('четвертные') || nl0.includes('лючок') ||
          nl0.includes('молдинг') || nl0.includes('накладка')
        let cat: MaterialCategory
        if ((matCat === 'interior' || matCat === 'light') && nodeCat === 'body' && !isHardExterior) {
          cat = matCat
        } else {
          cat = nodeCat ?? matCat
        }
        map.set(nodeName, cat)
        // Discovery: log wheel/suspension/brake nodes
        const nl = nodeName.toLowerCase()
        if (nl.includes('шина') || nl.includes('колес') || nl.includes('колёс') ||
            nl.includes('пневмо') || nl.includes('тормоз') || nl.includes('подвеск') ||
            nl.includes('диск') || nl.includes('wheel') || nl.includes('tire') ||
            nl.includes('суппорт') || nl.includes('полуось') || nl.includes('амортиз')) {
          wheelNodes.push(`${nodeName} [cat=${cat}] pos=(${child.position.x.toFixed(2)},${child.position.y.toFixed(2)},${child.position.z.toFixed(2)})`)
        }
      }
    })
    if (wheelNodes.length > 0) {
      console.group('🛞 Wheel/Suspension nodes in GLB:')
      wheelNodes.forEach(n => console.log(n))
      console.groupEnd()
    }
    // Debug hook: expose full node list for body/light discovery
    if (typeof window !== 'undefined') {
      (window as any).__dumpBodyNodes = (filter?: string) => {
        const out: { name: string; cat: string }[] = []
        scene.traverse((c) => {
          if (c instanceof THREE.Mesh && c.name) {
            const cc = map.get(c.name) ?? 'other'
            if (!filter || c.name.toLowerCase().includes(filter.toLowerCase())) {
              out.push({ name: c.name, cat: cc })
            }
          }
        })
        console.table(out)
        return out
      }
      console.log('[CarWireframe] дебаг: вызови __dumpBodyNodes("фон") / __dumpBodyNodes("стоп") / __dumpBodyNodes() для полного списка')
    }
    return map
  }, [scene])

  // Step 2: clone, apply materials, and collect wheel refs
  const { clonedScene, wheelRefs, suspRef, systemCentroids } = useMemo(() => {
    const clone = scene.clone(true)
    const catCount: Record<string, number> = {}
    const wRefs: WheelRefs = { ПЛ: [], ПП: [], ЗЛ: [], ЗП: [] }
    let sRef: THREE.Object3D | null = null
    let totalNamedNodes = 0
    let partSpecMatches = 0

    const drlMeshes: THREE.Mesh[] = []
    clone.traverse((child) => {
      // Attach partSpec to any named object (groups can carry spec too).
      if (child.name) {
        totalNamedNodes++
        const spec = resolvePartByNode(child.name)
        child.userData.partSpec = spec ?? null
        if (spec) partSpecMatches++
      }
      if (child instanceof THREE.Mesh) {
        const nodeName = child.name || ''
        const category = classMap.get(nodeName) || 'other'
        child.userData.materialCategory = category
        child.userData.diagSystem = CATEGORY_SYSTEM_MAP[category]
        child.material = getHoloMaterial(category, 'default')
        catCount[category] = (catCount[category] || 0) + 1

        // Collect wheel assembly refs per corner.
        // Нормализуем имена — GLB может содержать "Шина ПЛ" (Blender) или "Шина_ПЛ" (glTF export).
        const nl = normalizeNodeName(nodeName)
        for (const corner of WHEEL_CORNERS) {
          const cl = normalizeNodeName(corner)
          if (nl.includes(`шина${cl}`) || nl.includes(`тормоз${cl}`) ||
              nl.includes(`колесо${cl}`)) {
            wRefs[corner].push(child)
            break
          }
        }
        // Suspension ref
        if (nl.includes('пневмоподвеска')) sRef = child
        // Headlight DRL meshes ("Кузов#2 — Дневные ходовые *") — источник света на дорогу
        if (nl.includes('дневныеходовые') || nl.includes('дхо') || nl.includes('ходовойогон')) {
          drlMeshes.push(child)
        }
      }
    })

    // Compute left/right DRL world positions after mount (parent chain needs world matrix)
    if (drlMeshes.length > 0) {
      queueMicrotask(() => {
        const globalBox = new THREE.Box3()
        const leftMeshes: THREE.Mesh[] = []
        const rightMeshes: THREE.Mesh[] = []
        for (const m of drlMeshes) {
          m.updateWorldMatrix(true, false)
          const b = new THREE.Box3().setFromObject(m)
          const c = b.getCenter(new THREE.Vector3())
          if (c.x < 0) leftMeshes.push(m); else rightMeshes.push(m)
          globalBox.expandByObject(m)
        }
        const computeCenter = (list: THREE.Mesh[]): THREE.Vector3 | null => {
          if (list.length === 0) return null
          const box = new THREE.Box3()
          for (const m of list) box.expandByObject(m)
          return box.getCenter(new THREE.Vector3())
        }
        const leftC = computeCenter(leftMeshes)
        const rightC = computeCenter(rightMeshes)
        if (leftC && rightC) {
          headlightOrigin.left.copy(leftC)
          headlightOrigin.right.copy(rightC)
          headlightOrigin.ready = true
        } else if (drlMeshes.length > 0) {
          // Fallback: use global bbox split by median X
          const center = globalBox.getCenter(new THREE.Vector3())
          const min = globalBox.min
          const max = globalBox.max
          headlightOrigin.left.set(min.x + (center.x - min.x) / 2, center.y, max.z)
          headlightOrigin.right.set(center.x + (max.x - center.x) / 2, center.y, max.z)
          headlightOrigin.ready = true
        }
      })
    }
    console.table(catCount)
    console.log(`[CarWireframe] partSpec coverage: ${partSpecMatches} / ${totalNamedNodes} named nodes`)

    // Centroid per diagnostic system — для размещения severity halo
    const boxes: Partial<Record<Exclude<DiagSystem, null>, THREE.Box3>> = {}
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const sys = child.userData.diagSystem as DiagSystem
      if (!sys) return
      const box = boxes[sys] ?? new THREE.Box3()
      box.expandByObject(child)
      boxes[sys] = box
    })
    const centroids: SystemCentroids = {}
    for (const key of Object.keys(boxes) as Array<Exclude<DiagSystem, null>>) {
      const b = boxes[key]
      if (!b || b.isEmpty()) continue
      centroids[key] = b.getCenter(new THREE.Vector3())
    }

    return { clonedScene: clone, wheelRefs: wRefs, suspRef: sRef, systemCentroids: centroids }
  }, [scene, classMap])

  // Pass wheel refs to parent
  useEffect(() => {
    onWheelRefs?.(wheelRefs, suspRef)
  }, [wheelRefs, suspRef, onWheelRefs])

  // Pass system centroids to parent (для размещения severity halo)
  useEffect(() => {
    onSystemCentroids?.(systemCentroids)
  }, [systemCentroids, onSystemCentroids])

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const cat = child.userData.materialCategory
      if (!cat) return
      // Always default state — no dimming, no hiding. Same look on every tab.
      child.material = getHoloMaterial(cat, 'default')
      child.visible = true
    })
  }, [activeSystem, clonedScene])

  const applyHoverMaterial = useCallback((mesh: THREE.Mesh) => {
    if (currentlyHovered.current === mesh) return
    // Restore previous hover mesh first.
    if (currentlyHovered.current) {
      const prev = currentlyHovered.current
      const saved = origMaterials.current.get(prev.uuid)
      if (saved) prev.material = saved
      origMaterials.current.delete(prev.uuid)
    }
    const category = (mesh.userData.materialCategory as MaterialCategory | undefined) ?? 'other'
    if (!origMaterials.current.has(mesh.uuid)) {
      origMaterials.current.set(mesh.uuid, mesh.material)
    }
    mesh.material = getHoverMaterialForCategory(category)
    currentlyHovered.current = mesh
  }, [])

  const restoreHoverMaterial = useCallback(() => {
    const prev = currentlyHovered.current
    if (!prev) return
    const saved = origMaterials.current.get(prev.uuid)
    if (saved) prev.material = saved
    origMaterials.current.delete(prev.uuid)
    currentlyHovered.current = null
  }, [])

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    const picked = pickPartFromIntersections(event.intersections)
    if (!picked) return
    event.stopPropagation()
    applyHoverMaterial(picked.mesh)
    setHoveredPart({
      nodeName: picked.node.name || picked.mesh.name || 'unknown',
      partSpec: picked.spec,
      screenX: event.clientX,
      screenY: event.clientY,
    })
  }, [applyHoverMaterial, setHoveredPart])

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const picked = pickPartFromIntersections(event.intersections)
    if (!picked) return
    // Do not stopPropagation on Move to allow OrbitControls panning etc.
    applyHoverMaterial(picked.mesh)
    setHoveredPart({
      nodeName: picked.node.name || picked.mesh.name || 'unknown',
      partSpec: picked.spec,
      screenX: event.clientX,
      screenY: event.clientY,
    })
  }, [applyHoverMaterial, setHoveredPart])

  const handlePointerOut = useCallback((_event: ThreeEvent<PointerEvent>) => {
    restoreHoverMaterial()
    clearHoveredPart()
  }, [restoreHoverMaterial, clearHoveredPart])

  return (
    <group
      scale={[1, 1, 1]}
      position={[0, -0.5, 0]}
      onPointerOver={handlePointerOver}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <primitive object={clonedScene} />
    </group>
  )
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/car.glb`)
