import { OrbitControls } from '@react-three/drei'
import { TOUCH } from 'three'

export function SceneSetup() {
  return (
    <>
      {/* Void fog — совпадает с CSS --c-void #050505 (pure near-black, без синевы) */}
      <fog attach="fog" args={['#050505', 14, 32]} />

      {/* 3-light rig: spectral доминирует + warm/cool kickers как ambient glow, НЕ как заливка */}
      <ambientLight intensity={0.68} color="#EFF2F7" />
      <directionalLight position={[5, 6, 3]} intensity={0.32} color="#E8B870" />
      <directionalLight position={[-5, -2, 3]} intensity={0.42} color="#6A8BAE" />
      <directionalLight position={[0, 8, -4]} intensity={0.4} color="#EFF2F7" />

      {/* Rim light из-за машины — отделяет силуэт от фона */}
      <directionalLight position={[0, 2, -6]} intensity={0.45} color="#8A7AD8" />

      {/* Тонкая indigo ambient подсветка изнутри — nebula mood */}
      <pointLight position={[0, 1.2, 0]} color="#6B5AE0" intensity={0.22} distance={8} decay={2} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={32}
        maxPolarAngle={Math.PI / 2 + 0.3}
        target={[0, 0.3, 0]}
        /* Touch: one-finger rotate, two-finger pinch-zoom. Без pan —
           исключает конфликт со скроллом страницы. */
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
      />
    </>
  )
}
