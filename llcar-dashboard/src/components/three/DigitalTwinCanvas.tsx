import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { SceneSetup } from './SceneSetup'
import { CarWireframe } from './CarWireframe'

/**
 * Lazy-loadable wrapper for the 3D Digital Twin section.
 * Keeps Canvas + SceneSetup + CarWireframe in a single async chunk
 * so Three.js is not included in the main bundle.
 */
export default function DigitalTwinCanvas() {
  return (
    <Canvas camera={{ position: [5, 2.5, 5], fov: 42 }} style={{ background: 'transparent' }}>
      <Suspense fallback={null}>
        <SceneSetup />
        <CarWireframe />
      </Suspense>
    </Canvas>
  )
}
