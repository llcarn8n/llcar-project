import { useState, useEffect } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface Article { id: string; title: string; qa: string; type: 'article' }
interface Rule { id: string; title: string; conditions: string; tier: string; dtc: string[]; type: 'rule' }
interface DiagData { articles: Article[]; rules: Rule[] }

const TIER_COLORS: Record<string, { label: string; color: string }> = {
  T1: { label: 'Критическое', color: theme.status.critical },
  T2: { label: 'Важное', color: theme.status.warning },
  T3: { label: 'Контроль', color: theme.accent.cyan },
}

/* ─── Human-readable condition labels ─── */
const COND_LABELS: Record<string, { label: string; unit: string }> = {
  az_std: { label: 'Стд. откл. вибрации Z', unit: 'м/с²' },
  ax_std: { label: 'Стд. откл. вибрации X', unit: 'м/с²' },
  ay_std: { label: 'Стд. откл. вибрации Y', unit: 'м/с²' },
  total_vibration: { label: 'Общая вибрация', unit: 'м/с²' },
  az_range: { label: 'Размах вибрации Z', unit: 'м/с²' },
  az_mean: { label: 'Средняя вибрация Z', unit: 'м/с²' },
  coolant_temp: { label: 'Т° охл. жидкости', unit: '°C' },
  voltage: { label: 'Напряжение борт. сети', unit: 'В' },
  rpm: { label: 'Обороты двигателя', unit: 'об/мин' },
  speed: { label: 'Скорость', unit: 'км/ч' },
  LTFT_B1: { label: 'Долгоср. корр. топлива Б1', unit: '%' },
  LTFT_B2: { label: 'Долгоср. корр. топлива Б2', unit: '%' },
  STFT_B1: { label: 'Краткоср. корр. топлива Б1', unit: '%' },
  STFT_B2: { label: 'Краткоср. корр. топлива Б2', unit: '%' },
  dominant_freq: { label: 'Доминантная частота', unit: 'Гц' },
  dominant_amp: { label: 'Доминантная амплитуда', unit: '' },
  spectral_energy: { label: 'Спектральная энергия', unit: '' },
  engine_load: { label: 'Нагрузка двигателя', unit: '%' },
  throttle: { label: 'Положение дросселя', unit: '%' },
  intake_temp: { label: 'Т° впускного воздуха', unit: '°C' },
  maf: { label: 'Расход воздуха (MAF)', unit: 'г/с' },
  fuel_pressure: { label: 'Давление топлива', unit: 'кПа' },
  oil_temp: { label: 'Т° масла', unit: '°C' },
  boost_pressure: { label: 'Давление наддува', unit: 'кПа' },
  catalyst_temp: { label: 'Т° катализатора', unit: '°C' },
  crest_factor: { label: 'Крест-фактор', unit: '' },
}

function humanizeCondition(raw: string): { human: string; formula: string } {
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
  const humanParts: string[] = []
  for (const part of parts) {
    // Handle "param z> value" (z-score)
    const zMatch = part.match(/^(\w+)\s+z([><])\s*(.+)/)
    if (zMatch) {
      const info = COND_LABELS[zMatch[1]]
      const label = info ? info.label : zMatch[1]
      const unit = info?.unit ? ` ${info.unit}` : ''
      humanParts.push(`${label} ${zMatch[2] === '>' ? '>' : '<'} ${zMatch[3]}σ${unit}`)
      continue
    }
    // Handle "param between X,Y" — but between splits on comma, so check next part
    const betweenMatch = part.match(/^(\w+)\s+between\s+(.+)/)
    if (betweenMatch) {
      const info = COND_LABELS[betweenMatch[1]]
      const label = info ? info.label : betweenMatch[1]
      humanParts.push(`${label}: ${betweenMatch[2].replace(',', ' — ')}`)
      continue
    }
    // Handle "param > value" or "param < value"
    const stdMatch = part.match(/^(\w+)\s*([><!=]+)\s*(.+)/)
    if (stdMatch) {
      const info = COND_LABELS[stdMatch[1]]
      const label = info ? info.label : stdMatch[1]
      const unit = info?.unit ? ` ${info.unit}` : ''
      humanParts.push(`${label} ${stdMatch[2]} ${stdMatch[3]}${unit}`)
      continue
    }
    humanParts.push(part)
  }
  return { human: humanParts.join(' • '), formula: raw }
}

/* ─── System classification for rules ─── */
function classifySystem(r: Rule): string {
  const id = r.id; const c = r.conditions
  if (/suspension|wheel|shock|strut|bushing|stabilizer|imbalance|lateral|tire_flat|crest/.test(id) || /az_|vibration/.test(c)) return 'Подвеска'
  if (/engine|misfire|knock|overheating|oil|idle|stalling|overrev|mount|egr|turbo|catalytic|warmup/.test(id) || /RPM|rpm|throttle|maf/.test(c)) return 'Двигатель'
  if (/battery|alternator|starter|wiring|fuse|voltage|charging/.test(id) || /voltage|BATT/.test(c)) return 'Электрика'
  if (/fuel|injector|pump|lambda|vacuum|lean|rich|p0171|p0172|stft|evap/.test(id) || /LTFT|ltft|STFT|stft/.test(c)) return 'Топливо'
  if (/coolant|thermostat|radiator|fan|overheat|water_pump|cold_engine|ac_compressor/.test(id) || /coolant|TEMP/.test(c)) return 'Охлаждение'
  if (/noise|rattle|squeal|whistle|rumble|click|grinding|belt_|brake_squeal|intake_noise|valve_train|wind_noise|audio/.test(id) || /spectral|freq|dominant_amp/.test(c)) return 'Шумы'
  if (/trans|clutch|gear|shift|drivetrain|cv_joint|axle/.test(id)) return 'Трансмиссия'
  return 'Общее'
}

export function RulesList() {
  const [data, setData] = useState<DiagData | null>(null)
  const [tab, setTab] = useState<'articles' | 'rules'>('articles')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/diagnostic-rules.json`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <GlassPanel>
      <div className="hud-header mb-3">Правила диагностики</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {([
          { key: 'articles' as const, label: `Руководства (${data.articles.length})`, icon: '\u{1F4D6}' },
          { key: 'rules' as const, label: `Правила (${data.rules.length})`, icon: '\u2699' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: tab === t.key ? '#0C1220' : theme.accent.cyan,
              background: tab === t.key ? theme.accent.cyan : 'rgba(0,229,255,0.06)',
              border: `1px solid ${tab === t.key ? 'transparent' : 'rgba(0,229,255,0.2)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tab === 'articles' && data.articles.map(a => (
          <div
            key={a.id}
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            style={{
              padding: '10px 12px',
              borderRadius: 4,
              background: expanded === a.id ? 'rgba(0,229,255,0.05)' : 'rgba(0,229,255,0.02)',
              border: `1px solid ${expanded === a.id ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.06)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: theme.text.secondary,
            }}>
              {a.title}
            </div>
            {expanded === a.id && (
              <div style={{
                marginTop: 8,
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 12,
                color: theme.text.muted,
                lineHeight: 1.6,
                borderTop: '1px solid rgba(0,229,255,0.08)',
                paddingTop: 8,
              }}>
                {a.qa}
              </div>
            )}
          </div>
        ))}

        {tab === 'rules' && (() => {
          // Group rules by system
          const groups: Record<string, Rule[]> = {}
          for (const r of data.rules) {
            const sys = classifySystem(r)
            if (!groups[sys]) groups[sys] = []
            groups[sys].push(r)
          }
          // Sort groups by size descending
          const sortedGroups = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)

          return sortedGroups.map(([system, rules]) => (
            <div key={system}>
              {/* System header */}
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: theme.accent.teal,
                padding: '8px 0 4px',
                borderBottom: `1px solid rgba(100,255,218,0.1)`,
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>{system.toUpperCase()}</span>
                <span style={{ color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 'normal' }}>
                  {rules.length} правил
                </span>
              </div>

              {/* Rules in this group */}
              {rules.map(r => {
                const tier = TIER_COLORS[r.tier] || TIER_COLORS.T3
                const isExp = expanded === r.id
                const { human, formula } = humanizeCondition(r.conditions)
                return (
                  <div
                    key={r.id}
                    onClick={() => setExpanded(isExp ? null : r.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 4,
                      background: isExp ? 'rgba(0,229,255,0.05)' : 'rgba(0,229,255,0.02)',
                      border: `1px solid ${isExp ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.06)'}`,
                      borderLeft: `3px solid ${tier.color}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          color: theme.text.secondary,
                        }}>
                          {r.title}
                        </div>
                        {/* Human-readable summary always visible */}
                        <div style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: 11,
                          color: theme.text.muted,
                          marginTop: 2,
                        }}>
                          {human}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9,
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        color: tier.color,
                        padding: '2px 6px',
                        borderRadius: 2,
                        background: `${tier.color}10`,
                        border: `1px solid ${tier.color}20`,
                        whiteSpace: 'nowrap',
                      }}>
                        {tier.label}
                      </span>
                    </div>
                    {isExp && (
                      <div style={{ marginTop: 8, borderTop: '1px solid rgba(0,229,255,0.08)', paddingTop: 8 }}>
                        {/* Technical formula */}
                        <div style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 10,
                          color: theme.accent.cyan,
                          marginBottom: 6,
                          padding: '4px 8px',
                          background: 'rgba(0,229,255,0.04)',
                          borderRadius: 3,
                          border: '1px solid rgba(0,229,255,0.08)',
                        }}>
                          <span style={{ color: theme.text.muted, fontSize: 9 }}>Формула: </span>
                          {formula}
                        </div>
                        {r.dtc.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: theme.text.muted }}>DTC:</span>
                            {r.dtc.map(code => (
                              <span key={code} style={{
                                fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 700,
                                color: theme.status.warning, padding: '2px 6px', borderRadius: 2,
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
          ))
        })()}
      </div>
    </GlassPanel>
  )
}
