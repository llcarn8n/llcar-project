import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { theme } from '../../theme'

interface Props {
  position: [number, number, number]
  label?: string
  value?: string
  severity: number // 0-1 (0=ok, 1=critical)
  color?: string
  active?: boolean
  onClick?: () => void
}

export function Hotspot({ position, severity, color, active, onClick }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)

  const displayColor = color ?? (severity < 0.3 ? theme.status.ok : severity < 0.7 ? theme.status.warning : theme.status.critical)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * (2 + severity * 4)) * 0.15
      meshRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[active ? 0.12 : 0.08, 16, 16]} />
        <meshStandardMaterial color={displayColor} emissive={displayColor} emissiveIntensity={active ? 1.2 : 0.8} transparent opacity={0.9} />
      </mesh>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[active ? 0.22 : 0.15, 0.01, 8, 32]} />
        <meshStandardMaterial color={displayColor} emissive={displayColor} emissiveIntensity={active ? 0.8 : 0.5} transparent opacity={active ? 0.7 : 0.4} />
      </mesh>
      {/* Second ring when active */}
      {active && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.30, 0.005, 8, 32]} />
          <meshStandardMaterial color={displayColor} emissive={displayColor} emissiveIntensity={0.3} transparent opacity={0.25} />
        </mesh>
      )}
    </group>
  )
}
