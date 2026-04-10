import { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import {
  classifyMaterial,
  classifyByNode,
  CATEGORY_SYSTEM_MAP,
  getHoloMaterial,
  getMaterialState,
  type MaterialCategory,
} from './materialClassifier'

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
        const cat = classifyByNode(nodeName) ?? classifyMaterial(matName)
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
    return map
  }, [scene])

  // Step 2: clone, apply materials, and collect wheel refs
  const { clonedScene, wheelRefs, suspRef } = useMemo(() => {
    const clone = scene.clone(true)
    const catCount: Record<string, number> = {}
    const wRefs: WheelRefs = { ПЛ: [], ПП: [], ЗЛ: [], ЗП: [] }
    let sRef: THREE.Object3D | null = null

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nodeName = child.name || ''
        const category = classMap.get(nodeName) || 'other'
        child.userData.materialCategory = category
        child.userData.diagSystem = CATEGORY_SYSTEM_MAP[category]
        child.material = getHoloMaterial(category, 'default')
        catCount[category] = (catCount[category] || 0) + 1

        // Collect wheel assembly refs per corner
        const nl = nodeName.toLowerCase()
        for (const corner of WHEEL_CORNERS) {
          const cl = corner.toLowerCase()
          if (nl.includes(`шина ${cl}`) || nl.includes(`тормоз ${cl}`) ||
              nl.includes(`колесо ${cl}`)) {
            wRefs[corner].push(child)
            break
          }
        }
        // Suspension ref
        if (nl.includes('пневмоподвеска')) sRef = child
      }
    })
    console.table(catCount)
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
      child.material = getHoloMaterial(cat, getMaterialState(cat, activeSystem))
      if (cat === 'interior') {
        child.visible = activeSystem === 'audio' || activeSystem === null
      }
    })
  }, [activeSystem, clonedScene])

  return (
    <group scale={[1, 1, 1]} position={[0, -0.5, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/car.glb`)
