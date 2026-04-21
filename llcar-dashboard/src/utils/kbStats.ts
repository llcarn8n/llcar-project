import kbIndex from '../data/kb-generations-index.json'
import rulesCatalog from '../data/rulesCatalog.json'

type KBIndex = {
  version?: number
  brands: Record<string, { models: Record<string, string[]> }>
}

const INDEX = kbIndex as KBIndex

export interface KBStats {
  brands: number
  models: number
  generations: number
  rules: number
}

function computeStats(): KBStats {
  const brands = Object.keys(INDEX.brands).length
  let models = 0
  let generations = 0
  for (const brand of Object.values(INDEX.brands)) {
    const ms = Object.values(brand.models)
    models += ms.length
    for (const gens of ms) generations += gens.length
  }
  const rulesRaw = rulesCatalog as unknown as Array<unknown> | { rules: Array<unknown> }
  const rules = Array.isArray(rulesRaw)
    ? rulesRaw.length
    : Array.isArray((rulesRaw as { rules?: Array<unknown> }).rules)
      ? (rulesRaw as { rules: Array<unknown> }).rules.length
      : 0
  return { brands, models, generations, rules }
}

// Compute once at module load — kb-generations-index.json is bundled so this is cheap.
const STATS = computeStats()

export function getKBStats(): KBStats {
  return STATS
}
