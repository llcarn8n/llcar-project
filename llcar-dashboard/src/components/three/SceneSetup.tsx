import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function ParticleField() {
  const ref = useRef<THREE.Points>(null)
  const count = 400

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.015
    const arr = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(clock.elapsedTime + i) * 0.001
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#f0f0fa" transparent opacity={0.28} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

const gridFadeMaterial = new THREE.ShaderMaterial({
  transparent: true,
  wireframe: true,
  depthWrite: false,
  uniforms: {
    uColor: { value: new THREE.Color('#1e6091') },
    uMaxOpacity: { value: 0.08 },
    uFadeRadius: { value: 12.0 },
    uClearRadius: { value: 3.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uMaxOpacity;
    uniform float uFadeRadius;
    uniform float uClearRadius;
    varying vec3 vWorldPos;
    void main() {
      float dist = length(vWorldPos.xz);
      float fade = 1.0 - smoothstep(0.0, uFadeRadius, dist);
      float clear = smoothstep(0.0, uClearRadius, dist);
      gl_FragColor = vec4(uColor, uMaxOpacity * fade * fade * clear);
    }
  `,
})

function HoloGrid() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} material={gridFadeMaterial}>
      <planeGeometry args={[30, 30, 30, 30]} />
    </mesh>
  )
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
      <circleGeometry args={[6, 64]} />
      <meshStandardMaterial color={0x060b14} roughness={0.9} metalness={0.1} transparent opacity={0.35} />
    </mesh>
  )
}

export function SceneSetup() {
  return (
    <>
      <fog attach="fog" args={['#060b14', 15, 35]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#cce0ff', '#060b14', 0.3]} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-4, 3, -4]} intensity={0.25} />
      <pointLight position={[0, -1, -4]} color="#FF9F1C" intensity={0.25} />
      <pointLight position={[0, 5, 0]} color="#3b9eff" intensity={0.12} />
      <ParticleField />
      <HoloGrid />
      <GroundPlane />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 + 0.3}
        target={[0, 0.3, 0]}
      />
    </>
  )
}
