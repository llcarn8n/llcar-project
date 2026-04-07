import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

export interface AccelSample {
  x_std: number
  y_std: number
  z_std: number
  ts: string
}

interface AccelSphereProps {
  data: AccelSample[]
  size?: number
}

const MAX_POINTS = 200
const SPHERE_RADIUS = 1

const COLOR_LOW = new THREE.Color('#00E676')
const COLOR_MID = new THREE.Color('#FFAB00')
const COLOR_HIGH = new THREE.Color('#FF1744')

function magnitudeColor(t: number): THREE.Color {
  if (t < 0.5) return new THREE.Color().lerpColors(COLOR_LOW, COLOR_MID, t * 2)
  return new THREE.Color().lerpColors(COLOR_MID, COLOR_HIGH, (t - 0.5) * 2)
}

export function AccelSphere({ data, size = 1 }: AccelSphereProps) {
  const groupRef = useRef<THREE.Group>(null)

  const samples = useMemo(() => data.slice(-MAX_POINTS), [data])
  const pointCount = samples.length

  // Auto-scale: find max std across all samples to normalize properly
  const maxStd = useMemo(() => {
    if (pointCount === 0) return 5
    let m = 0
    for (const s of samples) {
      m = Math.max(m, Math.abs(s.x_std), Math.abs(s.y_std), Math.abs(s.z_std))
    }
    return Math.max(m * 1.2, 1) // 20% headroom
  }, [samples, pointCount])

  // Latest sample for HUD overlay
  const latest = samples[pointCount - 1]
  const totalVib = latest ? Math.sqrt(latest.x_std ** 2 + latest.y_std ** 2 + latest.z_std ** 2) : 0

  const { positions, colors, sizes, opacities } = useMemo(() => {
    const pos = new Float32Array(MAX_POINTS * 3)
    const col = new Float32Array(MAX_POINTS * 3)
    const siz = new Float32Array(MAX_POINTS)
    const opa = new Float32Array(MAX_POINTS)

    for (let i = 0; i < pointCount; i++) {
      const sample = samples[i]
      const x = (sample.x_std / maxStd) * SPHERE_RADIUS
      const y = (sample.z_std / maxStd) * SPHERE_RADIUS // Z→up (vertical vibration)
      const z = (sample.y_std / maxStd) * SPHERE_RADIUS

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      const mag = Math.sqrt(x * x + y * y + z * z)
      const normalizedMag = Math.min(mag / SPHERE_RADIUS, 1)
      const color = magnitudeColor(normalizedMag)
      col[i * 3] = color.r
      col[i * 3 + 1] = color.g
      col[i * 3 + 2] = color.b

      const ageFactor = pointCount > 1 ? i / (pointCount - 1) : 1
      siz[i] = 0.03 + 0.02 * ageFactor
      opa[i] = 0.2 + 0.8 * Math.pow(ageFactor, 2.0)
    }

    for (let i = pointCount; i < MAX_POINTS; i++) {
      siz[i] = 0
      opa[i] = 0
    }

    return { positions: pos, colors: col, sizes: siz, opacities: opa }
  }, [samples, pointCount, maxStd])

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      attribute float aSize;
      attribute float aOpacity;
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        vColor = color;
        vOpacity = aOpacity;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha * vOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  }), [])

  // Axis lines
  const axisObjects = useMemo(() => {
    const len = SPHERE_RADIUS * 1.15
    return [
      { pos: new Float32Array([-len, 0, 0, len, 0, 0]), color: '#ef4444' },
      { pos: new Float32Array([0, -len, 0, 0, len, 0]), color: '#60a5fa' },
      { pos: new Float32Array([0, 0, -len, 0, 0, len]), color: '#4ade80' },
    ].map(({ pos, color }) => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 }))
    })
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.elapsedTime * 0.2
  })

  return (
    <group scale={[size, size, size]}>
      <group ref={groupRef}>
        {/* Main wireframe sphere */}
        <mesh>
          <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />
          <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.08} />
        </mesh>

        {/* Normal zone (inner sphere — "safe") */}
        <mesh>
          <sphereGeometry args={[SPHERE_RADIUS * 0.35, 16, 16]} />
          <meshBasicMaterial color="#00E676" wireframe transparent opacity={0.1} />
        </mesh>

        {/* Warning zone ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[SPHERE_RADIUS * 0.65, 0.003, 8, 64]} />
          <meshBasicMaterial color="#FFAB00" transparent opacity={0.15} />
        </mesh>

        {/* Center dot */}
        <mesh>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color="#00E676" transparent opacity={0.9} />
        </mesh>

        {/* Data points */}
        <points>
          <bufferGeometry drawRange={{ start: 0, count: pointCount }}>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
            <bufferAttribute attach="attributes-aOpacity" args={[opacities, 1]} />
          </bufferGeometry>
          <primitive object={shaderMaterial} attach="material" />
        </points>

        {/* Axis lines */}
        {axisObjects.map((obj, i) => <primitive key={i} object={obj} />)}

        {/* Axis labels */}
        <Html position={[SPHERE_RADIUS * 1.25, 0, 0]} style={{ pointerEvents: 'none' }}>
          <span style={{ color: '#ef4444', fontSize: 10, fontFamily: 'Consolas', opacity: 0.7 }}>X бок</span>
        </Html>
        <Html position={[0, SPHERE_RADIUS * 1.25, 0]} style={{ pointerEvents: 'none' }}>
          <span style={{ color: '#60a5fa', fontSize: 10, fontFamily: 'Consolas', opacity: 0.7 }}>Z верт</span>
        </Html>
        <Html position={[0, 0, SPHERE_RADIUS * 1.25]} style={{ pointerEvents: 'none' }}>
          <span style={{ color: '#4ade80', fontSize: 10, fontFamily: 'Consolas', opacity: 0.7 }}>Y перед</span>
        </Html>
      </group>

      {/* HUD overlay — current values */}
      <Html position={[-SPHERE_RADIUS * 1.3, -SPHERE_RADIUS * 0.9, 0]} style={{ pointerEvents: 'none', width: 130 }}>
        <div style={{ fontFamily: 'Consolas, monospace', fontSize: 10, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize: 8, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.1em', marginBottom: 2 }}>ВИБРАЦИЯ</div>
          <div>X: <b style={{ color: '#ef4444' }}>{latest?.x_std?.toFixed(1) ?? '--'}</b> м/с²</div>
          <div>Y: <b style={{ color: '#4ade80' }}>{latest?.y_std?.toFixed(1) ?? '--'}</b> м/с²</div>
          <div>Z: <b style={{ color: '#60a5fa' }}>{latest?.z_std?.toFixed(1) ?? '--'}</b> м/с²</div>
          <div style={{ marginTop: 4, borderTop: '1px solid rgba(0,229,255,0.15)', paddingTop: 3 }}>
            Σ: <b style={{ color: totalVib > 5 ? '#FF1744' : totalVib > 2 ? '#FFAB00' : '#00E676', fontSize: 13 }}>{totalVib.toFixed(1)}</b>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}> м/с²</span>
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
            Плотно = ок<br/>Разброс = тряска<br/>
            {pointCount} точек
          </div>
        </div>
      </Html>
    </group>
  )
}
