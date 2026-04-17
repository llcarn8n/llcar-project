// Parser for RULES-REFERENCE.md → rulesCatalog / methodsCatalog / biblioCatalog JSON.
// The reference MD is heterogeneous: full rule blocks, compact blocks with single
// "Условия:" line, inline table rules (sections 7-11), complex rules (section 4),
// correlations (section 5), shadow rules (section 6), + appendices A/B.
//
// This parser walks the MD line-by-line, detects section boundaries and rule
// headings, then runs per-field extractors that tolerate bold/italic/plain
// variations. Warnings go to stderr; the build does not fail on missing fields
// unless the catalog is smaller than the minimum expected (< 100 rules).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC_MD = resolve(
  ROOT,
  '..',
  'docs',
  'новые материалы по suspension и audio',
  'RULES-REFERENCE.md',
)
const OUT_DIR = resolve(ROOT, 'src', 'data')

const warnings = []
const warn = (msg) => warnings.push(msg)

// Russian display fallback for rules whose markdown has no Russian heading
// and no "Что детектирует" first clause to synthesize from.
const RU_FALLBACK = {
  wheel_bearing_bpfo_harmonic: 'Износ подшипника ступицы (BPFO-гармоника)',
  ball_joint_early_wear: 'Ранний износ шаровой опоры',
  bushing_wear_120_180hz: 'Износ сайлентблоков (полоса 120–180 Гц)',
  aquaplaning_risk: 'Риск аквапланирования',
  vibration_rpm: 'Корреляция вибрации с оборотами двигателя',
  audio_wheel: 'Корреляция аудио с угловой скоростью колеса',
  turn_click: 'Щелчок ШРУСа при повороте',
  vibration_speed_peak: 'Пик вибрации на определённой скорости',
  highfreq_vibration: 'Высокочастотная вибрация',
  audio_accel_source: 'Идентификация источника: аудио vs вибрация',
  road_roughness_psd: 'Оценка шероховатости дороги (PSD)',
  shock_absorber_early_wear_corrected: 'Ранний износ амортизатора (уточнённое)',
  shock_absorber_worn_corrected: 'Износ амортизатора (уточнённое)',
  stabilizer_link_worn_freq: 'Износ стойки стабилизатора (по частоте)',
}

// ─── Generic text helpers ──────────────────────────────────────────────────

const BOLD_LABEL = /^\*\*([^*]+?):\*\*\s*/u // "**Tier:** ..." etc.
const H2 = /^##\s+(.+?)\s*$/u
const H3 = /^###\s+(.+?)\s*$/u
const H4 = /^####\s+(.+?)\s*$/u

function stripBackticks(s) {
  return s.replace(/`/g, '').trim()
}

function parseTier(str) {
  if (!str) return null
  const m = String(str).match(/T[123]/i)
  return m ? m[0].toUpperCase() : null
}

function parsePercentToFraction(n) {
  if (n == null || Number.isNaN(n)) return null
  return n > 1 ? n / 100 : n
}

function parseNumber(str) {
  if (str == null) return null
  const m = String(str).match(/-?\d+(?:[.,]\d+)?/)
  return m ? Number(m[0].replace(',', '.')) : null
}

function collectAppendicesFromText(text) {
  if (!text) return []
  const set = new Set()
  const re = /\bA\.(\d{1,2})\b/g
  let m
  while ((m = re.exec(text)) !== null) set.add('A.' + m[1])
  return [...set]
}

// Reads a single paragraph starting at `start`. Stops at blank line, bold
// label, heading, fenced code block, or pipe table.
function extractParagraph(lines, start) {
  const buf = []
  let i = start
  // skip leading blanks
  while (i < lines.length && lines[i].trim() === '') i++
  while (i < lines.length) {
    const l = lines[i]
    const t = l.trim()
    if (t === '') break
    if (BOLD_LABEL.test(t)) break
    if (/^###?\s/.test(l)) break
    if (/^```/.test(t)) break
    if (t.startsWith('|')) break
    if (/^[-–—]{3,}$/.test(t)) break
    buf.push(t)
    i++
  }
  return { text: buf.join(' ').replace(/\s+/g, ' ').trim(), next: i }
}

// Reads one or more adjacent ```fenced``` code blocks and returns each as a
// formula block {code}. Stops as soon as a non-fence, non-blank line appears.
function extractFormulaBlocks(lines, start) {
  const blocks = []
  let i = start
  while (i < lines.length && lines[i].trim() === '') i++
  while (i < lines.length && lines[i].trim().startsWith('```')) {
    i++ // skip opener
    const code = []
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      code.push(lines[i])
      i++
    }
    i++ // skip closer
    blocks.push({ code: code.join('\n').trim() })
    while (i < lines.length && lines[i].trim() === '') i++
  }
  return { blocks, next: i }
}

// Reads a markdown pipe table of conditions. Accepts header rows that mention
// "Параметр", "Условие" or "Оператор". Returns parsed rows.
function parseConditionsTable(lines, start) {
  const out = []
  let i = start
  let scanned = 0
  while (i < lines.length && !lines[i].trim().startsWith('|')) {
    const t = lines[i].trim()
    if (t !== '' && !t.startsWith('<!--')) break
    i++
    scanned++
    if (scanned > 3) break
  }
  if (i >= lines.length || !lines[i].trim().startsWith('|')) {
    return { conds: out, next: start }
  }
  const header = lines[i].toLowerCase()
  const isCondTable =
    header.includes('парамет') ||
    header.includes('услови') ||
    header.includes('оператор')
  if (!isCondTable) return { conds: out, next: start }
  i++ // skip header
  if (i < lines.length && /^\s*\|\s*[-: ]+\s*\|/.test(lines[i])) i++

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim().startsWith('|')) break
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 3) {
      i++
      continue
    }
    const [param, op, threshold, weightRaw, rationale] = cells
    const weightNum = weightRaw ? Number(String(weightRaw).replace(',', '.')) : NaN
    out.push({
      param: stripBackticks(param || ''),
      op: (op || '').trim(),
      threshold: stripBackticks(threshold || ''),
      weight: Number.isFinite(weightNum) ? weightNum : 1,
      rationale: (rationale || '').trim(),
    })
    i++
  }
  return { conds: out, next: i }
}

// Free-text "Условия:" line like:
//   az_std > 3.0, total_vibration > 4.0, az_range > 8.0
// Splits on comma/semicolon/« И »/«AND», matches `ident OP value`.
function parseInlineConditions(str) {
  if (!str) return []
  const out = []
  const parts = str.split(/,|;|\s+AND\s+|\s+И\s+/i)
  const opPattern = /^(.+?)\s*(z-score\s*[><]=?|z>=?|z>|>=|<=|>|<|==|between|in)\s*(.+)$/i
  for (const rawChunk of parts) {
    const chunk = rawChunk.replace(/\([^)]*\)/g, '').trim()
    if (!chunk) continue
    const m = chunk.match(opPattern)
    if (!m) continue
    let param = stripBackticks(m[1]).trim()
    let op = m[2].toLowerCase().replace(/\s+/g, '')
    if (op.startsWith('z-score')) op = op.replace('z-score', 'z>')
    let threshold = m[3].trim()
    // strip common units so the value itself is cleaner; keep the token
    threshold = threshold
      .replace(/\s*°C\b/g, '')
      .replace(/\s*км\/ч\b/g, '')
      .replace(/\s*об\/мин\b/g, '')
      .replace(/\s*В\b/g, '')
      .replace(/\s*м\/с²\b/g, '')
      .replace(/\s*Гц\b/g, '')
      .replace(/\s*%\b/g, '')
      .trim()
    // drop trailing descriptive parens if any remain
    if (!param || /[А-Яа-я]/.test(param)) continue // only ascii feature keys
    out.push({
      param,
      op,
      threshold,
      weight: 1,
      rationale: '',
    })
  }
  return out
}

// Parses "Источники:" bullet list (or references inline in body paragraph).
function extractSourcesBullets(lines, start) {
  const out = []
  let i = start
  while (i < lines.length && lines[i].trim() === '') i++
  while (i < lines.length) {
    const l = lines[i]
    const t = l.trim()
    if (t === '') {
      // allow single blank between bullets
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
        i++
        continue
      }
      break
    }
    if (BOLD_LABEL.test(t)) break
    if (/^###?\s/.test(l)) break
    const m = t.match(/^[-*]\s*(?:\[([^\]]+)\]\s*)?(.+)$/)
    if (!m) break
    const ref = (m[1] || '').trim() || null
    const citation = (m[2] || '').trim()
    const doi = extractDoi(citation)
    const url = extractUrl(citation)
    out.push({
      ref,
      citation,
      ...(doi ? { doi } : {}),
      ...(url ? { url } : {}),
    })
    i++
  }
  return { items: out, next: i }
}

function extractDoi(text) {
  if (!text) return null
  const m = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i)
  return m ? m[0].replace(/[.,;]$/, '') : null
}

function extractUrl(text) {
  if (!text) return null
  const m = text.match(/https?:\/\/[^\s)\]]+/)
  return m ? m[0].replace(/[.,;]$/, '') : null
}

// Parses "Код:" body — can be a single line with inline `path:line` refs,
// or a bullet list. Returns array of {file, line}.
function parseCodePointers(text) {
  if (!text) return []
  const out = []
  const re = /`?([A-Za-z0-9_./\-]+?\.(?:py|json|ts|tsx|mjs|js|sql))`?(?:[:#](\d+))?/g
  let m
  while ((m = re.exec(text)) !== null) {
    const file = m[1]
    const line = m[2] ? Number(m[2]) : 0
    if (!out.some((p) => p.file === file && p.line === line)) {
      out.push({ file, line })
    }
  }
  return out
}

function parseCodePointersLines(lines, start) {
  const parts = []
  let i = start
  while (i < lines.length && lines[i].trim() === '') i++
  while (i < lines.length) {
    const l = lines[i]
    const t = l.trim()
    if (t === '') break
    if (BOLD_LABEL.test(t)) break
    if (/^###?\s/.test(l)) break
    // bullet or inline
    const bullet = t.match(/^[-*]\s*(.+)$/)
    parts.push(bullet ? bullet[1] : t)
    i++
  }
  return { pointers: parseCodePointers(parts.join(' ')), next: i }
}

// ─── Rule heading parsing ──────────────────────────────────────────────────
// Handles h3 (### 1.18 front_suspension_worn) and h4 (#### 2.1.1 exhaust_leak)
// Accepts:
//   ### 1.1 `wheel_imbalance_speed_resonance`
//   ### 1.11 `shock_absorber_worn` (существующее)
//   ### 1.11 shock_absorber_worn — Износ амортизатора
//   ### 1.11 Износ амортизатора (shock_absorber_worn)
//   ### 1.18 front_suspension_worn
//   #### 2.1.4 knock_detonation (legacy)
const NOISE_PAREN = /\b(?:legacy|shadow|existing|new|deprecated|существующее)\b/i

function parseRuleHeading(text) {
  const raw = text.trim()
  const sectionMatch = raw.match(/^(\d+\.\d+(?:\.\d+)?)\s+(.*)$/)
  if (!sectionMatch) return null
  const section = sectionMatch[1]
  let tail = sectionMatch[2].trim()

  const flags = {
    shadow: /\[shadow\]|\(shadow\)/i.test(tail),
    legacy: /\blegacy\b|\(legacy\)|\(существующее\)/i.test(tail),
  }

  // Try: `rule_name` ... — Display — or ... (...)
  const back = tail.match(/`([a-z][a-z0-9_]*)`/i)
  let ruleName = null
  let display = ''

  if (back) {
    ruleName = back[1]
    // strip the `rule_name` from tail, then clean noise parens, dashes
    let rest = tail
      .replace(/`[^`]+`/, '')
      .replace(/\((?:[^)]*(?:legacy|shadow|existing|new|deprecated|существующее)[^)]*)\)/i, '')
      .replace(/^[\s—–-]+/, '')
      .replace(/[\s—–-]+$/, '')
      .trim()
    display = rest
  } else {
    // Try "Display (rule_name)"
    const paren = tail.match(/\(([a-z][a-z0-9_]*)\)/i)
    if (paren && !NOISE_PAREN.test(paren[1])) {
      ruleName = paren[1]
      display = tail.replace(/\([^)]+\)/, '').trim()
    } else {
      // Bare: "rule_name" optionally followed by "— Display" or "(legacy)"
      const bare = tail.match(/^([a-z][a-z0-9_]+)(?:\s*\(([^)]+)\))?(?:\s*[—–-]\s*(.+))?$/i)
      if (bare) {
        const name = bare[1]
        if (NOISE_PAREN.test(name)) return null
        ruleName = name
        display = (bare[3] || '').trim() || name
      }
    }
  }

  if (!ruleName) return null
  display = (display || ruleName).replace(/\s+/g, ' ').trim()
  // If display literally duplicates "rule_name — rule_name" strip dup
  return { section, ruleName, display, ...flags }
}

// Creates a fresh rule record with default values.
function makeRule({ ruleName, display, section, tier = 'T2', shadow = false }) {
  return {
    rule_name: ruleName,
    display,
    section,
    tier,
    min_confidence: 0.4,
    cooldown_days: 7,
    what: '',
    physics: '',
    formulas: [],
    conditions: [],
    theory: '',
    example: '',
    sources: [],
    code_pointers: [],
    appendices_used: [],
    shadow,
  }
}

// ─── Meta line parsing ─────────────────────────────────────────────────────
// Example:
//   **Tier:** T2 | **min_confidence:** 40 | **Cooldown:** 7 дней | **DTC:** P0301
//   **Контекст:** min_speed 60 | **Tier:** T2 | **Confidence:** min 40 | ...
//   **Tier:** T2 | **Confidence:** min 35 (пониженный) | **Cooldown:** 1 день
function applyMetaLine(rule, text) {
  if (!text) return
  const tierM = text.match(/\bTier:?\*?\*?\s*([T][123])/i)
  if (tierM) rule.tier = parseTier(tierM[1]) || rule.tier

  const confM =
    text.match(/min[_ ]confidence\s*:?\*?\*?\s*(\d+(?:[.,]\d+)?)/i) ||
    text.match(/Confidence:?\*?\*?\s*min\s*(\d+(?:[.,]\d+)?)/i)
  if (confM) {
    const v = Number(confM[1].replace(',', '.'))
    const frac = parsePercentToFraction(v)
    if (frac != null) rule.min_confidence = frac
  }

  const cdM = text.match(/Cooldown:?\*?\*?\s*(\d+)\s*(?:дн|days|d\b)/i)
  if (cdM) rule.cooldown_days = Number(cdM[1])
  else if (/Cooldown:?\*?\*?\s*1\s*день/i.test(text)) rule.cooldown_days = 1

  // accumulate appendices if the meta line references A.XX explicitly
  const apps = collectAppendicesFromText(text)
  for (const a of apps) {
    if (!rule.appendices_used.includes(a)) rule.appendices_used.push(a)
  }
}

// Inline "Код:" one-line — "`path:line` (...), `other.json` rule #X"
function applyCodeLine(rule, text) {
  const ptrs = parseCodePointers(text)
  for (const p of ptrs) {
    if (!rule.code_pointers.some((q) => q.file === p.file && q.line === p.line)) {
      rule.code_pointers.push(p)
    }
  }
}

// ─── Main walk ─────────────────────────────────────────────────────────────

const MODE_RULES = 'rules'
const MODE_METHODS = 'methods'
const MODE_SOURCES = 'sources'

function parseReference() {
  if (!existsSync(SRC_MD)) {
    throw new Error(`RULES-REFERENCE.md not found at ${SRC_MD}`)
  }
  const raw = readFileSync(SRC_MD, 'utf8')
  const lines = raw.split(/\r?\n/)

  const rules = []
  const methods = []
  const sources = []
  let mode = MODE_RULES
  let currentRule = null
  let currentMethod = null
  let shadowSection = false

  const finalizeRule = () => {
    if (!currentRule) return
    if (!currentRule.rule_name) {
      warn(`Rule without name at section ${currentRule.section}`)
    } else {
      // derive theory/physics-originated appendices just before finalizing
      const allText = [
        currentRule.physics,
        currentRule.theory,
        currentRule.what,
      ].join(' ')
      for (const a of collectAppendicesFromText(allText)) {
        if (!currentRule.appendices_used.includes(a)) {
          currentRule.appendices_used.push(a)
        }
      }
      rules.push(currentRule)
    }
    currentRule = null
  }

  const finalizeMethod = () => {
    if (currentMethod) methods.push(currentMethod)
    currentMethod = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // H2 mode switches
    const h2 = line.match(H2)
    if (h2) {
      const title = h2[1]
      if (/^Приложение\s*A/i.test(title)) {
        finalizeRule()
        mode = MODE_METHODS
        continue
      }
      if (/^Приложение\s*B/i.test(title)) {
        finalizeRule()
        finalizeMethod()
        mode = MODE_SOURCES
        continue
      }
      if (/^\d+\./.test(title)) {
        // top-level rule section (1-11). Do not change mode, but finalize.
        finalizeRule()
        shadowSection = /Shadow/i.test(title)
        continue
      }
      // "## Параметры системы", "## Динамика деградации" etc. just finalize.
      finalizeRule()
      continue
    }

    if (mode === MODE_METHODS) {
      const h3 = line.match(H3)
      if (h3) {
        const mA = h3[1].match(/^(A\.\d{1,2})\s+(.+)$/)
        if (mA) {
          finalizeMethod()
          currentMethod = {
            code: mA[1],
            name: mA[2].trim(),
            description: '',
            key_formula: undefined,
            used_by_rules: [],
          }
          continue
        }
      }
      if (!currentMethod) continue
      // descriptive paragraph: first non-empty, non-bold, non-fence line
      if (
        !currentMethod.description &&
        trimmed &&
        !BOLD_LABEL.test(trimmed) &&
        !/^```/.test(trimmed) &&
        !trimmed.startsWith('|') &&
        !trimmed.startsWith('-')
      ) {
        const { text, next } = extractParagraph(lines, i)
        currentMethod.description = text
        i = next - 1
        continue
      }
      if (/^\*\*Правила:\*\*/.test(trimmed)) {
        const rest = trimmed.replace(/^\*\*Правила:\*\*\s*/, '')
        currentMethod.used_by_rules = rest
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
        continue
      }
      if (!currentMethod.key_formula && trimmed.startsWith('```')) {
        const code = []
        let j = i + 1
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          code.push(lines[j])
          j++
        }
        currentMethod.key_formula = code.join('\n').slice(0, 800)
        i = j
        continue
      }
      continue
    }

    if (mode === MODE_SOURCES) {
      // Bracketed citations inside fenced blocks: [1], [V3], [S1], [L2]
      const cite = line.match(/^\s*\[([A-Za-z]?\d+[A-Za-z]?)\]\s+(.+)$/)
      if (cite) {
        const id = cite[1].trim()
        let citation = cite[2].trim()
        let j = i + 1
        while (j < lines.length) {
          const ll = lines[j]
          const lt = ll.trim()
          const keep = lt && !/^\s*\[/.test(ll) && !/^###?\s/.test(ll) && !/^```/.test(ll)
          if (!keep) break
          citation += ' ' + lt
          j++
        }
        i = j - 1
        citation = citation.replace(/\s+/g, ' ').trim()
        const doi = extractDoi(citation)
        const url = extractUrl(citation)
        let type = 'other'
        if (id.startsWith('S') || /\bISO\b|\bSAE\b|\bGOST\b|Directive|ГОСТ/.test(citation)) type = 'standard'
        else if (id.startsWith('V')) type = 'vendor-doc'
        else if (id.startsWith('L')) type = 'internal'
        else if (doi) type = 'peer-reviewed'
        sources.push({
          id,
          citation,
          ...(doi ? { doi } : {}),
          ...(url ? { url } : {}),
          type,
        })
      }
      continue
    }

    // MODE_RULES
    const h3 = line.match(H3)
    const h4 = line.match(H4)
    const heading = h3 ? h3[1] : h4 ? h4[1] : null
    if (heading) {
      // Skip non-rule h3 like "Базовые линии (Baseline) и z-score"
      const parsed = parseRuleHeading(heading)
      if (parsed) {
        finalizeRule()
        const defaultTier = parsed.section.startsWith('2.') ? 'T3'
          : parsed.section.startsWith('3.') ? 'T2'
          : parsed.section.startsWith('4.') ? 'T1'
          : parsed.section.startsWith('5.') ? 'T2'
          : parsed.section.startsWith('6.') ? 'T2'
          : 'T2'
        currentRule = makeRule({
          ruleName: parsed.ruleName,
          display: parsed.display,
          section: parsed.section,
          tier: defaultTier,
          shadow: parsed.shadow || shadowSection,
        })
        continue
      }
      // h3 without rule_name — skip
      if (h3) finalizeRule()
      continue
    }

    if (!currentRule) continue

    // Field extractors
    if (/^\*\*Что детектирует:\*\*/i.test(trimmed)) {
      const rest = trimmed.replace(/^\*\*Что детектирует:\*\*\s*/i, '')
      if (rest) {
        currentRule.what = rest
      } else {
        const { text, next } = extractParagraph(lines, i + 1)
        currentRule.what = text
        i = next - 1
      }
      continue
    }

    if (/^\*\*Физика:\*\*/i.test(trimmed)) {
      const rest = trimmed.replace(/^\*\*Физика:\*\*\s*/i, '')
      const chunks = []
      if (rest) chunks.push(rest)
      // read paragraph; may span several blank-separated paragraphs until next bold label
      let j = i + 1
      while (j < lines.length) {
        const tt = lines[j].trim()
        if (tt === '') { j++; continue }
        if (BOLD_LABEL.test(tt)) break
        if (/^###?\s/.test(lines[j])) break
        if (tt.startsWith('```')) break
        if (tt.startsWith('|')) break
        const { text, next } = extractParagraph(lines, j)
        if (text) chunks.push(text)
        j = next
      }
      currentRule.physics = chunks.join('\n\n')
      i = j - 1
      continue
    }

    if (/^\*\*Формулы:\*\*/i.test(trimmed)) {
      const { blocks, next } = extractFormulaBlocks(lines, i + 1)
      if (blocks.length > 0) {
        currentRule.formulas.push(...blocks)
      } else {
        // fallback: try to grab the following paragraph as a free-text formula
        const { text, next: n2 } = extractParagraph(lines, i + 1)
        if (text) currentRule.formulas.push({ code: text })
        i = n2 - 1
        continue
      }
      i = next - 1
      continue
    }

    if (
      /^\*\*Условия\s*срабатывания:\*\*/i.test(trimmed) ||
      /^\*\*Таблица\s*условий:\*\*/i.test(trimmed)
    ) {
      const { conds, next } = parseConditionsTable(lines, i + 1)
      currentRule.conditions.push(...conds)
      i = next - 1
      continue
    }

    if (/^\*\*Условия:\*\*/i.test(trimmed)) {
      const rest = trimmed.replace(/^\*\*Условия:\*\*\s*/i, '')
      if (rest) {
        const conds = parseInlineConditions(rest)
        currentRule.conditions.push(...conds)
        continue
      }
      // No inline — try table
      const { conds, next } = parseConditionsTable(lines, i + 1)
      currentRule.conditions.push(...conds)
      i = next - 1
      continue
    }

    // Standalone condition table header without bold label (compact rules)
    if (
      currentRule.conditions.length === 0 &&
      /^\|\s*(?:Условие|Парамет[рыeе])\s*\|/i.test(line)
    ) {
      const { conds, next } = parseConditionsTable(lines, i)
      currentRule.conditions.push(...conds)
      i = next - 1
      continue
    }

    if (/^\*\*Теоретический\s*контекст:\*\*/i.test(trimmed)) {
      // collect paragraph(s) and bullets until next bold label
      const chunks = []
      let j = i + 1
      while (j < lines.length) {
        const l2 = lines[j]
        const t2 = l2.trim()
        if (t2 === '') { j++; continue }
        if (BOLD_LABEL.test(t2)) break
        if (/^###?\s/.test(l2)) break
        if (t2.startsWith('```')) break
        // bullets
        if (/^[-*]\s/.test(t2)) {
          chunks.push(t2.replace(/^[-*]\s*/, ''))
          j++
          continue
        }
        const { text, next } = extractParagraph(lines, j)
        if (text) chunks.push(text)
        j = next
      }
      currentRule.theory = chunks.join(' ').replace(/\s+/g, ' ').trim()
      i = j - 1
      continue
    }

    if (/^\*\*Пример\s*расчёта:\*\*/i.test(trimmed)) {
      const { blocks, next } = extractFormulaBlocks(lines, i + 1)
      currentRule.example = blocks.map((b) => b.code).join('\n\n')
      i = next - 1
      continue
    }

    if (
      /^\*\*Источники:\*\*/i.test(trimmed) ||
      /^\*\*Ссылки:\*\*/i.test(trimmed)
    ) {
      const { items, next } = extractSourcesBullets(lines, i + 1)
      currentRule.sources.push(...items)
      i = next - 1
      continue
    }

    if (
      /^\*\*Код:\*\*/i.test(trimmed) ||
      /^\*\*Code:\*\*/i.test(trimmed) ||
      /^\*\*Реализация:\*\*/i.test(trimmed) ||
      /^\*\*Файлы:\*\*/i.test(trimmed)
    ) {
      const rest = trimmed.replace(BOLD_LABEL, '')
      if (rest) {
        applyCodeLine(currentRule, rest)
        // some code lines also continue on next bullets
      }
      // also try reading following bullets
      const { pointers, next } = parseCodePointersLines(lines, i + 1)
      for (const p of pointers) {
        if (!currentRule.code_pointers.some((q) => q.file === p.file && q.line === p.line)) {
          currentRule.code_pointers.push(p)
        }
      }
      if (pointers.length > 0) i = next - 1
      continue
    }

    if (/^\*\*Использует:\*\*/i.test(trimmed)) {
      const rest = trimmed.replace(BOLD_LABEL, '')
      const apps = collectAppendicesFromText(rest)
      for (const a of apps) {
        if (!currentRule.appendices_used.includes(a)) {
          currentRule.appendices_used.push(a)
        }
      }
      continue
    }

    if (/^\*\*Заменяет:\*\*/i.test(trimmed) || /^\*\*Дополняет:\*\*/i.test(trimmed)) {
      const rest = trimmed.replace(BOLD_LABEL, '')
      const mName = rest.match(/`?([a-z0-9_]+)`?/i)
      if (mName) currentRule.replaces = mName[1]
      continue
    }

    if (/^\*\*Тип:\*\*/i.test(trimmed)) {
      if (/shadow/i.test(trimmed)) currentRule.shadow = true
      continue
    }

    // Combined meta line (Tier / min_confidence / Cooldown / DTC)
    if (
      /\*\*Tier:\*\*/i.test(trimmed) ||
      /\*\*Контекст:\*\*/i.test(trimmed) ||
      /\*\*Confidence:\*\*/i.test(trimmed)
    ) {
      applyMetaLine(currentRule, trimmed)
      continue
    }

    // Plain `Tier:` / `min_confidence:` lines (used in legacy blocks)
    if (/^Tier:/i.test(trimmed)) {
      applyMetaLine(currentRule, trimmed)
      continue
    }

    // Catch inline appendix mentions like "см. A.30" even outside Физика.
    if (/A\.\d+/.test(trimmed)) {
      for (const a of collectAppendicesFromText(trimmed)) {
        if (!currentRule.appendices_used.includes(a)) {
          currentRule.appendices_used.push(a)
        }
      }
    }
  }

  finalizeRule()
  finalizeMethod()

  // Walk through inline rule tables (sections 7-11)
  parseInlineTableRules(lines, rules)

  return { rules, methods, sources }
}

// Inline table rules: sections 7-11.
// Format:
//   | Правило | Условия | DTC | Cooldown |
//   | `engine_overheating` — Перегрев двигателя | coolant_temp > 100°C, rpm > 1200 | P0217 | 7 дн |
function parseInlineTableRules(lines, rules) {
  let currentSection = null
  let inTable = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const h2 = line.match(H2)
    if (h2) {
      const m = h2[1].match(/^(\d+)\./)
      currentSection = m ? m[1] : null
      inTable = false
      continue
    }
    const h3 = line.match(H3)
    if (h3) {
      const m = h3[1].match(/^(\d+\.\d+)/)
      if (m) currentSection = m[1]
      inTable = false
      continue
    }
    if (!currentSection) continue
    const top = currentSection.split('.')[0]
    if (!['7', '8', '9', '10', '11'].includes(top)) continue

    if (/^\|\s*Правило\s*\|/i.test(line)) {
      inTable = true
      i++ // skip separator row on next iteration
      continue
    }
    if (!inTable) continue
    if (!line.trim().startsWith('|')) {
      inTable = false
      continue
    }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 2) continue
    // skip separator rows
    if (/^[-: ]+$/.test(cells[0])) continue
    const ruleCell = cells[0] || ''
    const condCell = cells[1] || ''
    const dtcCell = cells[2] || ''
    const cdOrConfCell = cells[3] || ''

    const mName = ruleCell.match(/`([a-z0-9_]+)`\s*(?:[—–-]\s*(.+))?$/i)
    if (!mName) continue
    const ruleName = mName[1]
    const display = (mName[2] || '').trim() || ruleName
    const conds = parseInlineConditions(condCell)
    const cdMatch = cdOrConfCell.match(/(\d+)\s*(?:дн|d|day)/i)
    const cooldown = cdMatch ? Number(cdMatch[1]) : 7
    const minConfMatch = cdOrConfCell.match(/^\s*(\d+)\s*$/)
    const minConf = minConfMatch ? Number(minConfMatch[1]) / 100 : 0.4

    const dtcRefs = []
    if (dtcCell && dtcCell !== '—' && dtcCell !== '-') {
      const dtcMatches = dtcCell.match(/P\d[A-Z0-9]{3}/gi) || []
      for (const d of dtcMatches) {
        dtcRefs.push({ ref: 'DTC', citation: d.toUpperCase() })
      }
      if (dtcRefs.length === 0 && dtcCell.trim()) {
        dtcRefs.push({ ref: 'DTC', citation: dtcCell })
      }
    }

    rules.push({
      rule_name: ruleName,
      display,
      section: currentSection,
      tier: 'T1',
      min_confidence: minConf,
      cooldown_days: cooldown,
      what: display,
      physics: '',
      formulas: [],
      conditions: conds,
      theory: '',
      example: '',
      sources: dtcRefs,
      code_pointers: [],
      appendices_used: [],
      shadow: false,
    })
  }
}

// ─── Validation and emit ───────────────────────────────────────────────────

function validate(rules) {
  if (rules.length < 100) {
    throw new Error(
      `Validation failed: only ${rules.length} rules parsed; expected >= 100`,
    )
  }
  for (const r of rules) {
    if (!r.rule_name) {
      throw new Error(
        `Validation failed: rule at section ${r.section} has no rule_name`,
      )
    }
    // If display equals rule_name (no hand-written display) AND we captured a
    // "what" paragraph, synthesize a short display from the first clause so
    // the UI shows something human-readable.
    if ((r.display === r.rule_name || !r.display) && r.what) {
      const firstClause = r.what.split(/[—.—]/)[0].trim()
      if (firstClause && firstClause.length > 3 && firstClause.length < 80) {
        r.display = firstClause.replace(/^[A-Z]/, (c) => c.toUpperCase())
      }
    }
    // Static Russian fallback for rules whose markdown has no Russian
    // display and no "what" paragraph to synthesize from.
    if (r.display === r.rule_name || !r.display) {
      const fallback = RU_FALLBACK[r.rule_name]
      if (fallback) r.display = fallback
    }
    if (!r.display) {
      warn(`rule ${r.rule_name} missing display`)
      r.display = r.rule_name
    }
    for (const c of r.conditions) {
      if (typeof c.weight !== 'number' || Number.isNaN(c.weight)) {
        c.weight = 1
      }
    }
  }
}

function validatePartCatalogCrossRefs(rules) {
  const pcPath = resolve(OUT_DIR, 'partCatalog.ts')
  if (!existsSync(pcPath)) return
  const src = readFileSync(pcPath, 'utf8')
  const referenced = new Set()
  const re = /relatedRules:\s*\[([^\]]*)\]/g
  let m
  while ((m = re.exec(src)) !== null) {
    const arr = m[1]
    const names = arr.match(/['"]([a-z0-9_]+)['"]/gi) || []
    for (const n of names) referenced.add(n.replace(/['"]/g, ''))
  }
  const existing = new Set(rules.map((r) => r.rule_name))
  const missing = []
  for (const ref of referenced) {
    if (!existing.has(ref)) missing.push(ref)
  }
  if (missing.length > 0) {
    warn(`partCatalog references unknown rules: ${missing.join(', ')}`)
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

// Cross-link methods.used_by_rules: translate section numbers ("1.3", "1.6")
// to rule_names where possible so downstream code can resolve them.
// ALSO reverse-link: for every method A.X used by rule Y, push "A.X" into
// rules[Y].appendices_used so the drawer can show which appendices back the rule.
function crossLinkMethodsToRules(methods, rules) {
  const bySection = new Map()
  const byName = new Map()
  for (const r of rules) {
    bySection.set(r.section, r.rule_name)
    byName.set(r.rule_name, r)
  }
  // Expand tokens like "1.3, 1.5; 4.1" → individual section refs so we can
  // resolve each one; split once per method.
  for (const m of methods) {
    const resolved = []
    const raw = (m.used_by_rules || []).join(', ')
    const tokens = raw
      .split(/[,;]| и | и\s|\s+и\s+/i)
      .map((t) => t.trim())
      .filter(Boolean)
    for (const tokenRaw of tokens) {
      // Strip trailing punctuation / backticks, keep inner section numbers
      const token = tokenRaw.replace(/^[*`\s]+|[*`\s]+$/g, '').trim()
      if (!token) continue
      // section number form: "1.3", "1.3.5"
      const secMatch = token.match(/^(\d+\.\d+(?:\.\d+)?)/)
      if (secMatch && bySection.has(secMatch[1])) {
        resolved.push(bySection.get(secMatch[1]))
        continue
      }
      // rule_name form: "wheel_bearing_bpfo_harmonics"
      const nameMatch = token.match(/^([a-z][a-z0-9_]+)/i)
      if (nameMatch && byName.has(nameMatch[1])) {
        resolved.push(nameMatch[1])
        continue
      }
      // keep raw phrase for reference (e.g. "Все T3-правила")
      resolved.push(token)
    }
    // dedupe while preserving order
    const seen = new Set()
    m.used_by_rules = resolved.filter((t) => {
      if (seen.has(t)) return false
      seen.add(t)
      return true
    })

    // reverse link: push method.code into every linked rule's appendices_used
    if (!m.code) continue
    for (const ruleName of m.used_by_rules) {
      const rule = byName.get(ruleName)
      if (!rule) continue
      if (!rule.appendices_used.includes(m.code)) {
        rule.appendices_used.push(m.code)
      }
    }
  }
}

function computeCoverage(rules) {
  const total = rules.length
  const pct = (n) => Math.round((n / total) * 100)
  const c = {
    physics: rules.filter((r) => r.physics && r.physics.trim()).length,
    formulas: rules.filter((r) => r.formulas && r.formulas.length > 0).length,
    conditions: rules.filter((r) => r.conditions && r.conditions.length > 0).length,
    theory: rules.filter((r) => r.theory && r.theory.trim()).length,
    sources: rules.filter((r) => r.sources && r.sources.length > 0).length,
    code_pointers: rules.filter((r) => r.code_pointers && r.code_pointers.length > 0).length,
    appendices: rules.filter((r) => r.appendices_used && r.appendices_used.length > 0).length,
    displayDiff: rules.filter((r) => r.display && r.display !== r.rule_name).length,
    what: rules.filter((r) => r.what && r.what.trim()).length,
  }
  return {
    total,
    counts: c,
    percents: {
      physics: pct(c.physics),
      formulas: pct(c.formulas),
      conditions: pct(c.conditions),
      theory: pct(c.theory),
      sources: pct(c.sources),
      code_pointers: pct(c.code_pointers),
      appendices: pct(c.appendices),
      displayDiff: pct(c.displayDiff),
      what: pct(c.what),
    },
  }
}

// Scan each rule's body text for inline citations like [V1], [5], [S2], [L3]
// and, if the biblio catalog contains a matching id, append a source row.
function backfillInlineSources(rules, biblio) {
  const byId = new Map()
  for (const s of biblio) byId.set(s.id, s)
  const inlineRe = /\[([A-Z]?\d+[A-Z]?)\]/g
  for (const r of rules) {
    const haystack = [r.physics, r.theory, r.what, r.example]
      .filter(Boolean)
      .join('\n')
    if (!haystack) continue
    const found = new Set()
    let m
    while ((m = inlineRe.exec(haystack)) !== null) found.add(m[1])
    inlineRe.lastIndex = 0
    for (const id of found) {
      if (r.sources.some((s) => s.ref === id)) continue
      const b = byId.get(id)
      if (!b) continue
      r.sources.push({
        ref: id,
        citation: b.citation,
        ...(b.doi ? { doi: b.doi } : {}),
        ...(b.url ? { url: b.url } : {}),
      })
    }
  }
}

function main() {
  ensureDir(OUT_DIR)
  const { rules, methods, sources } = parseReference()

  // Dedupe rules by rule_name (keep first occurrence — typically the full doc).
  const seen = new Map()
  for (const r of rules) {
    if (!seen.has(r.rule_name)) seen.set(r.rule_name, r)
  }
  const unique = [...seen.values()]

  validate(unique)
  validatePartCatalogCrossRefs(unique)
  crossLinkMethodsToRules(methods, unique)
  backfillInlineSources(unique, sources)

  writeFileSync(
    resolve(OUT_DIR, 'rulesCatalog.json'),
    JSON.stringify(unique, null, 2),
    'utf8',
  )
  writeFileSync(
    resolve(OUT_DIR, 'methodsCatalog.json'),
    JSON.stringify(methods, null, 2),
    'utf8',
  )
  writeFileSync(
    resolve(OUT_DIR, 'biblioCatalog.json'),
    JSON.stringify(sources, null, 2),
    'utf8',
  )

  const cov = computeCoverage(unique)
  console.log(`[build-rules] Parsed ${cov.total} rules`)
  console.log(
    `[build-rules] Coverage: physics=${cov.percents.physics}%, formulas=${cov.percents.formulas}%, conditions=${cov.percents.conditions}%, theory=${cov.percents.theory}%, sources=${cov.percents.sources}%, code_pointers=${cov.percents.code_pointers}%, appendices=${cov.percents.appendices}%`,
  )
  console.log(
    `[build-rules] ${cov.counts.displayDiff}/${cov.total} rules have display != rule_name (${cov.percents.displayDiff}%)`,
  )
  console.log(
    `[build-rules] Methods: ${methods.length}; Sources: ${sources.length}`,
  )
  if (warnings.length > 0) {
    console.log(`[build-rules] Warnings: ${warnings.length} rules failed minimal validation`)
    for (const w of warnings.slice(0, 20)) console.warn('  - ' + w)
  }
}

main()
