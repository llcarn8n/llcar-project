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

interface CarWireframeProps {
  activeSystem?: string | null
}

export function CarWireframe({ activeSystem = null }: CarWireframeProps) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/car.glb`)

  // Step 1: classify on ORIGINAL scene (material names are intact here)
  const classMap = useMemo(() => {
    const map = new Map<string, MaterialCategory>()
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const matName =
          (Array.isArray(child.material)
            ? child.material[0]?.name
            : child.material?.name) || ''
        const nodeName = child.name || ''
        const cat = classifyByNode(nodeName) ?? classifyMaterial(matName)
        map.set(nodeName, cat)
      }
    })
    return map
  }, [scene])

  // Step 2: clone and apply materials using the pre-built classMap
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    const catCount: Record<string, number> = {}
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nodeName = child.name || ''
        const category = classMap.get(nodeName) || 'other'
        child.userData.materialCategory = category
        child.userData.diagSystem = CATEGORY_SYSTEM_MAP[category]
        child.material = getHoloMaterial(category, 'default')
        catCount[category] = (catCount[category] || 0) + 1
      }
    })
    console.table(catCount)
    ;(window as any).__matDebug = catCount
    return clone
  }, [scene, classMap])

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
