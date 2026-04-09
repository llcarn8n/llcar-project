import { useState, useEffect, useMemo } from 'react'
import { SituationsList } from '../components/kb/SituationsList'
import { ManualViewer } from '../components/kb/ManualViewer'
import { GlassPanel } from '../components/shared/GlassPanel'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'
import { ICONS } from '../utils/icons'
import { deriveKBGenPath } from '../utils/kbPath'

interface KbVideo {
  title: string
  url: string
  duration?: string
  channel?: string
}

interface KbReview {
  title: string
  source?: string
  quotes?: string[]
}

export function KnowledgeBase() {
  const { vehicleProfile } = useDashboardStore()
  const [genName, setGenName] = useState<string | null>(null)
  const [videos, setVideos] = useState<KbVideo[]>([])
  const [reviews, setReviews] = useState<KbReview[]>([])

  // Derive generation name from brands data
  useEffect(() => {
    if (!vehicleProfile?.brandId || !vehicleProfile?.generationId) {
      setGenName(null)
      return
    }
    fetch(`${import.meta.env.BASE_URL}data/brands/${vehicleProfile.brandId}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const model = data.models?.find((m: any) =>
          m.name.toLowerCase() === vehicleProfile.model.toLowerCase()
        )
        const gen = model?.generations?.find((g: any) =>
          g.id === vehicleProfile.generationId
        )
        setGenName(gen?.name || null)
      })
      .catch(() => setGenName(null))
  }, [vehicleProfile?.brandId, vehicleProfile?.generationId, vehicleProfile?.model])

  // Compute KB generation path
  const kbGenPath = useMemo(() => {
    if (!vehicleProfile?.brandId || !genName) return null
    return deriveKBGenPath(vehicleProfile.brandId, genName)
  }, [vehicleProfile?.brandId, genName])

  // Load videos.json for this generation
  useEffect(() => {
    if (!kbGenPath) { setVideos([]); return }
    fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/videos.json`)
      .then(r => r.ok ? r.json() : [])
      .then((data: KbVideo[]) => {
        if (!Array.isArray(data)) { setVideos([]); return }
        // Deduplicate by URL and filter irrelevant videos
        const seen = new Set<string>()
        const filtered = data.filter(v => {
          if (!v.url || seen.has(v.url)) return false
          seen.add(v.url)
          // Filter out obviously irrelevant videos (not about cars)
          const t = (v.title || '').toLowerCase()
          if (t.includes('ванн') || t.includes('кухн') || t.includes('деревн') || t.includes('ремонт квартир')) return false
          return true
        })
        setVideos(filtered)
      })
      .catch(() => setVideos([]))
  }, [kbGenPath])

  // Load reviews.json for this generation
  useEffect(() => {
    if (!kbGenPath) { setReviews([]); return }
    fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/reviews.json`)
      .then(r => r.ok ? r.json() : [])
      .then((data: KbReview[]) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
  }, [kbGenPath])

  /** Detect video source from URL */
  function videoSourceBadge(url: string): { label: string; color: string } {
    if (url.includes('rutube.ru')) return { label: 'RuTube', color: '#00C8AA' }
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', color: '#FF0000' }
    return { label: 'Видео', color: theme.accent.cyan }
  }

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Header */}
      <div className="col-span-12">
        <GlassPanel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={ICONS.knowledgeBase} alt="" style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 2px 10px rgba(0,229,255,0.3))' }} />
            <div>
              <div className="hud-header" style={{ marginBottom: 4 }}>База знаний</div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 13,
                color: theme.text.muted,
                lineHeight: 1.4,
              }}>
                {vehicleProfile
                  ? <>
                      {vehicleProfile.brand} {vehicleProfile.model}
                      {genName && <span style={{ color: theme.accent.teal }}> &mdash; {genName}</span>}
                      {' '}&mdash; универсальные и модельные ситуации
                    </>
                  : '764 универсальных ситуации для всех марок и моделей'}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Situations */}
      <div className="col-span-12 lg:col-span-8">
        <SituationsList brandId={vehicleProfile?.brandId} kbGenPath={kbGenPath} />
      </div>

      {/* Right sidebar: manuals + videos + reviews + parts + stats */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
        {/* Manuals viewer */}
        <ManualViewer
          brandId={vehicleProfile?.brandId || null}
          modelName={vehicleProfile?.model || null}
          kbGenPath={kbGenPath || undefined}
        />

        {/* Videos section — generation KB */}
        {videos.length > 0 && (
          <GlassPanel>
            <div className="hud-header mb-3">Видео</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {videos.map((v, i) => {
                const source = videoSourceBadge(v.url)
                return (
                  <a
                    key={i}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 4,
                      background: 'rgba(0,229,255,0.02)',
                      border: '1px solid rgba(0,229,255,0.06)',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.06)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.15)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.02)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.06)'
                    }}
                  >
                    {/* Play icon */}
                    <span style={{
                      fontSize: 18,
                      flexShrink: 0,
                      opacity: 0.6,
                    }}>
                      &#9654;
                    </span>

                    {/* Title + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: theme.text.secondary,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {v.title}
                      </div>
                      {(v.channel || v.duration) && (
                        <div style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: 10,
                          color: theme.text.muted,
                          marginTop: 2,
                        }}>
                          {v.channel}{v.channel && v.duration && ' \u2022 '}{v.duration}
                        </div>
                      )}
                    </div>

                    {/* Source badge */}
                    <span style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: 8,
                      fontWeight: 700,
                      color: source.color,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: `${source.color}12`,
                      border: `1px solid ${source.color}30`,
                      letterSpacing: '0.06em',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}>
                      {source.label}
                    </span>
                  </a>
                )
              })}
            </div>
          </GlassPanel>
        )}

        {/* Reviews section — generation KB */}
        {reviews.length > 0 && (
          <GlassPanel>
            <div className="hud-header mb-3">Отзывы</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviews.filter(r => r.title && !r.title.startsWith('#') && !r.title.startsWith('Chunks:')).slice(0, 3).map((r, i) => (
                <div key={i} style={{
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: 'rgba(0,229,255,0.02)',
                  border: '1px solid rgba(0,229,255,0.06)',
                }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: theme.text.secondary,
                    lineHeight: 1.3,
                    marginBottom: 6,
                  }}>
                    {r.title}
                  </div>

                  {r.quotes && r.quotes.length > 0 && (
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 11,
                      color: theme.text.muted,
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                      borderLeft: `2px solid ${theme.accent.teal}`,
                      paddingLeft: 8,
                      marginBottom: 6,
                    }}>
                      &laquo;{r.quotes.slice(0, 2).join('; ')}&raquo;
                    </div>
                  )}

                  {r.source && (
                    <a
                      href={r.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 8,
                        fontWeight: 700,
                        color: theme.accent.cyan,
                        textDecoration: 'none',
                        letterSpacing: '0.06em',
                        opacity: 0.7,
                      }}
                    >
                      ИСТОЧНИК &#8599;
                    </a>
                  )}
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Parts stub */}
        <GlassPanel>
          <div className="hud-header mb-3">Запчасти</div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 8px',
          }}>
            <span style={{ fontSize: 32, opacity: 0.3 }}>&#x1F527;</span>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              color: theme.text.muted,
              lineHeight: 1.4,
            }}>
              Каталог запчастей с иерархией по системам.
              <br />
              Раздел в разработке.
            </div>
          </div>
        </GlassPanel>

        {/* Stats */}
        <GlassPanel>
          <div className="hud-header mb-3">Статистика KB</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Универсальных ситуаций', value: '764' },
              { label: 'Полных мануалов', value: '333' },
              { label: 'Брендов с ситуациями', value: '58' },
              { label: 'Отзывных кампаний', value: '298' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid rgba(0,229,255,0.05)',
              }}>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: theme.text.muted }}>{label}</span>
                <span style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: theme.accent.cyan,
                  textShadow: `0 0 8px ${theme.accent.cyan}30`,
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
