import * as THREE from 'three'

// ── Material categories matching the Li7 GLB model's 109 materials ──

export type MaterialCategory =
  | 'glass'
  | 'body'
  | 'chrome'
  | 'tire'
  | 'interior'
  | 'engine'
  | 'light'
  | 'other'

export type DiagSystem = 'suspension' | 'engine' | 'electrical' | 'audio' | null

// ── Classify material by its name from GLB ──

export function classifyMaterial(name: string): MaterialCategory {
  const n = name.toLowerCase()

  // Glass: Li7_glass_11, Li7_glass_12, Li7_glass_text, Li7_glass_1
  if (n.includes('glass')) return 'glass'

  // Lights: signals, fog, beam, lamp
  if (n.includes('signal') || n.includes('foglight') || n.includes('rearfog') ||
      n.includes('highbeam') || n.includes('lowbeam') || n.includes('lamp')) return 'light'

  // Chrome: Li7_chrome, Li7_chromegidro
  if (n.includes('chrome')) return 'chrome'

  // Engine: etk800 (29 uses), sbr_emotor, Li7_engine, Li7_EV
  if (n.includes('etk800') || n.includes('emotor') || n === 'li7_engine' || n === 'li7_ev') return 'engine'

  // Tires + wheels/rims/disks
  if (n.includes('tire') || n.includes('rezink') || n.includes('disk') || n.includes('wheel') || n.includes('koleso') || n.includes('колесо') || n.includes('rim')) return 'tire'

  // Interior: koja (leather), sidenie (seats), torpedka (dashboard), potolok (ceiling)
  if (n.includes('koja') || n.includes('sidenie') || n.includes('torpedka') ||
      n.includes('potolok') || n.includes('rul') || n.includes('pedal')) return 'interior'

  // Body: Li7_bak (23 uses), Li7_paint (20 uses)
  if (n.includes('bak') || n.includes('paint')) return 'body'

  // Plastic exterior: treat as body-like
  if (n.includes('plastic_ext') || n.includes('plastikovoe')) return 'body'

  // Interior plastic
  if (n.includes('plastic') && !n.includes('ext')) return 'interior'

  return 'other'
}

// ── Classify by node name (more reliable than material name) ──

export function classifyByNode(nodeName: string): MaterialCategory | null {
  const n = nodeName.toLowerCase()

  // Glass / windows
  if (n.includes('стекло') || n.includes('стёкло') || n.includes('люк') || n.includes('зеркальный_элемент')) return 'glass'

  // Doors, body panels, bumpers, hood, roof, fenders
  if (n.includes('дверь') || n.includes('кузов') || n.includes('капот') || n.includes('крыша') ||
      n.includes('бампер') || n.includes('крыло') || n.includes('багажник') || n.includes('порог') ||
      n.includes('четвертные') || n.includes('лючок') || n.includes('рамка_номера') ||
      n.includes('молдинг') || n.includes('накладка') || n.includes('обшивка')) return 'body'

  // Door cards are part of body visually (same opacity as doors)
  if (n.includes('дверная_карта')) return 'body'

  // Interior (seats, steering, dashboard internals)
  if (n.includes('сиденье') || n.includes('сиденья') || n.includes('руль') || n.includes('приборная') ||
      n.includes('бардачок') || n.includes('подрулевой') ||
      n.includes('козырёк') || n.includes('козырек')) return 'interior'

  // Wheels
  if (n.includes('колесо') || n.includes('колёсо')) return 'tire'

  // Mirrors (housing = body)
  if (n.includes('зеркало') && !n.includes('зеркальный')) return 'body'

  // Door handles
  if (n.includes('ручка_двери')) return 'chrome'

  // Engine / drivetrain
  if (n.includes('мотор') || n.includes('двигатель') || n.includes('проводка') ||
      n.includes('батарея') || n.includes('полуось') || n.includes('пневмоподвеска') ||
      n.includes('тормоз')) return 'engine'

  // Tires
  if (n.includes('шина')) return 'tire'

  return null // fallback to material-based classification
}

// ── Map category → diagnostic system ──

export const CATEGORY_SYSTEM_MAP: Record<MaterialCategory, DiagSystem> = {
  glass: null,
  body: null,
  chrome: null,
  tire: 'suspension',
  interior: 'audio',
  engine: 'engine',
  light: 'electrical',
  other: null,
}

// ── Material definitions per category ──

interface MatDef {
  color: string
  wireframe: boolean
  opacity: number
  emissive: string
  emissiveIntensity: number
  metalness: number
  roughness: number
  physical?: boolean // use MeshPhysicalMaterial
  transmission?: number
  thickness?: number
}

// Site palette: cyan #00e5ff, teal #64ffda, bg #0c1220
// Differentiation via brightness/opacity/wireframe, NOT via hue

const BASE_DEFS: Record<MaterialCategory, MatDef> = {
  glass: {
    color: '#00e5ff',
    wireframe: false,
    opacity: 0.03,
    emissive: '#00e5ff',
    emissiveIntensity: 0.02,
    metalness: 0.0,
    roughness: 0.0,
  },
  body: {
    color: '#00e5ff',
    wireframe: false,
    opacity: 0.95,
    emissive: '#00e5ff',
    emissiveIntensity: 0.1,
    metalness: 0.5,
    roughness: 0.4,
  },
  chrome: {
    color: '#64ffda',
    wireframe: false,
    opacity: 0.5,
    emissive: '#64ffda',
    emissiveIntensity: 0.6,
    metalness: 0.9,
    roughness: 0.1,
  },
  tire: {
    color: '#0a1a2a',
    wireframe: false,
    opacity: 0.55,
    emissive: '#003040',
    emissiveIntensity: 0.08,
    metalness: 0.0,
    roughness: 0.9,
  },
  interior: {
    color: '#00e5ff',
    wireframe: false,
    opacity: 0.4,
    emissive: '#00e5ff',
    emissiveIntensity: 0.3,
    metalness: 0.0,
    roughness: 0.8,
  },
  engine: {
    color: '#64ffda',
    wireframe: true,
    opacity: 0.65,
    emissive: '#64ffda',
    emissiveIntensity: 0.7,
    metalness: 0.3,
    roughness: 0.4,
  },
  light: {
    color: '#64ffda',
    wireframe: false,
    opacity: 0.45,
    emissive: '#64ffda',
    emissiveIntensity: 0.7,
    metalness: 0.1,
    roughness: 0.3,
  },
  other: {
    color: '#00e5ff',
    wireframe: false,
    opacity: 0.2,
    emissive: '#00e5ff',
    emissiveIntensity: 0.15,
    metalness: 0.0,
    roughness: 0.5,
  },
}

// ── Material state variants ──

type MatState = 'default' | 'active' | 'dimmed'

function buildMaterial(def: MatDef, state: MatState): THREE.Material {
  let { opacity, emissiveIntensity } = def

  if (state === 'active') {
    opacity = Math.min(opacity * 1.3, 0.95)
    emissiveIntensity *= 2
  } else if (state === 'dimmed') {
    opacity *= 0.5
    emissiveIntensity *= 0.25
  }

  if (def.physical) {
    return new THREE.MeshPhysicalMaterial({
      color: def.color,
      wireframe: def.wireframe,
      transparent: true,
      opacity,
      emissive: def.emissive,
      emissiveIntensity,
      metalness: def.metalness,
      roughness: def.roughness,
      transmission: def.transmission ?? 0,
      thickness: def.thickness ?? 0,
      side: THREE.DoubleSide,
    })
  }

  return new THREE.MeshStandardMaterial({
    color: def.color,
    wireframe: def.wireframe,
    transparent: true,
    opacity,
    emissive: def.emissive,
    emissiveIntensity,
    metalness: def.metalness,
    roughness: def.roughness,
  })
}

// ── Material pool: 8 categories × 3 states = 24 instances ──

const pool = new Map<string, THREE.Material>()

function poolKey(cat: MaterialCategory, state: MatState): string {
  return `${cat}:${state}`
}

export function getHoloMaterial(category: MaterialCategory, state: MatState = 'default'): THREE.Material {
  const key = poolKey(category, state)
  let mat = pool.get(key)
  if (!mat) {
    mat = buildMaterial(BASE_DEFS[category], state)
    pool.set(key, mat)
  }
  return mat
}

// ── Helper: determine material state from active system ──

export function getMaterialState(
  meshCategory: MaterialCategory,
  activeSystem: string | null,
): MatState {
  if (!activeSystem) return 'default'
  const meshSystem = CATEGORY_SYSTEM_MAP[meshCategory]
  if (meshSystem === activeSystem) return 'active'
  if (meshSystem !== null) return 'dimmed'
  return 'default' // neutral parts (body, glass, chrome) stay default
}
