import { useState, useEffect, useMemo, useCallback } from 'react'
import { GlassPanel } from '../shared/GlassPanel'

/* ─── Data interfaces ─── */
interface Article { id: string; title: string; qa: string; type: 'article' }
interface Rule { id: string; title: string; conditions: string; tier: string; dtc: string[]; type: 'rule' }
interface DiagData { articles: Article[]; rules: Rule[] }

/* ─── Tier configuration ─── */
const TIER_CFG: Record<string, { label: string; color: string; glow: string; priority: number }> = {
  T1: { label: 'Критическое', color: '#FF1744', glow: 'rgba(255,23,68,0.5)',  priority: 1 },
  T2: { label: 'Важное',      color: '#FFB800', glow: 'rgba(255,184,0,0.4)',  priority: 2 },
  T3: { label: 'Контроль',    color: '#00E5FF', glow: 'rgba(0,229,255,0.35)', priority: 3 },
}

/* ─── System classification ─── */
interface SystemDef {
  key: string; name: string; icon: string; color: string
  match: (r: Rule) => boolean
}

const SYSTEMS: SystemDef[] = [
  {
    key: 'suspension', name: 'Подвеска', icon: '🔧', color: '#64FFDA',
    match: r => /suspension|wheel|shock|strut|ball_joint|bushing|stabilizer|imbalance|lateral_instability|rough_road|tire_flat|crest_factor/.test(r.id) || /az_|vibration/.test(r.conditions),
  },
  {
    key: 'engine', name: 'Двигатель', icon: '⚙️', color: '#FF8C00',
    match: r => /engine|misfire|knock|overheating|oil|idle|stalling|overrev|mount|egr|turbo|catalytic|catalyst|warmup/.test(r.id) || /RPM|rpm|engine|throttle|maf|map_pressure|intake|p0104|p0111/.test(r.conditions),
  },
  {
    key: 'electrical', name: 'Электрика', icon: '⚡', color: '#FFD700',
    match: r => /battery|alternator|starter|wiring|fuse|voltage|charging/.test(r.id) || /voltage|BATT/.test(r.conditions),
  },
  {
    key: 'fuel', name: 'Топливо', icon: '⛽', color: '#FF6B6B',
    match: r => /fuel|injector|pump|lambda|vacuum_leak|lean|rich|p0171|p0172|p0174|p0175|p0442|stft|evap/.test(r.id) || /LTFT|ltft|STFT|stft|fuel_trim/.test(r.conditions),
  },
  {
    key: 'cooling', name: 'Охлаждение', icon: '🌡️', color: '#4FC3F7',
    match: r => /coolant|thermostat|radiator|fan|overheat|water_pump|cold_engine|summer_overheat|ac_compressor/.test(r.id) || /coolant|TEMP/.test(r.conditions),
  },
  {
    key: 'audio', name: 'Шумы и звуки', icon: '🔊', color: '#CE93D8',
    match: r => /noise|rattle|squeal|squeak|whistle|rumble|click|grinding|belt_|brake_squeal|intake_noise|valve_train|wind_noise|power_steering_noise|compressor_noise|fuel_pump_noise|starter_grinding|timing_chain|loose_heat|audio_speed/.test(r.id) || /spectral|freq|dominant_amp/.test(r.conditions),
  },
  {
    key: 'transmission', name: 'Трансмиссия', icon: '🔗', color: '#AED581',
    match: r => /trans|clutch|gear|shift|drivetrain|cv_joint|axle/.test(r.id),
  },
  {
    key: 'ev', name: 'EV / Гибрид', icon: '🔋', color: '#00E676',
    match: r => /hv_|soc_|range_extender|motor_overheat|e_motor|regen_brake|inverter/.test(r.id) || /hv_/.test(r.conditions),
  },
]

function classifyRule(r: Rule): string {
  for (const sys of SYSTEMS) if (sys.match(r)) return sys.key
  return 'general'
}

/* ─── Human-readable condition labels ─── */
const CL: Record<string, { label: string; unit: string }> = {
  az_std:              { label: 'Стд. откл. вибрации Z',       unit: 'м/с²' },
  ax_std:              { label: 'Стд. откл. вибрации X',       unit: 'м/с²' },
  ay_std:              { label: 'Стд. откл. вибрации Y',       unit: 'м/с²' },
  total_vibration:     { label: 'Общая вибрация',              unit: 'м/с²' },
  az_range:            { label: 'Размах вибрации Z',           unit: 'м/с²' },
  az_mean:             { label: 'Средняя вибрация Z',          unit: 'м/с²' },
  coolant_temp:        { label: 'Т° охлаждающей жидкости',     unit: '°C' },
  voltage:             { label: 'Напряжение борт. сети',       unit: 'В' },
  rpm:                 { label: 'Обороты двигателя',           unit: 'об/мин' },
  speed:               { label: 'Скорость автомобиля',         unit: 'км/ч' },
  ltft_abs:            { label: 'Коррекция топлива |LTFT|',    unit: '%' },
  ltft_bank1:          { label: 'LTFT банк 1',                 unit: '%' },
  ltft_bank2:          { label: 'LTFT банк 2',                 unit: '%' },
  stft_bank1:          { label: 'STFT банк 1',                 unit: '%' },
  LTFT_B1:             { label: 'Долгоср. коррекция Б1',       unit: '%' },
  LTFT_B2:             { label: 'Долгоср. коррекция Б2',       unit: '%' },
  STFT_B1:             { label: 'Краткоср. коррекция Б1',      unit: '%' },
  STFT_B2:             { label: 'Краткоср. коррекция Б2',      unit: '%' },
  fuel_trim_delta:     { label: 'Дельта коррекции топлива',    unit: '%' },
  dominant_freq:       { label: 'Доминантная частота',         unit: 'Гц' },
  dominant_amp:        { label: 'Доминантная амплитуда',       unit: '' },
  spectral_energy:     { label: 'Спектральная энергия',        unit: '' },
  o2_voltage:          { label: 'Напряжение O₂ датчика',       unit: 'В' },
  map_pressure:        { label: 'Давление впуска MAP',         unit: 'кПа' },
  maf:                 { label: 'Расход воздуха (MAF)',        unit: 'г/с' },
  engine_load:         { label: 'Нагрузка двигателя',          unit: '%' },
  throttle:            { label: 'Положение дросселя',          unit: '%' },
  intake_temp:         { label: 'Т° впускного воздуха',        unit: '°C' },
  fuel_pressure:       { label: 'Давление топлива',            unit: 'кПа' },
  oil_temp:            { label: 'Т° масла',                    unit: '°C' },
  oil_pressure:        { label: 'Давление масла',              unit: 'бар' },
  boost_pressure:      { label: 'Давление наддува',            unit: 'кПа' },
  catalyst_temp:       { label: 'Т° катализатора',             unit: '°C' },
  lambda:              { label: 'Лямбда-зонд',                unit: '' },
  timing_advance:      { label: 'Угол опережения',            unit: '°' },
  crest_factor_z:      { label: 'Крест-фактор Z',             unit: '' },
  vibration_speed_ratio: { label: 'Вибрация/скорость',        unit: '' },
  hv_battery_temp:     { label: 'Т° ВВ батареи',              unit: '°C' },
  hv_battery_soc:      { label: 'Заряд ВВ батареи',           unit: '%' },
  hv_battery_voltage:  { label: 'Напряжение ВВ батареи',      unit: 'В' },
  hv_battery_current:  { label: 'Ток ВВ батареи',             unit: 'А' },
  hv_cell_voltage_delta: { label: 'Дельта ячеек ВВБ',         unit: 'В' },
  e_motor_temp:        { label: 'Т° электромотора',            unit: '°C' },
  inverter_temp:       { label: 'Т° инвертора',                unit: '°C' },
  range_extender_runtime: { label: 'Время РЭ',                unit: 'с' },
  regen_brake_power:   { label: 'Мощность рекуперации',        unit: 'кВт' },
  p0104:               { label: 'Нагрузка двигателя',          unit: '%' },
  p0111:               { label: 'Положение дросселя',           unit: '%' },
}

/* ─── Condition parser ─── */
function parseCondition(raw: string): string {
  const betweenMatch = raw.match(/^(\w+)\s+between\s+([\d.]+),([\d.]+)$/)
  if (betweenMatch) {
    const [, param, lo, hi] = betweenMatch
    const info = CL[param]
    const u = info?.unit ? ` ${info.unit}` : ''
    return `${info?.label ?? param}: в диапазоне ${lo}${u} — ${hi}${u}`
  }

  const zMatch = raw.match(/^(\w+)\s+z>\s*([\d.]+)$/)
  if (zMatch) {
    const [, param, val] = zMatch
    const info = CL[param]
    return `${info?.label ?? param} > ${val}σ (Z-score)`
  }

  const stdMatch = raw.match(/^(\w+)\s*([><=!]+)\s*([\d.-]+)$/)
  if (stdMatch) {
    const [, param, op, val] = stdMatch
    const info = CL[param]
    const u = info?.unit ? ` ${info.unit}` : ''
    return `${info?.label ?? param} ${op} ${val}${u}`
  }

  return raw
}

function parseConditions(conditions: string): string[] {
  if (!conditions.trim()) return []
  return conditions.split(',').map(c => parseCondition(c.trim())).filter(Boolean)
}

/* ─── Pluralization helper ─── */
function ruleWord(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'правило'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'правила'
  return 'правил'
}

/* ─── Grouped data structure ─── */
interface SystemGroup {
  def: SystemDef; rules: Rule[]; tiers: Record<string, number>
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export function RulesList() {
  const [data, setData] = useState<DiagData | null>(null)
  const [tab, setTab] = useState<'rules' | 'articles'>('rules')
  const [openSystems, setOpenSystems] = useState<Set<string>>(new Set())
  const [openRule, setOpenRule] = useState<string | null>(null)
  const [openArticle, setOpenArticle] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/diagnostic-rules.json`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
  }, [])

  /* ── Group rules by system ── */
  const { groups, systemCount } = useMemo(() => {
    if (!data) return { groups: [], systemCount: 0 }
    const buckets: Record<string, Rule[]> = {}
    for (const r of data.rules) (buckets[classifyRule(r)] ??= []).push(r)

    const generalDef: SystemDef = {
      key: 'general', name: 'Общее', icon: '📋', color: '#90A4AE', match: () => false,
    }
    const result: SystemGroup[] = []
    for (const sys of [...SYSTEMS, generalDef]) {
      const rules = buckets[sys.key]
      if (!rules?.length) continue
      const tiers: Record<string, number> = {}
      for (const r of rules) tiers[r.tier] = (tiers[r.tier] || 0) + 1
      result.push({ def: sys, rules, tiers })
    }
    return { groups: result, systemCount: result.length }
  }, [data])

  const toggleSystem = useCallback((key: string) => {
    setOpenSystems(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [])

  if (!data) return null

  const totalRules = data.rules.length
  const tierCounts = { T1: 0, T2: 0, T3: 0 }
  for (const r of data.rules) if (r.tier in tierCounts) tierCounts[r.tier as keyof typeof tierCounts]++

  /* helper: system icons row for metric card */
  const systemIcons = groups.map(g => g.def.icon).join(' ')

  /* ═══ RENDER ═══ */
  return (
    <GlassPanel>
      {/* ── Section title ── */}
      <div className="hud-header mb-3" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>Движок доверия</span>
        <span style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: 8, color: 'rgba(0,229,255,0.35)',
          letterSpacing: '0.15em', textTransform: 'uppercase', marginLeft: 'auto',
        }}>TRUST ENGINE</span>
      </div>

      {/* ════════════════════════════════════════════════════
          TRUST HEADER — 4 metric cards
          ════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12,
      }}>
        {/* Rules count */}
        <MetricCard value={totalRules} label="правил проверки" color="#00E5FF" />
        {/* Systems */}
        <MetricCard value={systemCount} label="систем авто" color="#64FFDA" sub={systemIcons} />
        {/* Articles */}
        <MetricCard value={data.articles.length} label="статей-гайдов" color="#FF8C00" sub="📖" />
        {/* Tier legend card */}
        <div style={metricCardStyle('#CE93D8')}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {(['T1', 'T2', 'T3'] as const).map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={tierDotStyle(t)} />
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 14,
                  fontWeight: 700, color: TIER_CFG[t].color,
                  textShadow: `0 0 8px ${TIER_CFG[t].glow}`,
                }}>{tierCounts[t]}</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(['T1', 'T2', 'T3'] as const).map(t => (
              <span key={t} style={{
                fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: TIER_CFG[t].color,
                opacity: 0.7, whiteSpace: 'nowrap',
              }}>
                {t} {TIER_CFG[t].label}
              </span>
            ))}
          </div>
          <div style={metricLabelStyle}>уровни правил</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          TABS
          ════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          className={`nav-btn ${tab === 'rules' ? 'active' : ''}`}
          onClick={() => setTab('rules')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>⚙</span> Правила <span style={tabCountStyle}>{totalRules}</span>
        </button>
        <button
          className={`nav-btn ${tab === 'articles' ? 'active' : ''}`}
          onClick={() => setTab('articles')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>📖</span> Статьи <span style={tabCountStyle}>{data.articles.length}</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════
          SCROLLABLE CONTENT
          ════════════════════════════════════════════════════ */}
      <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 2 }}>

        {/* ─── RULES TAB ─── */}
        {tab === 'rules' && groups.map(g => {
          const isOpen = openSystems.has(g.def.key)
          const total = g.rules.length
          return (
            <div key={g.def.key} style={systemCardStyle(g.def.color, isOpen)}>
              {/* System group header */}
              <div
                style={systemHeaderStyle}
                onClick={() => toggleSystem(g.def.key)}
              >
                {/* Icon box */}
                <div style={systemIconBoxStyle(g.def.color)}>{g.def.icon}</div>

                {/* Name + count */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 600,
                    color: 'var(--text-secondary)', letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                  }}>{g.def.name}</div>
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                    color: `${g.def.color}AA`, marginTop: 1,
                  }}>
                    {total} {ruleWord(total)}
                  </div>
                </div>

                {/* Tier distribution bar */}
                <div style={{
                  display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden',
                  flex: '0 1 100px', gap: 1, marginLeft: 'auto',
                }}>
                  {(['T1', 'T2', 'T3'] as const).map(t => {
                    const count = g.tiers[t] || 0
                    if (!count) return null
                    return (
                      <div key={t} title={`${t}: ${count}`} style={{
                        width: `${(count / total) * 100}%`,
                        background: TIER_CFG[t].color, borderRadius: 1, opacity: 0.7,
                      }} />
                    )
                  })}
                </div>

                {/* Tier count chips */}
                <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                  {(['T1', 'T2', 'T3'] as const).map(t => {
                    const c = g.tiers[t] || 0
                    if (!c) return null
                    return (
                      <span key={t} style={{
                        fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                        color: TIER_CFG[t].color, opacity: 0.7,
                      }}>{c}</span>
                    )
                  })}
                </div>

                {/* Chevron */}
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                  color: 'rgba(255,255,255,0.3)', marginLeft: 8,
                  transition: 'transform 0.3s',
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}>▶</span>
              </div>

              {/* Expanded rules list */}
              {isOpen && (
                <div style={{ paddingBottom: 10 }}>
                  {g.rules
                    .slice()
                    .sort((a, b) => (TIER_CFG[a.tier]?.priority ?? 9) - (TIER_CFG[b.tier]?.priority ?? 9))
                    .map(r => (
                      <RuleCard
                        key={r.id}
                        rule={r}
                        isExpanded={openRule === r.id}
                        onToggle={() => setOpenRule(openRule === r.id ? null : r.id)}
                      />
                    ))}
                </div>
              )}
            </div>
          )
        })}

        {/* ─── ARTICLES TAB ─── */}
        {tab === 'articles' && data.articles.map((a, idx) => {
          const isExp = openArticle === a.id
          return (
            <div
              key={a.id}
              style={articleCardStyle(isExp)}
              onClick={() => setOpenArticle(isExp ? null : a.id)}
            >
              {/* Article header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: "'Rajdhani', sans-serif", fontSize: 13,
                fontWeight: 700, color: 'var(--text-secondary)',
              }}>
                {/* Number badge */}
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 11,
                  color: '#FF8C00', minWidth: 30, textAlign: 'center' as const,
                  padding: '2px 6px', borderRadius: 3,
                  background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.15)',
                }}>#{String(idx + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1 }}>{a.title}</span>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                  color: 'rgba(0,229,255,0.3)', transition: 'transform 0.3s',
                  transform: isExp ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>▶</span>
              </div>

              {/* Article body */}
              {isExp && (
                <div style={{
                  marginTop: 12, paddingTop: 12,
                  borderTop: '1px solid rgba(0,229,255,0.08)',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: 12,
                  color: 'var(--text-muted)', lineHeight: 1.8,
                  whiteSpace: 'pre-line' as const,
                }}>{a.qa}</div>
              )}
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

/* ── Metric card for trust header ── */
function MetricCard({ value, label, color, sub }: {
  value: number; label: string; color: string; sub?: string
}) {
  return (
    <div style={metricCardStyle(color)}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: 28, fontWeight: 700,
        color, lineHeight: 1,
        textShadow: `0 0 14px ${color}60, 0 0 30px ${color}25`,
      }}>{value}</div>
      {sub && <div style={{
        fontSize: 11, marginTop: 4, lineHeight: 1.2, textAlign: 'center' as const,
        letterSpacing: sub.length > 3 ? '2px' : '0',
      }}>{sub}</div>}
      <div style={metricLabelStyle}>{label}</div>
    </div>
  )
}

/* ── Single rule card ── */
function RuleCard({ rule: r, isExpanded, onToggle }: {
  rule: Rule; isExpanded: boolean; onToggle: () => void
}) {
  const cfg = TIER_CFG[r.tier] ?? TIER_CFG.T3
  const conditions = useMemo(() => parseConditions(r.conditions), [r.conditions])

  return (
    <div
      style={{
        padding: '10px 14px', margin: '0 10px 4px', borderRadius: 5,
        background: isExpanded ? `${cfg.color}0A` : 'rgba(255,255,255,0.015)',
        borderLeft: `3px solid ${cfg.color}`,
        cursor: 'pointer', transition: 'all 0.2s',
      }}
      onClick={onToggle}
    >
      {/* Rule header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={tierDotStyle(r.tier)} />
        <div style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
          fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1.3, flex: 1,
        }}>{r.title}</div>
        <span style={tierBadgeStyle(r.tier)}>
          <span style={tierDotStyle(r.tier)} />
          {cfg.label}
        </span>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${cfg.color}15` }}>
          {/* Conditions */}
          {conditions.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <SectionLabel>Условия срабатывания</SectionLabel>
              {conditions.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: 12,
                  color: 'rgba(255,255,255,0.65)', lineHeight: 1.4,
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--accent-cyan)', opacity: 0.5, flexShrink: 0,
                  }} />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}

          {/* DTC codes */}
          {r.dtc.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <SectionLabel>Связанные DTC</SectionLabel>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {r.dtc.map(code => (
                  <span key={code} style={{
                    fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 700,
                    color: '#FF8C00', padding: '2px 8px', borderRadius: 3,
                    background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.2)',
                  }}>{code}</span>
                ))}
              </div>
            </div>
          )}

          {/* No conditions / no DTC fallback */}
          {conditions.length === 0 && r.dtc.length === 0 && (
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: 11,
              color: 'rgba(255,255,255,0.3)', fontStyle: 'italic',
            }}>Определяется по коду ошибки OBD-II</div>
          )}

          {/* Confidence footer */}
          <div style={{
            marginTop: 8, paddingTop: 6,
            borderTop: `1px solid ${cfg.color}0A`,
            fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
            color: 'rgba(255,255,255,0.2)',
          }}>
            Порог надёжности: {r.tier} — {cfg.label}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tiny section label ── */
function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: "'Orbitron', sans-serif", fontSize: 8, fontWeight: 600,
      color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const,
      letterSpacing: '1px', marginBottom: 6,
    }}>{children}</div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STYLE HELPERS (functions & constants)
   ═══════════════════════════════════════════════════════════════════ */

function metricCardStyle(color: string): React.CSSProperties {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '16px 8px 12px', borderRadius: 6,
    background: `linear-gradient(135deg, ${color}0A, ${color}03)`,
    border: `1px solid ${color}20`, position: 'relative', overflow: 'hidden',
  }
}

const metricLabelStyle: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif", fontSize: 10, fontWeight: 600,
  color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginTop: 5, textAlign: 'center',
}

function tierDotStyle(tier: string): React.CSSProperties {
  const cfg = TIER_CFG[tier] ?? TIER_CFG.T3
  return {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    background: cfg.color, boxShadow: `0 0 8px ${cfg.glow}`,
    animation: tier === 'T1' ? 'pulse-critical 2s ease-in-out infinite' : undefined,
  }
}

function tierBadgeStyle(tier: string): React.CSSProperties {
  const cfg = TIER_CFG[tier] ?? TIER_CFG.T3
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 9, fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
    color: cfg.color, padding: '2px 8px', borderRadius: 3,
    background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`,
    whiteSpace: 'nowrap', flexShrink: 0,
  }
}

const tabCountStyle: React.CSSProperties = {
  fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
  opacity: 0.6,
}

function systemCardStyle(color: string, isOpen: boolean): React.CSSProperties {
  return {
    borderRadius: 6, overflow: 'hidden', marginBottom: 6, transition: 'all 0.3s',
    background: isOpen ? `linear-gradient(135deg, ${color}0A, ${color}04)` : 'rgba(0,229,255,0.015)',
    border: `1px solid ${isOpen ? `${color}30` : 'rgba(0,229,255,0.08)'}`,
  }
}

const systemHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '12px 14px', cursor: 'pointer', userSelect: 'none',
}

function systemIconBoxStyle(color: string): React.CSSProperties {
  return {
    width: 34, height: 34, borderRadius: 6, flexShrink: 0,
    background: `${color}12`, border: `1px solid ${color}30`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
  }
}

function articleCardStyle(isExpanded: boolean): React.CSSProperties {
  return {
    padding: '12px 14px', borderRadius: 5, marginBottom: 5,
    cursor: 'pointer', transition: 'all 0.25s',
    background: isExpanded ? 'rgba(0,229,255,0.05)' : 'rgba(0,229,255,0.015)',
    border: `1px solid ${isExpanded ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.06)'}`,
  }
}
