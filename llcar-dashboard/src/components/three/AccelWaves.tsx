import { useRef, useMemo, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// ── Types ──

export interface AccelSample {
  x_std: number
  y_std: number
  z_std: number
}

export interface WheelBounce {
  fl: number; fr: number; rl: number; rr: number
}

interface AccelWavesProps {
  accelData: AccelSample | null
  visible?: boolean
  onBounce?: (y: number, roll: number, pitch: number, wheels: WheelBounce) => void
}

// ── Constants ──

const SCROLL_SPEED = 0.5
const LOOP_LENGTH = 36

// All vibration types
type ObsType = 'pothole_l' | 'pothole_r' | 'bump' | 'rut' | 'brake' | 'joint'

const OBSTACLES: { type: ObsType; baseZ: number; x: number; label: string; sub: string }[] = [
  { type: 'pothole_l', baseZ: 0,  x: -0.6, label: '⬇ Яма слева',        sub: 'Z ↓ + крен влево' },
  { type: 'bump',      baseZ: 6,  x: 0,    label: '⬆ Лежачий полицейский', sub: 'Z ↑ удар снизу' },
  { type: 'pothole_r', baseZ: 12, x: 0.6,  label: '⬇ Яма справа',       sub: 'Z ↓ + крен вправо' },
  { type: 'rut',       baseZ: 18, x: 0,    label: '↔ Колея',             sub: 'X ↔ боковой увод' },
  { type: 'brake',     baseZ: 24, x: 0,    label: '⏹ Резкое торможение',  sub: 'Y ↑ клевок вперёд' },
  { type: 'joint',     baseZ: 30, x: 0,    label: '▬ Стык дороги',       sub: 'Z ↑ короткий удар' },
]


// Shared headlight origin — CarWireframe пишет сюда мировые позиции DRL-мэшей
// ("Кузов#2_—_Дневные_ходовые_"), HeadlightGlow использует их для позиционирования лучей.
export const headlightOrigin = {
  left:  new THREE.Vector3(-0.52, 0.32, 1.9),
  right: new THREE.Vector3( 0.52, 0.32, 1.9),
  ready: false,
}

// ── Headlight glow on road (первый вариант — радиальные пятна) ──

function createHeadlightTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0.00, 'rgba(255,248,220,0.95)')
  grad.addColorStop(0.35, 'rgba(255,240,200,0.55)')
  grad.addColorStop(0.65, 'rgba(245,220,170,0.18)')
  grad.addColorStop(1.00, 'rgba(200,170,120,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function HeadlightGlow() {
  const tex = useMemo(() => createHeadlightTexture(), [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [tex])

  useEffect(() => {
    return () => { tex.dispose(); material.dispose() }
  }, [tex, material])

  return (
    <group position={[0, 0.005, 0]} renderOrder={2}>
      <mesh position={[-0.48, 0, 3.0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.1, 2.6, 1]} material={material}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh position={[0.48, 0, 3.0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.1, 2.6, 1]} material={material}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh position={[0, 0, 2.7]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.6, 2.0, 1]} material={material}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  )
}

// ── Road strip ──

function RoadStrip() {
  const roadMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#22242A',
    side: THREE.DoubleSide,
  }), [])

  const lineMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#EFF2F7',
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  }), [])

  useEffect(() => {
    return () => { roadMaterial.dispose(); lineMaterial.dispose() }
  }, [roadMaterial, lineMaterial])

  return (
    <group position={[0, -0.52, 0]}>
      {/* Road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={roadMaterial}>
        <planeGeometry args={[2.5, 24]} />
      </mesh>
      {/* Left edge line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.001, 0]} material={lineMaterial}>
        <planeGeometry args={[0.03, 24]} />
      </mesh>
      {/* Right edge line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.001, 0]} material={lineMaterial}>
        <planeGeometry args={[0.03, 24]} />
      </mesh>
      {/* Center dashed line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} material={lineMaterial}>
        <planeGeometry args={[0.02, 24]} />
      </mesh>
      {/* Headlights beam glow on road */}
      <HeadlightGlow />
    </group>
  )
}

// ── Obstacle mesh — real 3D geometry with Y-displacement ──
// Потхолы = реальная впадина (dark floor ниже дороги + torus rim),
// bumps = реальная выпуклость (half-dome выше дороги),
// joints = поперечный ridge (тонкий box над дорогой).
// Родительский group помещает obstacle в y=-0.52 (road surface), поэтому
// локальный Y=0 = плоскость дороги, -Y = провал, +Y = выпуклость.

const VOID_CENTER = '#0A0A0C'    // дно ямы — чёрный провал
const BUMP_MID    = '#1A1A1E'    // тело бугра — асфальт-чёрный
const RIM_COLOR   = '#EFF2F7'    // spectral край — яркий контур

// Canvas-текстура с радиальным градиентом: светлее по внешнему ободу,
// полный чёрный в центре. Это даёт зрителю ощущение глубины ямы
// даже когда камера смотрит под небольшим углом.
// Kept as exports — used by potential alt-pothole rendering modes.
let _potholeFloorTexture: THREE.CanvasTexture | null = null
export function getPotholeFloorTexture(): THREE.CanvasTexture {
  if (_potholeFloorTexture) return _potholeFloorTexture
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const cx = size / 2
    const cy = size / 2
    const grad = ctx.createRadialGradient(cx, cy, size * 0.02, cx, cy, size * 0.5)
    grad.addColorStop(0, '#000000')
    grad.addColorStop(0.35, '#030304')
    grad.addColorStop(0.75, '#0b0c0e')
    grad.addColorStop(1, '#1f2024')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  _potholeFloorTexture = tex
  return tex
}

// Градиент на стенках: у верха — светло-серый освещённый асфальт,
// у основания — чернота. Линейная текстура (UV.v от 0 сверху до 1 снизу).
let _potholeWallTexture: THREE.CanvasTexture | null = null
export function getPotholeWallTexture(): THREE.CanvasTexture {
  if (_potholeWallTexture) return _potholeWallTexture
  const w = 4
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#3a3b3f')       // подсвеченный край сверху
    grad.addColorStop(0.18, '#1a1b1d')
    grad.addColorStop(0.6, '#08090b')
    grad.addColorStop(1, '#010102')       // абсолютная чернота у дна
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.anisotropy = 4
  _potholeWallTexture = tex
  return tex
}

// Displaced road patch — реальный 3D-кратер в геометрии.
// Плоскость 1.0×0.8 м с тесселяцией 64×48 вершин. Вершины, попадающие
// в эллиптический радиус ямы, смещаются вниз по cosine-bell falloff +
// небольшой noise для органики. Normals пересчитываются — освещение
// показывает глубину корректно под любым углом камеры.
function PotholePit() {
  const geometry = useMemo(() => {
    const W = 1.0, H = 0.8
    const SEG_X = 64, SEG_Z = 48
    const geo = new THREE.PlaneGeometry(W, H, SEG_X, SEG_Z)
    geo.rotateX(-Math.PI / 2) // положить горизонтально

    const positions = geo.attributes.position
    const RX = 0.34       // горизонтальный радиус ямы
    const RZ = 0.22       // продольный радиус ямы (яма эллиптическая)
    const DEPTH = 0.35    // глубина 35 см

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      // Эллиптическая нормализованная дистанция (0 в центре, 1 на границе)
      const d = Math.sqrt((x / RX) ** 2 + (z / RZ) ** 2)
      if (d >= 1) continue
      // Cosine-bell falloff: плавный спуск в центр, вертикальная стенка на границе
      const t = d
      const bell = 0.5 * (Math.cos(Math.PI * t) + 1) // 1 в центре, 0 на границе
      // Внутренняя ямка (плоская глубокая часть 60% радиуса)
      const inner = t < 0.6 ? 1 : bell * (1 - (t - 0.6) / 0.4 * 0.3)
      const y = -DEPTH * inner
      // Органический noise по периметру — рваный асфальт
      const rimNoise = t > 0.85
        ? (Math.sin(x * 50) * Math.cos(z * 45) + Math.sin(x * 20 + z * 30)) * 0.015
        : 0
      positions.setY(i, y + rimNoise)
    }
    positions.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [])

  // Single dark mesh с normals — освещение делает всю работу
  return (
    <group position={[0, 0.001, 0]}>
      {/* Сам deformed road patch */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#1a1b1e"
          roughness={0.98}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Дополнительная pure-black плоскость на дне — гарантированная чернота глубины */}
      <mesh position={[0, -0.345, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

function ObstacleMesh({ type }: { type: ObsType }) {
  if (type === 'pothole_l' || type === 'pothole_r') {
    // Яма: НАСТОЯЩЕЕ 3D-углубление в плоскости дороги.
    // Берём PlaneGeometry с высокой тесселяцией (64×48 вершин), поворачиваем в
    // горизонтальную плоскость и смещаем ВНИЗ вершины, попадающие в радиус ямы,
    // по cosine-bell falloff. Получается реальный кратер — с правильными normals,
    // тенями от направленного света, и видимой глубиной под любым углом камеры.
    return <PotholePit />
  }
  if (type === 'bump') {
    // Лежачий полицейский: реальный half-dome, вытянутый поперёк дороги (по X),
    // приподнят на 0.08 над road. Spectral rim по периметру основания.
    return (
      <group>
        {/* Основной купол — half-sphere scaled flat + elongated */}
        <mesh position={[0, 0, 0]} scale={[1.6, 0.45, 0.6]}>
          <sphereGeometry args={[0.38, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={BUMP_MID} roughness={0.55} metalness={0.35} />
        </mesh>
        {/* Spectral highlight по rim купола */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.6, 0.6, 1]}>
          <torusGeometry args={[0.38, 0.010, 8, 48]} />
          <meshBasicMaterial color={RIM_COLOR} transparent opacity={0.85} />
        </mesh>
        {/* Тонкая spectral полоса сверху купола — hi-contrast */}
        <mesh position={[0, 0.175, 0]} scale={[1.4, 1, 1]}>
          <boxGeometry args={[0.45, 0.004, 0.08]} />
          <meshBasicMaterial color={RIM_COLOR} transparent opacity={0.6} />
        </mesh>
      </group>
    )
  }

  if (type === 'joint') {
    // Стык дороги: тонкий поперечный ridge — раскалённый шов
    return (
      <group>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[2.4, 0.018, 0.05]} />
          <meshStandardMaterial color="#1F2126" roughness={0.7} metalness={0.5} />
        </mesh>
        {/* Spectral highlight по верхнему ребру */}
        <mesh position={[0, 0.020, 0]}>
          <boxGeometry args={[2.4, 0.003, 0.06]} />
          <meshBasicMaterial color={RIM_COLOR} transparent opacity={0.85} />
        </mesh>
      </group>
    )
  }

  if (type === 'brake') {
    // Зона торможения: широкая тень + два tire-mark'а (занижены в дорогу на 1мм)
    return (
      <group>
        {/* Pulse zone ореол */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.65, 32]} />
          <meshBasicMaterial color={RIM_COLOR} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Left tire mark — шина смялась, тёмный след */}
        <mesh position={[-0.28, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
          <planeGeometry args={[0.10, 2.0]} />
          <meshBasicMaterial color={VOID_CENTER} transparent opacity={0.78} depthWrite={false} />
        </mesh>
        {/* Right tire mark */}
        <mesh position={[0.28, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
          <planeGeometry args={[0.10, 2.0]} />
          <meshBasicMaterial color={VOID_CENTER} transparent opacity={0.78} depthWrite={false} />
        </mesh>
        {/* Spectral hairline по краям следов */}
        <mesh position={[-0.28, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 0, 1]} />
        </mesh>
      </group>
    )
  }

  // rut = реальная колея: две продольные впадины (2см ниже дороги)
  return (
    <group>
      {/* Левая колея — dark floor depression */}
      <mesh position={[-0.38, -0.020, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 1.8]} />
        <meshStandardMaterial color={VOID_CENTER} roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Правая колея */}
      <mesh position={[0.38, -0.020, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 1.8]} />
        <meshStandardMaterial color={VOID_CENTER} roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Скошенные стенки каждой колеи (тонкие боковые walls) */}
      <mesh position={[-0.315, -0.010, 0]}>
        <boxGeometry args={[0.008, 0.020, 1.8]} />
        <meshBasicMaterial color={RIM_COLOR} transparent opacity={0.40} />
      </mesh>
      <mesh position={[-0.445, -0.010, 0]}>
        <boxGeometry args={[0.008, 0.020, 1.8]} />
        <meshBasicMaterial color={RIM_COLOR} transparent opacity={0.40} />
      </mesh>
      <mesh position={[0.315, -0.010, 0]}>
        <boxGeometry args={[0.008, 0.020, 1.8]} />
        <meshBasicMaterial color={RIM_COLOR} transparent opacity={0.40} />
      </mesh>
      <mesh position={[0.445, -0.010, 0]}>
        <boxGeometry args={[0.008, 0.020, 1.8]} />
        <meshBasicMaterial color={RIM_COLOR} transparent opacity={0.40} />
      </mesh>
    </group>
  )
}


// ── Main component ──

export function AccelWaves({ accelData, visible = true, onBounce }: AccelWavesProps) {
  void accelData // reserved for real data integration
  const obstacleRefs = useRef<THREE.Group[]>([])
  const currentBounce = useRef({ y: 0, roll: 0, pitch: 0 })
  const currentWheels = useRef<WheelBounce>({ fl: 0, fr: 0, rl: 0, rr: 0 })
  const roadOffset = useRef(0) // accumulated road scroll (slows on brake)

  const setObstacleRef = useCallback((idx: number) => (el: THREE.Group | null) => {
    if (el) obstacleRefs.current[idx] = el
  }, [])

  useFrame(({ clock }, delta) => {
    if (!visible) return
    const t = clock.elapsedTime

    // ── Road scroll: slows to near-stop during braking ──
    let brakeSlowdown = 1.0
    OBSTACLES.forEach((obs) => {
      if (obs.type !== 'brake') return
      let z = obs.baseZ - roadOffset.current % LOOP_LENGTH
      while (z < -8) z += LOOP_LENGTH
      while (z > 28) z -= LOOP_LENGTH
      const dist = Math.abs(z) // distance brake obstacle from car center (z=0)
      if (dist < 5) {
        // Smooth deceleration: full stop at center, gradual approach
        const proximity = Math.max(0, 1 - dist / 5)
        brakeSlowdown = Math.min(brakeSlowdown, 1 - proximity * 0.97) // almost full stop (3% speed)
      }
    })
    roadOffset.current += SCROLL_SPEED * brakeSlowdown * delta
    const offset = roadOffset.current % LOOP_LENGTH

    let targetBounceY = 0
    let targetBounceRoll = 0
    let targetPitch = 0
    // Per-wheel immediate bounce (faster response than body)
    let wFL = 0, wFR = 0, wRL = 0, wRR = 0

    OBSTACLES.forEach((obs, i) => {
      const group = obstacleRefs.current[i]
      if (!group) return

      // Position: start far ahead (Z+), scroll toward camera (Z-), then loop
      let z = obs.baseZ - offset
      // Wrap into visible range
      while (z < -8) z += LOOP_LENGTH
      while (z > 28) z -= LOOP_LENGTH
      group.position.z = z

      // Front axle z≈+1.2, rear axle z≈-1.2
      const frontHit = Math.max(0, 1 - Math.abs(z - 1.2) / 0.8)
      const rearHit  = Math.max(0, 1 - Math.abs(z + 1.2) / 0.8)
      const anyHit = Math.max(frontHit, rearHit)

      if (anyHit > 0) {
        const pitchPhase = frontHit > 0 ? frontHit : -rearHit

        if (obs.type === 'pothole_l') {
          const damped = anyHit * Math.exp(-anyHit * 0.5)
          targetBounceY -= 0.10 * damped
          targetBounceRoll += 0.075 * anyHit
          targetPitch += 0.048 * pitchPhase
          // Wheel drops into hole (clips visually with road)
          wFL -= 0.13 * frontHit; wRL -= 0.13 * rearHit
          wFR -= 0.030 * frontHit; wRR -= 0.030 * rearHit
        } else if (obs.type === 'pothole_r') {
          const damped = anyHit * Math.exp(-anyHit * 0.5)
          targetBounceY -= 0.10 * damped
          targetBounceRoll -= 0.075 * anyHit
          targetPitch += 0.048 * pitchPhase
          wFR -= 0.13 * frontHit; wRR -= 0.13 * rearHit
          wFL -= 0.030 * frontHit; wRL -= 0.030 * rearHit
        } else if (obs.type === 'bump') {
          const smooth = Math.sin(anyHit * Math.PI)
          targetBounceY += 0.10 * smooth
          targetPitch -= 0.058 * pitchPhase
          wFL += 0.115 * frontHit; wFR += 0.115 * frontHit
          wRL += 0.115 * rearHit; wRR += 0.115 * rearHit
        } else if (obs.type === 'rut') {
          targetBounceRoll += 0.068 * anyHit * Math.sin(t * 6)
          targetBounceY -= 0.015 * anyHit
          const lat = Math.sin(t * 6) * anyHit * 0.075
          wFL -= lat * frontHit; wFR += lat * frontHit
          wRL -= lat * rearHit; wRR += lat * rearHit
        } else if (obs.type === 'brake') {
          // Physically correct: body dives, front suspension compresses (wheels stay).
          const brakeRamp = 1 - Math.exp(-anyHit * 3)
          targetPitch += 0.048 * brakeRamp
          targetBounceY -= 0.024 * brakeRamp
        } else if (obs.type === 'joint') {
          const impulse = anyHit * anyHit
          targetBounceY += 0.068 * impulse
          targetPitch -= 0.028 * pitchPhase
          wFL += 0.095 * frontHit; wFR += 0.095 * frontHit
          wRL += 0.095 * rearHit; wRR += 0.095 * rearHit
        }
      }
    })

    // Lerp body bounce (slightly snappier for more visible reaction)
    const BODY_LERP = 0.22
    currentBounce.current.y = THREE.MathUtils.lerp(currentBounce.current.y, targetBounceY, BODY_LERP)
    currentBounce.current.roll = THREE.MathUtils.lerp(currentBounce.current.roll, targetBounceRoll, BODY_LERP)
    currentBounce.current.pitch = THREE.MathUtils.lerp(currentBounce.current.pitch, targetPitch, BODY_LERP)

    // Lerp wheel bounce (fast — wheels respond immediately)
    const WHEEL_LERP = 0.68
    const cw = currentWheels.current
    cw.fl = THREE.MathUtils.lerp(cw.fl, wFL, WHEEL_LERP)
    cw.fr = THREE.MathUtils.lerp(cw.fr, wFR, WHEEL_LERP)
    cw.rl = THREE.MathUtils.lerp(cw.rl, wRL, WHEEL_LERP)
    cw.rr = THREE.MathUtils.lerp(cw.rr, wRR, WHEEL_LERP)

    onBounce?.(
      currentBounce.current.y,
      currentBounce.current.roll,
      currentBounce.current.pitch,
      { ...cw },
    )

  })

  if (!visible) return null

  // Nebula HUD: road + obstacles в monochrome spectral (без cyan waves / red skids).
  // Z-wave carpet и axle-ring cyan waves удалены — они ломали палитру.
  // Physic onBounce продолжает работать от obstacle-positions в useFrame.
  return (
    <group>
      <RoadStrip />
      {OBSTACLES.map((obs, i) => (
        <group key={obs.type + i} ref={setObstacleRef(i)} position={[obs.x, -0.52, obs.baseZ]}>
          <ObstacleMesh type={obs.type} />
        </group>
      ))}
    </group>
  )
}
