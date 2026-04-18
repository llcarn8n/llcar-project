import * as THREE from 'three'

// ── Material categories matching the Li7 GLB model's 109 materials ──

export type MaterialCategory =
  | 'glass'
  | 'body'
  | 'chrome'
  | 'tire'
  | 'rim'
  | 'brake'
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

  // Brake discs/calipers
  if (n.includes('brake') || n.includes('тормоз') || n.includes('tormoz')) return 'brake'

  // Engine: etk800 (29 uses), sbr_emotor, Li7_engine, Li7_EV
  if (n.includes('etk800') || n.includes('emotor') || n === 'li7_engine' || n === 'li7_ev') return 'engine'

  // Rubber tires → black
  if (n.includes('tire') || n.includes('rezink') || n.includes('шина')) return 'tire'

  // Rims/disks → dark grey
  if (n.includes('disk') || n.includes('wheel') || n.includes('koleso') || n.includes('колесо') || n.includes('rim')) return 'rim'

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

  // Lights — BEFORE body, catches tail-light strip inside "Кузов#2_—_*"
  if (n.includes('фара_п') || n.includes('фара_з') || n.includes('линза') ||
      n.includes('модуль_дальнего') || n.includes('модуль_ближнего') ||
      n.includes('поворотник') || n.includes('противотуманк') ||
      n.includes('фонарь') || n.includes('фонар') ||
      n.includes('дхо') || n.includes('ходовой_огон') || n.includes('дневные_ходовые') ||
      n.includes('подсветк') || n.includes('заглушка_фонар') || n.includes('повторитель') ||
      n.includes('стоп') ||
      n.includes('световой') || n.includes('световая') || n.includes('светополос') ||
      n.includes('led') || n.includes('лед_') || n.includes('диод') ||
      n.includes('rear_light') || n.includes('tail') || n.includes('taillight') ||
      n.includes('задний_свет') || n.includes('задняя_светов') ||
      n.includes('неон')) return 'light'

  // Interior — BEFORE body, catches "Кузов_(интерьер)#2_—_*" and all cabin trim
  if (n.includes('(интерьер)') || n.includes('руль') ||
      n.includes('сиденье') || n.includes('сиденья') || n.includes('подушка') ||
      n.includes('приборн') || n.includes('бардачок') || n.includes('подрулев') ||
      n.includes('козырёк') || n.includes('козырек') || n.includes('дверная_карта') ||
      n.includes('обивка') || n.includes('торпед') ||
      n.includes('потолок') || n.includes('ковролин') || n.includes('подлокотник') ||
      n.includes('консоль') || n.includes('лепесток') || n.includes('экран_приборов') ||
      n.includes('салонное') || n.includes('салон')) return 'interior'

  // Doors, body panels, bumpers, hood, roof, fenders — EXTERIOR cherry paint
  if (n.includes('дверь') || n.includes('кузов') || n.includes('капот') || n.includes('крыша') ||
      n.includes('бампер') || n.includes('крыло') || n.includes('багажник') || n.includes('порог') ||
      n.includes('четвертные') || n.includes('лючок') || n.includes('рамка_номера') ||
      n.includes('молдинг') || n.includes('накладка')) return 'body'

  // Brakes — gold
  if (n.includes('тормоз') || n.includes('brake') || n.includes('суппорт') || n.includes('каллипер')) return 'brake'

  // Rubber tires — black
  if (n.includes('шина')) return 'tire'

  // Rims/disks — dark grey
  if (n.includes('колесо') || n.includes('колёсо') || n.includes('диск')) return 'rim'

  // Mirrors (housing = body)
  if (n.includes('зеркало') && !n.includes('зеркальный')) return 'body'

  // Door handles
  if (n.includes('ручка_двери')) return 'chrome'

  // Engine / drivetrain / chassis / HV system
  if (n.includes('мотор') || n.includes('двигатель') || n.includes('проводка') ||
      n.includes('батарея') || n.includes('полуось') || n.includes('пневмоподвеска') ||
      n.includes('электромотор') || n.includes('инвертор') ||
      n.includes('стабилизатор') || n.includes('подрамник') || n.includes('рычаг') ||
      n.includes('картер') || n.includes('редуктор') || n.includes('выхлоп') ||
      n.includes('коллектор') || n.includes('радиатор')) return 'engine'

  return null // fallback to material-based classification
}

// ── Map category → diagnostic system ──

export const CATEGORY_SYSTEM_MAP: Record<MaterialCategory, DiagSystem> = {
  glass: null,
  body: null,
  chrome: null,
  tire: 'suspension',
  rim: 'suspension',
  brake: 'suspension',
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
  clearcoat?: number
  clearcoatRoughness?: number
}

// MONOCHROME NEBULA palette (plan v4 §CarSolid):
// весь кузов = dark graphite #181824 MeshStandardMaterial roughness 0.45 metalness 0.55
// Никаких wireframe, никаких indigo/amber primary fill.
// Severity/accent приходит через glow-halo, не через material color.
const SPECTRAL = '#EFF2F7'
// Cherry metallic body + factory clearcoat + black tires + dark rims + gold brakes + beige interior.
const GRAPHITE = '#7C1830'          // body paint — deep cherry (вишнёвый)
const BODY_SHADOW = '#4A0E1A'       // emissive tint in shadow for metallic depth
const TIRE_BLACK = '#1A1A1E'        // rubber tires — dark grey/black, no emissive
const RIM_GREY = '#3A3A44'          // rims/disks — dark grey
const BRAKE_GOLD = '#D4A54A'        // brake discs/calipers — Brembo-style gold
const BRAKE_GOLD_DEEP = '#7A5F1F'
const INTERIOR_BEIGE = '#DFCFAD'    // salon — light warm beige
const CRITICAL = '#FF4A4A'

const BASE_DEFS: Record<MaterialCategory, MatDef> = {
  glass: {
    color: SPECTRAL,
    wireframe: false,
    opacity: 0.12,
    emissive: SPECTRAL,
    emissiveIntensity: 0.03,
    metalness: 0.1,
    roughness: 0.05,
  },
  body: {
    color: GRAPHITE,
    wireframe: false,
    opacity: 1.0,
    emissive: BODY_SHADOW,
    emissiveIntensity: 0.06,
    metalness: 0.82,
    roughness: 0.22,
    physical: true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  },
  chrome: {
    color: SPECTRAL,
    wireframe: false,
    opacity: 1.0,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.95,
    roughness: 0.15,
  },
  tire: {
    color: TIRE_BLACK,
    wireframe: false,
    opacity: 1.0,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.0,
    roughness: 0.95,
  },
  rim: {
    color: RIM_GREY,
    wireframe: false,
    opacity: 1.0,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.75,
    roughness: 0.28,
  },
  brake: {
    color: BRAKE_GOLD,
    wireframe: false,
    opacity: 1.0,
    emissive: BRAKE_GOLD_DEEP,
    emissiveIntensity: 0.35,
    metalness: 0.65,
    roughness: 0.35,
  },
  interior: {
    color: INTERIOR_BEIGE,
    wireframe: false,
    opacity: 1.0,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.15,
    roughness: 0.7,
  },
  engine: {
    color: INTERIOR_BEIGE,
    wireframe: false,
    opacity: 1.0,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.15,
    roughness: 0.7,
  },
  light: {
    color: SPECTRAL,
    wireframe: false,
    opacity: 0.95,
    emissive: SPECTRAL,
    emissiveIntensity: 0.6,
    metalness: 0.1,
    roughness: 0.25,
  },
  other: {
    color: GRAPHITE,
    wireframe: false,
    opacity: 1.0,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.4,
    roughness: 0.5,
  },
}

// Критическая подсветка сохраняется через severity в будущем —
// сейчас body/engine/chrome остаются нейтральными graphite/spectral.
void CRITICAL

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
      clearcoat: def.clearcoat ?? 0,
      clearcoatRoughness: def.clearcoatRoughness ?? 0,
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
    side: THREE.DoubleSide,
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
