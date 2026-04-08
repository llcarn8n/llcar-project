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

        {tab === 'rules' && data.rules.map(r => {
          const tier = TIER_COLORS[r.tier] || TIER_COLORS.T3
          return (
            <div
              key={r.id}
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 4,
                background: 'rgba(0,229,255,0.02)',
                border: `1px solid rgba(0,229,255,0.06)`,
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
                }}>
                  {r.tier}
                </span>
              </div>
              {expanded === r.id && (
                <div style={{ marginTop: 8, borderTop: '1px solid rgba(0,229,255,0.08)', paddingTop: 8 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: theme.accent.cyan, marginBottom: 6 }}>
                    {r.conditions}
                  </div>
                  {r.dtc.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
    </GlassPanel>
  )
}
