import { useState, useEffect } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface Topic {
  id: string
  title: { ru: string; en?: string }
  words?: number
  images?: number
  content?: { ru?: string }
}

interface Section {
  id: string
  title: { ru: string; en?: string }
  icon: string
  topics: Topic[]
}

interface Manual {
  model: string
  label: { ru: string }
  sections: Section[]
}

interface ManualData {
  model: string
  manuals: Manual[]
}

interface ManualViewerProps {
  brandId: string | null
  modelName: string | null
}

export function ManualViewer({ brandId, modelName }: ManualViewerProps) {
  const [data, setData] = useState<ManualData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)

  useEffect(() => {
    if (!brandId || !modelName) return
    const modelId = modelName.toLowerCase().replace(/\s+/g, '_')
    setLoading(true)
    fetch(`${import.meta.env.BASE_URL}data/manuals/${brandId}_${modelId}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData(null); setLoading(false) })
  }, [brandId, modelName])

  if (loading) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">Руководство</div>
        <div style={{ textAlign: 'center', padding: 24, fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: theme.accent.cyan, letterSpacing: '0.15em' }}>
          LOADING MANUAL...
        </div>
      </GlassPanel>
    )
  }

  if (!data || !data.manuals || data.manuals.length === 0) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">Руководства</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 8px' }}>
          <span style={{ fontSize: 32, opacity: 0.3 }}>&#x1F4D6;</span>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: theme.text.muted, lineHeight: 1.4 }}>
            {brandId && modelName
              ? `Мануал для ${modelName} загружается — скоро будет доступен.`
              : '333 полных мануала в базе — выберите авто.'}
          </div>
        </div>
      </GlassPanel>
    )
  }

  const manual = data.manuals[0]

  return (
    <GlassPanel>
      <div className="hud-header mb-3">{manual.label.ru || 'Руководство'}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '60vh', overflowY: 'auto' }}>
        {manual.sections.map(section => {
          const isExpanded = expandedSection === section.id
          const topicCount = section.topics.length

          return (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: isExpanded ? 'rgba(0,229,255,0.06)' : 'rgba(0,229,255,0.02)',
                  border: `1px solid ${isExpanded ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.06)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}>
                <span style={{ fontSize: 18 }}>{section.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, color: theme.text.secondary }}>
                    {section.title.ru}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: theme.text.muted }}>
                    {topicCount} тем
                  </div>
                </div>
                <span style={{
                  fontSize: 10, color: theme.accent.cyan, transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>&#x25B6;</span>
              </button>

              {/* Topics */}
              {isExpanded && (
                <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4, marginBottom: 8 }}>
                  {section.topics.map(topic => {
                    const isTopicExpanded = expandedTopic === topic.id
                    return (
                      <div key={topic.id}>
                        <button
                          onClick={() => setExpandedTopic(isTopicExpanded ? null : topic.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 3,
                            background: isTopicExpanded ? 'rgba(0,229,255,0.04)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.2s',
                          }}>
                          <span style={{
                            width: 4, height: 4, borderRadius: '50%',
                            background: isTopicExpanded ? theme.accent.cyan : 'rgba(0,229,255,0.3)',
                            flexShrink: 0,
                            boxShadow: isTopicExpanded ? `0 0 6px ${theme.accent.cyan}` : 'none',
                          }} />
                          <span style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontSize: 12,
                            fontWeight: 500,
                            color: isTopicExpanded ? theme.text.primary : theme.text.secondary,
                            flex: 1,
                          }}>
                            {topic.title.ru || topic.title.en}
                          </span>
                          {topic.words && (
                            <span style={{ fontFamily: 'monospace', fontSize: 9, color: theme.text.muted }}>
                              {topic.words}w
                            </span>
                          )}
                        </button>

                        {isTopicExpanded && topic.content?.ru && (
                          <div style={{
                            marginLeft: 22,
                            padding: '8px 12px',
                            borderLeft: '2px solid rgba(0,229,255,0.15)',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontSize: 12,
                            color: theme.text.muted,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                          }}>
                            {topic.content.ru}
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
