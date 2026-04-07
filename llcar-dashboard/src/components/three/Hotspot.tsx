import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { theme } from '../../theme'

interface Props {
  position: [number, number, number]
  label: string
  value: string
  severity: number // 0-1 (0=ok, 1=critical)
  onClick?: () => void
}

export function Hotspot({ position, label, value, severity, onClick }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)

  const color = severity < 0.3 ? theme.status.ok : severity < 0.7 ? theme.status.warning : theme.status.critical

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * (2 + severity * 4)) * 0.15
      meshRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.9} />
      </mesh>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.01, 8, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.4} />
      </mesh>
      {/* Label */}
      <Html position={[0.3, 0.2, 0]} center distanceFactor={5}>
        <div
          className="px-2 py-1 rounded text-xs font-mono whitespace-nowrap pointer-events-none select-none"
          style={{
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: `1px solid ${color}44`,
            color: color,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="font-bold">{label}</div>
          <div style={{ color: 'white' }}>{value}</div>
        </div>
      </Html>
    </group>
  )
}
