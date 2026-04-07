import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function CarWireframe() {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/car.glb`)
  // Apply wireframe material to all meshes
  useMemo(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#00E5FF',
          wireframe: true,
          transparent: true,
          opacity: 0.4,
          emissive: '#00E5FF',
          emissiveIntensity: 0.3,
        })
      }
    })
  }, [scene])

  return (
    <group scale={[1, 1, 1]} position={[0, -0.5, 0]}>
      <primitive object={scene.clone()} />
    </group>
  )
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/car.glb`)
