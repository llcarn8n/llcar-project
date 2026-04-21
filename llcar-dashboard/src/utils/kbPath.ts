/**
 * Derive KB generation folder path from brandId and generation name.
 *
 * Работает в два прохода:
 *  1) Legacy regex: "K5 II 2023-н.в." → "kia/k5/k5_ii_2023" (если совпало).
 *  2) Fallback через kb-generations-index.json — для новых папок с chassis-кодами
 *     (mercedes/e_class/e_class_w211, porsche/taycan/taycan_2019, baic/bj60/bj60_2023)
 *     — regex не подходит, но в индексе есть реальная папка с manual.md.
 */
import kbIndex from '../data/kb-generations-index.json'

type KBIndex = {
  version: number
  brands: Record<string, { models: Record<string, string[]> }>
}

const INDEX = kbIndex as KBIndex

/**
 * Brand alias: vehicles.json brand id → KB brand directory name.
 * Используется когда в vehicles.json и в KB бренд назван по-разному
 * (исторически из-за transfer4_brand_mapping.json).
 */
const BRAND_ALIAS: Record<string, string> = {
  mercedes_benz: 'mercedes',
  li: 'li_auto',
  bestune: 'faw_bestune',
}

function resolveBrand(brandId: string): string {
  return BRAND_ALIAS[brandId] ?? brandId
}

/**
 * Найти модель-slug в индексе по fuzzy-именам (normalize: lowercase, пробелы → _, убрать спецсимволы).
 */
function resolveModelSlug(brandId: string, modelRaw: string): string | null {
  const brand = INDEX.brands[resolveBrand(brandId)]
  if (!brand) return null
  const norm = modelRaw.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  if (brand.models[norm]) return norm
  // точное совпадение без нормализации
  if (brand.models[modelRaw.toLowerCase()]) return modelRaw.toLowerCase()
  // ищем по содержанию в ключе
  for (const k of Object.keys(brand.models)) {
    if (k === norm || k.startsWith(`${norm}_`) || norm.startsWith(`${k}_`)) {
      return k
    }
  }
  return null
}

/**
 * Cross-model fallback: модели, у которых мануал лежит ВНУТРИ папки другой модели
 * как generation-slug (например `chery/tiggo_7_pro/tiggo_7/manual.md` —
 * Tiggo 7 лежит как gen под Tiggo 7 Pro). Аудит `audit_missing_kb_models.py`
 * нашёл 23 таких случая: Tiggo 7/8, BMW i3, CR-V, Cayenne Coupe, Polo Sedan,
 * Octavia A5, Ioniq 5 и т.д. Возвращает полный путь до генерации, если
 * нашёл искомый model-slug среди generations любой другой модели бренда.
 */
function findCrossModelGen(brandKey: string, modelNorm: string): { model: string; gen: string } | null {
  const brand = INDEX.brands[brandKey]
  if (!brand) return null
  for (const [parentModel, gens] of Object.entries(brand.models)) {
    if (parentModel === modelNorm) continue
    if (gens.includes(modelNorm)) {
      return { model: parentModel, gen: modelNorm }
    }
  }
  return null
}

/**
 * Выбрать gen-slug из списка индексированных поколений модели.
 *   - ищем по году из имени (если есть): `_<year>` или `_<year>_` в slug
 *   - иначе берём первый gen в списке (обычно самый старый, но manual всё же есть)
 */
function pickGenerationSlug(gens: string[], generationName: string): string {
  // попробуем извлечь 4-значный год из имени
  const yearMatch = generationName.match(/\b(19\d{2}|20\d{2})\b/)
  if (yearMatch) {
    const y = yearMatch[1]
    const direct = gens.find(g => g.includes(`_${y}`))
    if (direct) return direct
  }
  // римская цифра
  const romanMatch = generationName.match(/\b(I{1,3}V?|V|VI{0,3}|IX|X|XI{0,3})\b/)
  if (romanMatch) {
    const r = romanMatch[1].toLowerCase()
    const direct = gens.find(g => g.includes(`_${r}_`) || g.endsWith(`_${r}`))
    if (direct) return direct
  }
  // fallback: первый
  return gens[0]
}

export function deriveKBGenPath(brandId: string, generationName: string): string | null {
  if (!brandId || !generationName) return null
  const kbBrand = resolveBrand(brandId)
  const brand = INDEX.brands[kbBrand]

  // 1) Legacy regex — "Model Roman YYYY"
  const match = generationName.match(/^(.+?)\s+(I{1,3}V?|V?I{0,3})\s+(\d{4})/)
  if (match && brand) {
    const model = match[1].toLowerCase().replace(/\s+/g, '_')
    const roman = match[2].toLowerCase()
    const year = match[3]

    // exact match в индексе?
    if (brand.models[model]?.includes(`${model}_${roman}_${year}`)) {
      return `${kbBrand}/${model}/${model}_${roman}_${year}`
    }
    // model есть, но gen-slug другой — pickGenerationSlug по году/роману
    if (brand.models[model]) {
      const slug = pickGenerationSlug(brand.models[model], generationName)
      return `${kbBrand}/${model}/${slug}`
    }
    // model нет как top-level — проверим cross-model fallback
    // ВАЖНО: раньше здесь возвращался legacy path (404), теперь дадим шанс cross-model найти мануал
    const cross = findCrossModelGen(kbBrand, model)
    if (cross) {
      return `${kbBrand}/${cross.model}/${cross.gen}`
    }
    // последний fallback — legacy path (будет 404, но сохраняем совместимость)
    return `${kbBrand}/${model}/${model}_${roman}_${year}`
  }

  // 2) Regex не совпал — полностью fallback через индекс
  const firstWord = generationName.split(/\s+/)[0]
  const modelSlug = resolveModelSlug(brandId, firstWord) ||
                    resolveModelSlug(brandId, generationName)
  if (modelSlug && brand) {
    const gens = brand.models[modelSlug]
    const slug = pickGenerationSlug(gens, generationName)
    return `${kbBrand}/${modelSlug}/${slug}`
  }

  // 3) Cross-model fallback — model существует только как gen под другой моделью
  //    (Tiggo 7 under tiggo_7_pro, Polo Sedan under polo и т.д.)
  const modelCandidate = firstWord.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  const cross = findCrossModelGen(kbBrand, modelCandidate)
  if (cross) {
    return `${kbBrand}/${cross.model}/${cross.gen}`
  }

  return null
}

/**
 * Попытаться резолвить model-only путь (без generation) — для cases когда нужен manual
 * только на уровне модели. Полезно для fallback в ManualViewer.
 */
export function deriveKBModelPath(brandId: string, modelName: string): string | null {
  if (!brandId || !modelName) return null
  const kbBrand = resolveBrand(brandId)
  const slug = resolveModelSlug(brandId, modelName)
  if (slug) return `${kbBrand}/${slug}`
  const norm = modelName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  const cross = findCrossModelGen(kbBrand, norm)
  if (cross) return `${kbBrand}/${cross.model}/${cross.gen}`
  return null
}

/**
 * Получить все поколения (slug'и) для model в KB — для UI выбора между ними.
 */
export function listKBGenerations(brandId: string, modelSlug: string): string[] {
  const brand = INDEX.brands[resolveBrand(brandId)]
  if (!brand) return []
  return brand.models[modelSlug] ?? []
}

/**
 * Получить все модели (slug'и) для brand в KB.
 */
export function listKBModels(brandId: string): string[] {
  const brand = INDEX.brands[resolveBrand(brandId)]
  if (!brand) return []
  return Object.keys(brand.models).sort()
}
