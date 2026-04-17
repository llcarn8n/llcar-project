import type { RuleCondition, RuleSpec } from '../types/rules'
import type { LatestTelemetry } from '../hooks/useLatestTelemetry'
import { resolvePartValue } from './partDataResolver'

export interface EvaluatedCondition extends RuleCondition {
  value: number | string | null
  passed: boolean
}

export interface EvaluatedRule {
  conditions: EvaluatedCondition[]
  confidence: number
}

function parseThresholdNumber(raw: string): number | null {
  if (!raw) return null
  const m = raw.match(/-?\d+(?:[.,]\d+)?/)
  if (!m) return null
  return Number(m[0].replace(',', '.'))
}

function parseBetween(raw: string): [number, number] | null {
  // accepts "1.0..2.5", "[80, 120]", "80-120", "[1,2]"
  const nums = raw.match(/-?\d+(?:[.,]\d+)?/g)
  if (!nums || nums.length < 2) return null
  const lo = Number(nums[0].replace(',', '.'))
  const hi = Number(nums[1].replace(',', '.'))
  return [lo, hi]
}

function parseInSet(raw: string): string[] {
  return raw
    .replace(/[\[\]]/g, '')
    .split(/[|,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function evaluateCondition(
  cond: RuleCondition,
  telemetry: LatestTelemetry,
): EvaluatedCondition {
  const value = resolvePartValue(cond.param, telemetry)
  let passed = false

  if (value === null || value === undefined) {
    return { ...cond, value, passed: false }
  }

  const op = (cond.op || '').toLowerCase()

  if (op === 'between') {
    const range = parseBetween(cond.threshold)
    if (range && typeof value === 'number') {
      passed = value >= range[0] && value <= range[1]
    }
  } else if (op === 'in') {
    const set = parseInSet(cond.threshold)
    passed = set.includes(String(value))
  } else if (op === '==' || op === '=') {
    const n = parseThresholdNumber(cond.threshold)
    if (typeof value === 'number' && n !== null) {
      passed = value === n
    } else {
      passed = String(value) === cond.threshold.trim()
    }
  } else if (op === '>' || op === 'z>') {
    // z> is treated as a plain numeric comparison here; baseline-aware z-score
    // evaluation is the backend's job.
    const n = parseThresholdNumber(cond.threshold)
    if (typeof value === 'number' && n !== null) passed = value > n
  } else if (op === '<') {
    const n = parseThresholdNumber(cond.threshold)
    if (typeof value === 'number' && n !== null) passed = value < n
  } else if (op === '>=') {
    const n = parseThresholdNumber(cond.threshold)
    if (typeof value === 'number' && n !== null) passed = value >= n
  } else if (op === '<=') {
    const n = parseThresholdNumber(cond.threshold)
    if (typeof value === 'number' && n !== null) passed = value <= n
  }

  return { ...cond, value, passed }
}

export function evaluateRule(
  rule: RuleSpec,
  telemetry: LatestTelemetry,
): EvaluatedRule {
  const evaluated = rule.conditions.map((c) => evaluateCondition(c, telemetry))
  const totalWeight = evaluated.reduce((acc, c) => acc + (c.weight || 0), 0)
  const passedWeight = evaluated.reduce(
    (acc, c) => acc + (c.passed ? c.weight || 0 : 0),
    0,
  )
  const confidence = totalWeight > 0 ? passedWeight / totalWeight : 0
  return { conditions: evaluated, confidence }
}
