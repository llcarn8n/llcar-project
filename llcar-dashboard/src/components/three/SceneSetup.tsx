import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, N8AO } from '@react-three/postprocessing'
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
      <pointsMaterial size={0.05} color="#00E5FF" transparent opacity={0.85} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

const gridFadeMaterial = new THREE.ShaderMaterial({
  transparent: true,
  wireframe: true,
  depthWrite: false,
  uniforms: {
    uColor: { value: new THREE.Color('#00E5FF') },
    uMaxOpacity: { value: 0.12 },
    uFadeRadius: { value: 12.0 },
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
    varying vec3 vWorldPos;
    void main() {
      float dist = length(vWorldPos.xz);
      float fade = 1.0 - smoothstep(0.0, uFadeRadius, dist);
      gl_FragColor = vec4(uColor, uMaxOpacity * fade * fade);
    }
  `,
})

function HoloGrid() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} material={gridFadeMaterial}>
      <planeGeometry args={[30, 30, 30, 30]} />
    </mesh>
  )
}

export function SceneSetup() {
  return (
    <>
      {/* Exponential fog for depth fade */}
      <fogExp2 attach="fog" args={['#050A0F', 0.08]} />

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <pointLight position={[-3, 2, -3]} color="#00E5FF" intensity={0.4} />
      <ParticleField />
      <HoloGrid />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        autoRotate={false}
        minDistance={3}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2 + 0.3}
      />
      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <N8AO
          aoRadius={0.5}
          intensity={0.5}
          quality="performance"
          halfRes
          color="#050A0F"
          distanceFalloff={1.0}
        />
      </EffectComposer>
    </>
  )
}
