import { useState, useEffect, useMemo } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'
import { cachedFetch } from '../../utils/fetchCache'
import { PARAM_LABELS, PARAM_NORMS, zoneColor } from './paramNorms'

interface Rule { id: string; title: string; conditions: string; tier: string; dtc: string[]; type: 'rule' }
interface DiagData { articles: unknown[]; rules: Rule[] }

/* ─── Tier config ─── */
const TIER: Record<string, { label: string; color: string; icon: string; action: string }> = {
  T1: { label: 'Критическое', color: theme.status.critical, icon: '🔴', action: 'Требуется немедленное внимание. Не откладывайте.' },
  T2: { label: 'Важное', color: theme.status.warning, icon: '🟡', action: 'Запланируйте проверку в ближайшие дни.' },
  T3: { label: 'Контроль', color: theme.accent.cyan, icon: '🔵', action: 'Следите за динамикой. Пока не критично.' },
}

/* ─── Condition labels (parameter → Russian name + unit) ─── */
const CL: Record<string, [string, string]> = {
  az_std: ['Стд. откл. вибрации Z', 'м/с²'], ax_std: ['Стд. откл. вибрации X', 'м/с²'],
  ay_std: ['Стд. откл. вибрации Y', 'м/с²'], total_vibration: ['Общая вибрация', 'м/с²'],
  az_range: ['Размах вибрации Z', 'м/с²'], az_mean: ['Средняя вибрация Z', 'м/с²'],
  coolant_temp: ['Т° охл. жидкости', '°C'], voltage: ['Напряжение борт. сети', 'В'],
  rpm: ['Обороты двигателя', 'об/мин'], speed: ['Скорость', 'км/ч'],
  LTFT_B1: ['Долгоср. корр. топлива Б1', '%'], LTFT_B2: ['Долгоср. корр. топлива Б2', '%'],
  STFT_B1: ['Краткоср. корр. топлива Б1', '%'], STFT_B2: ['Краткоср. корр. топлива Б2', '%'],
  dominant_freq: ['Доминантная частота', 'Гц'], dominant_amp: ['Доминантная амплитуда', ''],
  spectral_energy: ['Спектральная энергия', ''], engine_load: ['Нагрузка двигателя', '%'],
  throttle: ['Положение дросселя', '%'], intake_temp: ['Т° впускного воздуха', '°C'],
  maf: ['Расход воздуха (MAF)', 'г/с'], fuel_pressure: ['Давление топлива', 'кПа'],
  oil_temp: ['Т° масла', '°C'], boost_pressure: ['Давление наддува', 'кПа'],
  catalyst_temp: ['Т° катализатора', '°C'], crest_factor: ['Крест-фактор', ''],
}

/* ─── Why it matters: human explanation per rule pattern ─── */
const WHY: Record<string, string> = {
  engine_overheating: 'Двигатель перегрет — если продолжить движение, возможна деформация головки блока. Ремонт от 50 000 руб.',
  alternator_failure: 'Генератор не выдаёт достаточно тока — аккумулятор разряжается. Авто может заглохнуть в любой момент.',
  fuel_lean: 'Смесь бедная — двигатель работает с избытком воздуха. Перегрев выпускного тракта, прогар клапанов.',
  fuel_rich: 'Смесь богатая — перерасход топлива, разрушение катализатора, масло разжижается бензином.',
  low_battery: 'Напряжение аккумулятора ниже нормы — возможен отказ запуска, сброс настроек ЭБУ.',
  misfire: 'Пропуски зажигания — потеря мощности, тряска двигателя, несгоревшее топливо убивает катализатор.',
  oil_pressure_low: 'Низкое давление масла — масляное голодание двигателя. Задиры вкладышей, заклинивание.',
  catalyst_degradation: 'Катализатор деградирует — токсичность выхлопа растёт, расход топлива увеличивается.',
  worn_suspension: 'Подвеска изношена — увеличивается тормозной путь, ухудшается управляемость на неровностях.',
  wheel_imbalance: 'Дисбаланс колёс — вибрация на руле, неравномерный износ шин, нагрузка на ступичные подшипники.',
  stalling_risk: 'Двигатель может заглохнуть — опасно в потоке: усилитель тормозов и руля отключатся.',
  vacuum_leak: 'Подсос воздуха мимо датчика — ЭБУ не может правильно дозировать топливо. Нестабильный ХХ.',
  excessive_fuel_consumption: 'Расход топлива выше нормы — деньги уходят впустую. Причина может быть в датчиках, форсунках или зажигании.',
  thermostat_stuck_open: 'Термостат заклинил в открытом положении — двигатель не прогревается. Повышенный расход, износ.',
  thermostat_stuck_closed: 'Термостат заклинил закрытым — охлаждающая жидкость не циркулирует. Перегрев неизбежен.',
  transmission_slip: 'АКПП проскальзывает — потеря ускорения, рывки при переключении. Может потребоваться ремонт коробки.',
  egr_malfunction: 'EGR не работает — повышенный выброс NOx, нагар во впуске, потеря мощности.',
  turbo_lag_excessive: 'Турбина запаздывает — возможна утечка наддува, износ актуатора или вестгейта.',
}

/* ─── What to do when triggered ─── */
const ACTION: Record<string, string> = {
  engine_overheating: 'Остановитесь. Дайте двигателю остыть 15-20 мин. Проверьте уровень антифриза. Не открывайте крышку радиатора на горячую.',
  alternator_failure: 'Выключите кондиционер, подогревы, музыку — минимизируйте нагрузку. Езжайте в сервис или вызовите эвакуатор.',
  fuel_lean: 'Проверьте подсосы воздуха (прокладка впуска, шланги). Замените воздушный фильтр. Диагностика лямбда-зондов.',
  fuel_rich: 'Проверьте форсунки (перелив), датчик температуры, давление топлива. Замените свечи.',
  low_battery: 'Зарядите АКБ внешним зарядным. Проверьте клеммы на окисление. При частых разрядах — замена АКБ.',
  misfire: 'Замените свечи зажигания и катушки (начните с цилиндра из DTC). Проверьте компрессию.',
  oil_pressure_low: 'НЕМЕДЛЕННО заглушите двигатель! Проверьте уровень масла. Не заводите до выяснения причины. Эвакуатор.',
  worn_suspension: 'Запишитесь на диагностику ходовой. Избегайте ям и лежачих полицейских. Проверьте стойки и сайлентблоки.',
  wheel_imbalance: 'Сделайте балансировку колёс. Проверьте шины на грыжи и неравномерный износ.',
  stalling_risk: 'Избегайте резких манёвров. Если заглох в потоке — включите аварийку, затормозите, заведите заново.',
  vacuum_leak: 'Проверьте все вакуумные шланги, прокладку впускного коллектора, клапан PCV.',
  thermostat_stuck_open: 'Замените термостат. Простая и недорогая операция (1 500-5 000 руб. с работой).',
  thermostat_stuck_closed: 'Замените термостат срочно. До замены — следите за температурой, останавливайтесь при перегреве.',
  transmission_slip: 'Замените масло АКПП если давно не меняли. Диагностика на стенде. Не игнорируйте — ремонт АКПП дорог.',
}

function humanize(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(part => {
    const z = part.match(/^(\w+)\s+z([><])\s*(.+)/)
    if (z) { const c = CL[z[1]]; return `${c?.[0] || z[1]} ${z[2] === '>' ? '>' : '<'} ${z[3]}σ${c?.[1] ? ' ' + c[1] : ''}` }
    const m = part.match(/^(\w+)\s*([><!=]+)\s*(.+)/)
    if (m) { const c = CL[m[1]]; return `${c?.[0] || m[1]} ${m[2]} ${m[3]}${c?.[1] ? ' ' + c[1] : ''}` }
    return part
  })
}

/* ─── System classification ─── */
const SYS_ICON: Record<string, string> = {
  'Подвеска': '🛞', 'Двигатель': '⚙️', 'Электрика': '⚡', 'Топливо': '⛽',
  'Охлаждение': '🌡️', 'Шумы': '🔊', 'Трансмиссия': '🔗', 'Общее': '📋',
}

function classifySystem(r: Rule): string {
  const id = r.id; const c = r.conditions
  if (/suspension|wheel|shock|strut|bushing|stabilizer|imbalance|lateral|tire_flat|crest|rough_road|vibration_at_speed/.test(id) || /az_|vibration/.test(c)) return 'Подвеска'
  if (/engine|misfire|knock|overheating|oil|idle|stalling|overrev|mount|egr|turbo|catalytic|warmup|throttle|intake_vacuum|maf_reading/.test(id) || /RPM|rpm|throttle|maf/.test(c)) return 'Двигатель'
  if (/battery|alternator|starter|wiring|fuse|voltage|charging|inverter|hv_battery|soc_critical/.test(id) || /voltage|BATT/.test(c)) return 'Электрика'
  if (/fuel|injector|pump|lambda|vacuum|lean|rich|p0171|p0172|stft|evap|p0442|o2_sensor/.test(id) || /LTFT|ltft|STFT|stft/.test(c)) return 'Топливо'
  if (/coolant|thermostat|radiator|fan|overheat|water_pump|cold_engine|ac_compressor|summer_overheat/.test(id) || /coolant|TEMP/.test(c)) return 'Охлаждение'
  if (/noise|rattle|squeal|whistle|rumble|click|grinding|belt_|brake_squeal|intake_noise|valve_train|wind_noise|audio|timing_chain|loose_heat/.test(id) || /spectral|freq|dominant_amp/.test(c)) return 'Шумы'
  if (/trans|clutch|gear|shift|drivetrain|cv_joint|axle/.test(id)) return 'Трансмиссия'
  return 'Общее'
}

function getWhy(r: Rule): string {
  if (WHY[r.id]) return WHY[r.id]
  const sys = classifySystem(r)
  if (r.tier === 'T1') return `${r.title} — проблема требует внимания. Если игнорировать, возможен дорогой ремонт или небезопасная ситуация на дороге.`
  if (r.tier === 'T2') return `${r.title} — отклонение в системе "${sys}". Пока не критично, но при ухудшении может привести к серьёзным последствиям.`
  return `${r.title} — LLCAR отслеживает этот параметр для раннего обнаружения проблем.`
}

function getAction(r: Rule): string {
  if (ACTION[r.id]) return ACTION[r.id]
  if (r.tier === 'T1') return 'Запишитесь на диагностику в ближайший сервис. Не откладывайте — проблема может усугубиться.'
  if (r.tier === 'T2') return 'Запланируйте проверку при следующем ТО или в ближайшие 1-2 недели.'
  return 'Продолжайте наблюдение. Если значение ухудшается — обратитесь к специалисту.'
}

export function RulesList({ filterSystem }: { filterSystem?: string } = {}) {
  const [data, setData] = useState<DiagData | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openSystem, setOpenSystem] = useState<string | null>(null)
  const [hoveredRule, setHoveredRule] = useState<string | null>(null)

  useEffect(() => {
    cachedFetch(`${import.meta.env.BASE_URL}data/diagnostic-rules.json`)
      .then(d => setData(d))
      .catch(() => {})
  }, [])

  const groups = useMemo(() => {
    if (!data) return []
    const filtered = filterSystem
      ? data.rules.filter(r => classifySystem(r) === filterSystem)
      : data.rules
    const g: Record<string, Rule[]> = {}
    for (const r of filtered) {
      const sys = classifySystem(r)
      if (!g[sys]) g[sys] = []
      g[sys].push(r)
    }
    // Sort: by count descending
    return Object.entries(g).sort((a, b) => b[1].length - a[1].length)
  }, [data, filterSystem])

  if (!data) return null

  const allRules = filterSystem
    ? data.rules.filter(r => classifySystem(r) === filterSystem)
    : data.rules
  const totalRules = allRules.length
  const t1Count = allRules.filter(r => r.tier === 'T1').length
  const systemCount = groups.length

  return (
    <GlassPanel>
      {/* Header with stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="hud-header" style={{ margin: 0 }}>Правила проверки</div>
        <div style={{ display: 'flex', gap: 12, fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: theme.text.muted }}>
          <span><strong style={{ color: theme.accent.cyan, fontFamily: "'Share Tech Mono', monospace" }}>{totalRules}</strong> правил</span>
          <span><strong style={{ color: theme.status.critical, fontFamily: "'Share Tech Mono', monospace" }}>{t1Count}</strong> критических</span>
          <span><strong style={{ color: theme.accent.teal, fontFamily: "'Share Tech Mono', monospace" }}>{systemCount}</strong> систем</span>
        </div>
      </div>

      {/* Subtitle */}
      <div style={{
        fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: theme.text.muted,
        lineHeight: 1.5, marginBottom: 16, paddingBottom: 12,
        borderBottom: '1px solid rgba(0,229,255,0.08)',
      }}>
        LLCAR автоматически проверяет {totalRules} параметров вашего автомобиля при каждом сканировании.
        Каждое правило основано на инженерных нормах и данных от производителей.
      </div>

      {/* System groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
        {groups.map(([system, rules]) => {
          const isOpen = openSystem === system
          const icon = SYS_ICON[system] || '📋'
          const t1 = rules.filter(r => r.tier === 'T1').length
          const t2 = rules.filter(r => r.tier === 'T2').length
          const t3 = rules.filter(r => r.tier === 'T3').length

          return (
            <div key={system}>
              {/* System header — clickable to expand/collapse */}
              <div
                onClick={() => setOpenSystem(isOpen ? null : system)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  borderRadius: 6, cursor: 'pointer', transition: 'all 0.25s',
                  background: isOpen
                    ? 'linear-gradient(135deg, rgba(100,255,218,0.1), rgba(0,229,255,0.05))'
                    : 'linear-gradient(135deg, rgba(0,229,255,0.04), transparent)',
                  border: `1px solid ${isOpen ? 'rgba(100,255,218,0.2)' : 'rgba(0,229,255,0.08)'}`,
                  boxShadow: isOpen ? '0 0 12px rgba(100,255,218,0.08)' : 'none',
                }}
              >
                <span style={{
                  fontSize: 28, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,229,255,0.08)', borderRadius: 6, border: '1px solid rgba(0,229,255,0.12)',
                }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: theme.text.secondary }}>
                    {system}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: theme.text.muted }}>
                    {rules.length} правил проверки
                  </div>
                </div>
                {/* Tier mini-badges */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {t1 > 0 && <span style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace", color: theme.status.critical, padding: '1px 5px', borderRadius: 2, background: `${theme.status.critical}15`, border: `1px solid ${theme.status.critical}25` }}>{t1}</span>}
                  {t2 > 0 && <span style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace", color: theme.status.warning, padding: '1px 5px', borderRadius: 2, background: `${theme.status.warning}15`, border: `1px solid ${theme.status.warning}25` }}>{t2}</span>}
                  {t3 > 0 && <span style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace", color: theme.accent.cyan, padding: '1px 5px', borderRadius: 2, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>{t3}</span>}
                </div>
                <span style={{ fontSize: 12, color: theme.text.muted, transition: 'transform 0.3s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
              </div>

              {/* Expanded rules list */}
              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0 8px 16px' }}>
                  {rules.map(r => {
                    const tier = TIER[r.tier] || TIER.T3
                    const isExp = expandedId === r.id
                    const conditions = humanize(r.conditions)
                    const why = getWhy(r)
                    const action = getAction(r)

                    return (
                      <div
                        key={r.id}
                        onClick={() => setExpandedId(isExp ? null : r.id)}
                        onMouseEnter={() => setHoveredRule(r.id)}
                        onMouseLeave={() => setHoveredRule(null)}
                        style={{
                          padding: '10px 12px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.25s',
                          background: isExp
                            ? `linear-gradient(135deg, ${tier.color}18, ${tier.color}08)`
                            : `linear-gradient(135deg, ${tier.color}08, transparent)`,
                          border: `1px solid ${isExp ? `${tier.color}30` : `${tier.color}12`}`,
                          borderLeft: `3px solid ${tier.color}`,
                          boxShadow: hoveredRule === r.id ? `0 0 16px ${tier.color}25` : (isExp ? `0 0 10px ${tier.color}15` : 'none'),
                        }}
                      >
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontSize: 14, lineHeight: '18px' }}>{tier.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, color: theme.text.primary }}>
                              {r.title}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 8, fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
                            color: tier.color, padding: '2px 6px', borderRadius: 2, whiteSpace: 'nowrap',
                            background: `${tier.color}12`, border: `1px solid ${tier.color}25`,
                          }}>
                            {tier.label}
                          </span>
                        </div>

                        {/* WHY — always visible, 1-2 sentences */}
                        <div style={{
                          fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: theme.text.muted,
                          marginTop: 4, lineHeight: 1.5, paddingLeft: 22,
                        }}>
                          {why}
                        </div>

                        {/* Expanded: HOW + WHAT TO DO */}
                        {isExp && (
                          <div style={{ marginTop: 10, paddingLeft: 22 }}>
                            {/* HOW: conditions */}
                            <div style={{
                              fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                              color: theme.accent.teal, marginBottom: 4, letterSpacing: '0.03em',
                            }}>
                              Как проверяем:
                            </div>
                            {conditions.map((c, i) => (
                              <div key={i} style={{
                                fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: theme.text.secondary,
                                padding: '2px 0 2px 12px', borderLeft: `2px solid rgba(0,229,255,0.15)`,
                                marginBottom: 2,
                              }}>
                                {c}
                              </div>
                            ))}

                            {/* Formula for trust */}
                            <div style={{
                              fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(0,229,255,0.5)',
                              marginTop: 6, padding: '3px 8px', borderRadius: 3,
                              background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.06)',
                            }}>
                              {r.conditions}
                            </div>

                            {/* Parameter Scales */}
                            {(() => {
                              const parsed = r.conditions.split(',')
                                .map(s => s.trim())
                                .map(s => {
                                  const m = s.match(/^(\w+)\s*[><=!]+\s*([\d.]+)/)
                                  if (!m) return null
                                  const param = m[1]
                                  const value = parseFloat(m[2])
                                  if (!(param in PARAM_NORMS)) return null
                                  return { param, value }
                                })
                                .filter(Boolean) as { param: string; value: number }[]

                              if (parsed.length === 0) return null

                              return (
                                <div style={{ margin: '8px 0', padding: '6px 8px', background: 'rgba(0,229,255,0.03)', borderRadius: 4, border: '1px solid rgba(0,229,255,0.08)' }}>
                                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontFamily: "'Rajdhani', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Параметры</div>
                                  {parsed.map(({ param, value }) => {
                                    const norm = PARAM_NORMS[param]
                                    const label = PARAM_LABELS[param] || param
                                    const color = zoneColor(value, norm)
                                    const pct = Math.max(0, Math.min(100, ((value - norm.min) / (norm.max - norm.min)) * 100))
                                    return (
                                      <div key={param} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', width: 90, flexShrink: 0, fontFamily: "'Rajdhani', sans-serif" }}>{label}</span>
                                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                                          {/* Green zone */}
                                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: 'linear-gradient(90deg, rgba(255,23,68,0.2) 0%, rgba(0,230,118,0.2) 20%, rgba(0,230,118,0.2) 80%, rgba(255,23,68,0.2) 100%)', borderRadius: 3 }} />
                                          {/* Value marker */}
                                          <div style={{ position: 'absolute', left: `${pct}%`, top: -1, width: 2, height: 8, background: color, borderRadius: 1, boxShadow: `0 0 4px ${color}` }} />
                                        </div>
                                        <span style={{ fontSize: 9, color, fontFamily: "'Share Tech Mono', monospace", width: 50, textAlign: 'right', flexShrink: 0 }}>{value}{norm.unit ? ` ${norm.unit}` : ''}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })()}

                            {/* WHAT TO DO */}
                            <div style={{
                              fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                              color: tier.color, marginTop: 10, marginBottom: 4,
                            }}>
                              Что делать:
                            </div>
                            <div style={{
                              fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: theme.text.secondary,
                              lineHeight: 1.5, padding: '6px 10px', borderRadius: 4,
                              background: `${tier.color}08`, border: `1px solid ${tier.color}12`,
                            }}>
                              {action}
                            </div>

                            {/* DTC codes */}
                            {r.dtc.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif" }}>Связанные DTC:</span>
                                {r.dtc.map(code => (
                                  <span key={code} style={{
                                    fontFamily: "'Orbitron', sans-serif", fontSize: 8, fontWeight: 700,
                                    color: theme.status.warning, padding: '2px 5px', borderRadius: 2,
                                    background: `${theme.status.warning}10`, border: `1px solid ${theme.status.warning}20`,
                                  }}>{code}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}
