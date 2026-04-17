import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  position: [number, number, number]
  label?: string
  value?: string
  severity: number
  color?: string
  active?: boolean
  onClick?: () => void
}

const SPECTRAL = '#EFF2F7'
const INDIGO = '#6B5AE0'
const CHAMPAGNE = '#E6D4A8'
const CRITICAL = '#FF4A4A'

export function Hotspot({ position, severity, color, active, onClick }: Props) {
  const coreRef = useRef<THREE.Mesh>(null)
  const reticleRef = useRef<THREE.Group>(null)
  const outerRingRef = useRef<THREE.Mesh>(null)

  const displayColor = color ?? (severity >= 0.7 ? CRITICAL : active ? INDIGO : SPECTRAL)
  const accentColor = severity >= 0.7 ? CRITICAL : active ? INDIGO : CHAMPAGNE

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pulse = 1 + Math.sin(t * (2 + severity * 3)) * 0.18
    if (coreRef.current) coreRef.current.scale.setScalar(pulse)
    if (reticleRef.current) reticleRef.current.rotation.z = t * 0.35
    if (outerRingRef.current) {
      const breath = 1 + Math.sin(t * 1.2 + severity) * 0.08
      outerRingRef.current.scale.setScalar(breath)
      const mat = outerRingRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.28 + Math.sin(t * 1.5) * 0.12
    }
  })

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[active ? 0.055 : 0.04, 16, 12]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={active ? 1.8 : 1.3}
          transparent
          opacity={0.98}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[active ? 0.095 : 0.075, 16, 12]} />
        <meshBasicMaterial
          color={displayColor}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group ref={reticleRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.14, 0.155, 48]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[0.16, 0.17, 48]} />
          <meshBasicMaterial
            color={SPECTRAL}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, a]} position={[Math.cos(a) * 0.175, 0, Math.sin(a) * 0.175]}>
            <boxGeometry args={[0.022, 0.003, 0.003]} />
            <meshBasicMaterial
              color={SPECTRAL}
              transparent
              opacity={0.75}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.235, 64]} />
        <meshBasicMaterial
          color={displayColor}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
