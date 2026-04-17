export interface RuleCondition {
  param: string
  op: string
  threshold: string
  weight: number
  rationale: string
}

export interface RuleFormula {
  code: string
}

export interface RuleSourceRef {
  ref?: string | null
  citation: string
  url?: string
  doi?: string
}

export interface RuleCodePointer {
  file: string
  line: number
}

export interface RuleSpec {
  rule_name: string
  display: string
  section: string
  tier: 'T1' | 'T2' | 'T3'
  min_confidence: number
  cooldown_days: number
  what: string
  physics: string
  formulas: RuleFormula[]
  conditions: RuleCondition[]
  theory: string
  example: string
  sources: RuleSourceRef[]
  code_pointers: RuleCodePointer[]
  replaces?: string
  appendices_used: string[]
  shadow: boolean
}

export interface MethodSpec {
  code: string
  name: string
  description: string
  key_formula?: string
  used_by_rules: string[]
}

export interface SourceRef {
  id: string
  citation: string
  doi?: string
  url?: string
  type: 'peer-reviewed' | 'standard' | 'vendor-doc' | 'internal' | 'other'
}

export type PartCategory =
  | 'suspension'
  | 'engine'
  | 'electrical'
  | 'audio'
  | 'body'
  | 'interior'
  | 'light'
  | 'other'

export type WheelCornerCode = 'fl' | 'fr' | 'rl' | 'rr'

export interface PartParamSpec {
  label: string
  key: string
  unit?: string
  precision?: number
}

export interface PartSpec {
  nodeNames: string[]
  display: string
  category: PartCategory
  params: PartParamSpec[]
  relatedRules: string[]
  corner?: WheelCornerCode | null
}

// Type guards

export function isRuleSpec(x: unknown): x is RuleSpec {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.rule_name === 'string' &&
    typeof r.display === 'string' &&
    typeof r.section === 'string' &&
    typeof r.tier === 'string' &&
    Array.isArray(r.conditions) &&
    Array.isArray(r.formulas) &&
    Array.isArray(r.sources)
  )
}

export function isMethodSpec(x: unknown): x is MethodSpec {
  if (typeof x !== 'object' || x === null) return false
  const m = x as Record<string, unknown>
  return (
    typeof m.code === 'string' &&
    typeof m.name === 'string' &&
    typeof m.description === 'string' &&
    Array.isArray(m.used_by_rules)
  )
}
