import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DiagSystem } from './materialClassifier'

export type SystemCentroids = Partial<Record<Exclude<DiagSystem, null>, THREE.Vector3>>

export interface HealthScores {
  suspension?: number
  engine?: number
  electrical?: number
  audio?: number
}

// Aerospace severity palette — соответствует feedback_cosmic_design + rules
const COLOR_CRIT = new THREE.Color('#FF4A4A')
const COLOR_WARN = new THREE.Color('#E0B46B')
const COLOR_LIKELY = new THREE.Color('#E6D4A8')

// Порог «всё хорошо» — ниже этого не рендерим halo
const SCORE_OK_THRESHOLD = 80

function colorForScore(score: number): THREE.Color | null {
  if (score >= SCORE_OK_THRESHOLD) return null
  if (score < 40) return COLOR_CRIT
  if (score < 70) return COLOR_WARN
  return COLOR_LIKELY
}

interface HaloProps {
  position: THREE.Vector3
  color: THREE.Color
  phase: number
}

function Halo({ position, color, phase }: HaloProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    const pulse = 0.5 * (1 + Math.sin(t * 1.8))
    if (meshRef.current) {
      const scale = 1 + 0.18 * pulse
      meshRef.current.scale.setScalar(scale)
    }
    if (matRef.current) {
      matRef.current.opacity = 0.22 + 0.28 * pulse
    }
  })

  return (
    <mesh ref={meshRef} position={position.toArray()} renderOrder={10}>
      <sphereGeometry args={[0.28, 24, 16]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

interface SeverityHalosProps {
  centroids: SystemCentroids
  healthScores?: HealthScores | null
}

// Рендерит до 4 пульсирующих halo (suspension/engine/electrical/audio)
// на centroid-ах мешей каждой системы. Цвет — по health_score.
export function SeverityHalos({ centroids, healthScores }: SeverityHalosProps) {
  const halos = useMemo(() => {
    if (!healthScores) return []
    const systems: Array<[keyof HealthScores, number]> = [
      ['suspension', 0],
      ['engine', 0.9],
      ['electrical', 1.7],
      ['audio', 2.4],
    ]
    const out: Array<{ key: string; position: THREE.Vector3; color: THREE.Color; phase: number }> = []
    for (const [sys, phase] of systems) {
      const score = healthScores[sys]
      if (typeof score !== 'number') continue
      const color = colorForScore(score)
      if (!color) continue
      const pos = centroids[sys]
      if (!pos) continue
      out.push({ key: sys, position: pos, color, phase })
    }
    return out
  }, [centroids, healthScores])

  return (
    <>
      {halos.map((h) => (
        <Halo key={h.key} position={h.position} color={h.color} phase={h.phase} />
      ))}
    </>
  )
}
