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
  color?: string
  active?: boolean
  onClick?: () => void
}

export function Hotspot({ position, label, value, severity, color, active, onClick }: Props) {
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
      {/* Label */}
      <Html position={[0.3, 0.2, 0]} center distanceFactor={5}>
        <div
          className="px-2 py-1 rounded text-xs font-mono whitespace-nowrap select-none"
          style={{
            backgroundColor: 'rgba(6, 18, 30, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${displayColor}50`,
            borderLeft: `3px solid ${displayColor}`,
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
            color: displayColor,
            boxShadow: `0 0 15px ${displayColor}30`,
            cursor: 'pointer',
            pointerEvents: 'auto' as const,
          }}
        >
          <div className="font-bold">{label}</div>
          <div style={{ color: 'white' }}>{value}</div>
        </div>
      </Html>
    </group>
  )
}
