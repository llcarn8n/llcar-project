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
} from './materialClassifier'
import { resolvePartByNode } from '../../data/partCatalog'
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
// (engine, battery, HV wiring). Walk intersections sorted by distance and pick
// the first one that resolves to a PartSpec in its ancestry.
function pickPartFromIntersections(
  intersections: ThreeEvent<PointerEvent>['intersections'],
): { spec: PartSpec; node: THREE.Object3D; mesh: THREE.Mesh } | null {
  for (const hit of intersections) {
    const found = findPartSpecInAncestors(hit.object)
    if (!found) continue
    const mesh = findMeshInAncestors(hit.object)
    if (!mesh) continue
    return { spec: found.spec, node: found.node, mesh }
  }
  return null
}

// Wheel assembly node name patterns per corner
const WHEEL_CORNERS = ['ПЛ', 'ПП', 'ЗЛ', 'ЗП'] as const
export type WheelCorner = typeof WHEEL_CORNERS[number]
export type WheelRefs = Record<WheelCorner, THREE.Object3D[]>

interface CarWireframeProps {
  activeSystem?: string | null
  onWheelRefs?: (refs: WheelRefs, suspRef: THREE.Object3D | null) => void
}

export function CarWireframe({ activeSystem = null, onWheelRefs }: CarWireframeProps) {
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
  const { clonedScene, wheelRefs, suspRef } = useMemo(() => {
    const clone = scene.clone(true)
    const catCount: Record<string, number> = {}
    const wRefs: WheelRefs = { ПЛ: [], ПП: [], ЗЛ: [], ЗП: [] }
    let sRef: THREE.Object3D | null = null
    let totalNamedNodes = 0
    let partSpecMatches = 0

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

        // Collect wheel assembly refs per corner
        // GLB export uses underscores: Шина_ПЛ, Колесо_ПП_—_Обшивка, Тормоз_ЗЛ
        const nl = nodeName.toLowerCase()
        for (const corner of WHEEL_CORNERS) {
          const cl = corner.toLowerCase()
          if (nl.includes(`шина_${cl}`) || nl.includes(`тормоз_${cl}`) ||
              nl.includes(`колесо_${cl}`)) {
            wRefs[corner].push(child)
            break
          }
        }
        // Suspension ref
        if (nl.includes('пневмоподвеска')) sRef = child
      }
    })
    console.table(catCount)
    console.log(`[CarWireframe] partSpec coverage: ${partSpecMatches} / ${totalNamedNodes} named nodes`)
    return { clonedScene: clone, wheelRefs: wRefs, suspRef: sRef }
  }, [scene, classMap])

  // Pass wheel refs to parent
  useEffect(() => {
    onWheelRefs?.(wheelRefs, suspRef)
  }, [wheelRefs, suspRef, onWheelRefs])

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
