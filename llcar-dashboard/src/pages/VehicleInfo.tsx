import { useState, useEffect } from 'react'
import { GlassPanel } from '../components/shared/GlassPanel'
import { SpecCards } from '../components/vehicle/SpecCards'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'

interface Generation {
  id: string
  name: string
  ys: number
  ye: number
  body_type?: string
  dimensions?: Record<string, number>
  trims?: any[]
}

interface Model {
  id: string
  name: string
  body_type?: string
  powertrain?: string
  generations: Generation[]
}

interface BrandData {
  id: string
  name: string
  name_ru: string
  country: string
  models: Model[]
}

// --- KB types ---
interface KBMeta {
  generation_id: string
  generation_name: string
  year_start: number
  year_end: number | null
  body_type: string
  dimensions: Record<string, number>
  engines_summary: string[]
  transmissions_summary: string[]
  drivetrains_summary: string[]
  trims_count: number
}

interface KBSituation {
  id: string
  title: string
  urgency: number
  severity?: string
  category: string
  quickAnswer: string
}

interface KBVideo {
  title: string
  url: string
  duration?: string
  channel?: string
}

interface KBReview {
  title: string
  source?: string
  quotes?: string[]
}

/**
 * Derive KB generation folder path from generation name.
 * generationName example: "K5 I 2020-2024" → "k5/k5_i_2020"
 * generationName example: "Rio III 2023-н.в." → "rio/rio_iii_2023"
 */
import { deriveKBGenPath } from '../utils/kbPath'
import { ICONS } from '../utils/icons'

export function VehicleInfo() {
  const { vehicleProfile, mode } = useDashboardStore()
  const [brandData, setBrandData] = useState<BrandData | null>(null)
  const [modelDesc, setModelDesc] = useState<string | null>(null)
  const [videoTitles, setVideoTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // KB generation-level data
  const [kbMeta, setKbMeta] = useState<KBMeta | null>(null)
  const [kbSituations, setKbSituations] = useState<KBSituation[]>([])
  const [kbVideos, setKbVideos] = useState<KBVideo[]>([])
  const [kbReviews, setKbReviews] = useState<KBReview[]>([])
  const [kbLoading, setKbLoading] = useState(false)

  // Load brand data + model description + videos
  useEffect(() => {
    if (!vehicleProfile) return
    const brandId = vehicleProfile.brandId || vehicleProfile.brand.toLowerCase().replace(/\s+/g, '_')
    const modelId = vehicleProfile.model.toLowerCase().replace(/\s+/g, '_')
    setLoading(true)

    const loadSpecs = fetch(`${import.meta.env.BASE_URL}data/brands/${brandId}.json`)
      .then(r => r.ok ? r.json() : null)

    const loadDesc = fetch(`${import.meta.env.BASE_URL}data/brands-info/${brandId}.json`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)

    const loadVideos = fetch(`${import.meta.env.BASE_URL}data/videos/${brandId}_${modelId}.json`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)

    Promise.all([loadSpecs, loadDesc, loadVideos]).then(([specs, descs, vids]) => {
      setBrandData(specs)
      if (descs) {
        const info = descs[modelId]
        setModelDesc(info?.desc || null)
      }
      if (vids?.titles) setVideoTitles(vids.titles.slice(0, 10))
      setLoading(false)
    })
  }, [vehicleProfile])

  // Find matching model and generation
  const model = brandData?.models.find(m =>
    m.name.toLowerCase() === vehicleProfile?.model.toLowerCase()
  )
  const generation = model?.generations.find(g =>
    (vehicleProfile?.generationId && g.id === vehicleProfile.generationId) ||
    g.ys === vehicleProfile?.year
  ) || model?.generations[0]

  // Load KB generation-level data when generation name is available
  useEffect(() => {
    if (!vehicleProfile || !generation?.name) {
      setKbMeta(null)
      setKbSituations([])
      setKbVideos([])
      setKbReviews([])
      return
    }
    const brandId = vehicleProfile.brandId || vehicleProfile.brand.toLowerCase().replace(/\s+/g, '_')
    const kbPath = deriveKBGenPath(brandId, generation.name)
    if (!kbPath) return

    setKbLoading(true)
    const base = `${import.meta.env.BASE_URL}data/kb/${kbPath}`

    const loadMeta = fetch(`${base}/meta.json`)
      .then(r => r.ok ? r.json() : null).catch(() => null)
    const loadSit = fetch(`${base}/situations.json`)
      .then(r => r.ok ? r.json() : null).catch(() => null)
    const loadVid = fetch(`${base}/videos.json`)
      .then(r => r.ok ? r.json() : null).catch(() => null)
    const loadRev = fetch(`${base}/reviews.json`)
      .then(r => r.ok ? r.json() : null).catch(() => null)

    Promise.all([loadMeta, loadSit, loadVid, loadRev]).then(([meta, sits, vids, revs]) => {
      setKbMeta(meta || null)
      if (Array.isArray(sits)) {
        // Sort by urgency descending, take top 5
        const sorted = [...sits].sort((a, b) => (b.urgency || 0) - (a.urgency || 0))
        setKbSituations(sorted.slice(0, 5))
      } else {
        setKbSituations([])
      }
      setKbVideos(Array.isArray(vids) ? vids.slice(0, 6) : [])
      // Reviews: skip first item if it's a header chunk
      if (Array.isArray(revs)) {
        const filtered = revs.filter((r: KBReview) => r.source && r.quotes && r.quotes.length > 0)
        setKbReviews(filtered.slice(0, 2))
      } else {
        setKbReviews([])
      }
      setKbLoading(false)
    })
  }, [vehicleProfile, generation?.name])

  // General mode — no vehicle selected
  if (mode === 'general' && !vehicleProfile) {
    return (
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-4">Об автомобиле</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: '32px 24px',
            }}>
              <img src={ICONS.spaceRover} alt="" style={{ width: 64, height: 64, objectFit: 'contain', filter: 'drop-shadow(0 2px 10px rgba(0,229,255,0.3))' }} />
              <div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.text.secondary,
                  marginBottom: 8,
                }}>
                  Выберите автомобиль для просмотра характеристик
                </div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 13,
                  color: theme.text.muted,
                  lineHeight: 1.5,
                }}>
                  В нашей базе 58 марок, 999 моделей и 1919 поколений с полными техническими характеристиками.
                  Нажмите на своё авто в хедере или перейдите на главную.
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    )
  }

  const title = vehicleProfile
    ? `${vehicleProfile.brand} ${vehicleProfile.model}`
    : 'Об автомобиле'

  const subtitle = generation?.name || (vehicleProfile ? `${vehicleProfile.year}` : '')

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Hero header */}
      <div className="col-span-12">
        <GlassPanel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${theme.accent.cyan}15, ${theme.accent.teal}10)`,
              border: `1px solid ${theme.accent.cyan}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              flexShrink: 0,
            }}>
              &#x1F697;
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: theme.text.primary,
                margin: 0,
                textShadow: `0 0 16px ${theme.accent.cyan}30`,
              }}>
                {title}
              </h1>
              {subtitle && (
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.accent.teal,
                  marginTop: 4,
                  letterSpacing: '0.05em',
                }}>
                  {subtitle}
                </div>
              )}
              {brandData && (
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 11,
                  color: theme.text.muted,
                  marginTop: 2,
                  letterSpacing: '0.05em',
                }}>
                  {brandData.name_ru} &bull; {brandData.country} &bull; {vehicleProfile?.engine === 'gasoline' ? 'Бензин' : vehicleProfile?.engine === 'diesel' ? 'Дизель' : vehicleProfile?.engine === 'hybrid' ? 'Гибрид' : vehicleProfile?.engine === 'electric' ? 'Электро' : vehicleProfile?.engine}
                </div>
              )}
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Model description / reputation */}
      {modelDesc && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">Народная репутация</div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: theme.text.secondary,
              lineHeight: 1.7,
              padding: '4px 0',
            }}>
              {modelDesc}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Video topics */}
      {videoTitles.length > 0 && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">Видео по модели</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {videoTitles.map((t, i) => (
                <div key={i} style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  background: 'rgba(0,229,255,0.03)',
                  border: '1px solid rgba(0,229,255,0.1)',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.text.secondary,
                }}>
                  &#x1F3AC; {t}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Specs */}
      <div className="col-span-12">
        {loading ? (
          <GlassPanel>
            <div style={{
              textAlign: 'center',
              padding: 32,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 12,
              color: theme.accent.cyan,
              letterSpacing: '0.15em',
            }}>
              LOADING...
            </div>
          </GlassPanel>
        ) : generation ? (
          <SpecCards
            dimensions={generation.dimensions}
            trims={generation.trims}
            generationName={generation.name}
          />
        ) : (
          <GlassPanel>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '24px 16px',
            }}>
              <img src={ICONS.spaceRover} alt="" style={{ width: 64, height: 64, objectFit: 'contain', filter: 'drop-shadow(0 2px 10px rgba(0,229,255,0.3))' }} />
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 14,
                color: theme.text.muted,
                lineHeight: 1.5,
              }}>
                Спецификации для этого поколения пока не загружены.
                <br />
                Данные пополняются — скоро здесь появятся полные ТТХ.
              </div>
            </div>
          </GlassPanel>
        )}
      </div>

      {/* ─── KB Generation Data ─── */}
      {kbLoading && (
        <div className="col-span-12">
          <GlassPanel>
            <div style={{
              textAlign: 'center',
              padding: 24,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 11,
              color: theme.accent.cyan,
              letterSpacing: '0.15em',
            }}>
              ЗАГРУЗКА БАЗЫ ЗНАНИЙ...
            </div>
          </GlassPanel>
        </div>
      )}

      {/* KB Meta — enriched generation info */}
      {kbMeta && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">База знаний поколения</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Generation period + body */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'rgba(0,229,255,0.06)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.accent.cyan,
                }}>
                  {kbMeta.year_start}–{kbMeta.year_end || 'н.в.'}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'rgba(0,229,255,0.06)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.text.secondary,
                }}>
                  {kbMeta.body_type}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'rgba(0,229,255,0.06)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.text.secondary,
                }}>
                  {kbMeta.trims_count} комплектаций
                </span>
              </div>
              {/* Engines */}
              <div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: theme.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 4,
                }}>
                  Двигатели
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {kbMeta.engines_summary.map((eng, i) => (
                    <span key={i} style={{
                      padding: '3px 8px',
                      borderRadius: 3,
                      background: 'rgba(0,229,255,0.03)',
                      border: '1px solid rgba(0,229,255,0.08)',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme.text.secondary,
                    }}>
                      {eng}
                    </span>
                  ))}
                </div>
              </div>
              {/* Transmissions + drivetrains */}
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: theme.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 4,
                  }}>
                    КПП
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {kbMeta.transmissions_summary.map((t, i) => (
                      <span key={i} style={{
                        padding: '3px 8px',
                        borderRadius: 3,
                        background: 'rgba(0,229,255,0.03)',
                        border: '1px solid rgba(0,229,255,0.08)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: theme.text.secondary,
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: theme.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 4,
                  }}>
                    Привод
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {kbMeta.drivetrains_summary.map((d, i) => (
                      <span key={i} style={{
                        padding: '3px 8px',
                        borderRadius: 3,
                        background: 'rgba(0,229,255,0.03)',
                        border: '1px solid rgba(0,229,255,0.08)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: theme.text.secondary,
                      }}>
                        {d.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* KB Situations — top 5 by urgency */}
      {kbSituations.length > 0 && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">Типичные проблемы</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {kbSituations.map((sit) => (
                <div key={sit.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(0,229,255,0.02)',
                  border: '1px solid rgba(0,229,255,0.08)',
                }}>
                  {/* Urgency badge */}
                  <span style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    background: sit.urgency >= 4
                      ? 'rgba(255,140,0,0.15)'
                      : sit.urgency >= 2
                        ? 'rgba(0,229,255,0.1)'
                        : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${sit.urgency >= 4 ? theme.accent.orange : theme.accent.cyan}30`,
                    color: sit.urgency >= 4 ? theme.accent.orange : theme.accent.cyan,
                  }}>
                    {sit.urgency}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: theme.text.primary,
                      marginBottom: 2,
                    }}>
                      {sit.title}
                    </div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 11,
                      fontWeight: 500,
                      color: theme.text.muted,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {sit.quickAnswer}
                    </div>
                  </div>
                  {/* Category */}
                  <span style={{
                    flexShrink: 0,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: 'rgba(0,229,255,0.05)',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: theme.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {sit.category}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* KB Videos */}
      {kbVideos.length > 0 && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">Видео из базы знаний</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {kbVideos.map((vid, i) => (
                <a
                  key={i}
                  href={vid.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(0,229,255,0.02)',
                    border: '1px solid rgba(0,229,255,0.08)',
                    textDecoration: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.08)')}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>&#x25B6;</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.accent.cyan,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {vid.title}
                    </div>
                    {(vid.channel || vid.duration) && (
                      <div style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 11,
                        color: theme.text.muted,
                        marginTop: 1,
                      }}>
                        {vid.channel}{vid.channel && vid.duration ? ' · ' : ''}{vid.duration}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* KB Reviews */}
      {kbReviews.length > 0 && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">Отзывы владельцев</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {kbReviews.map((rev, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: 'rgba(0,229,255,0.02)',
                  border: '1px solid rgba(0,229,255,0.08)',
                }}>
                  {rev.source && (
                    <a
                      href={rev.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: theme.accent.cyan,
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      {rev.title}
                    </a>
                  )}
                  {rev.quotes && rev.quotes.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                    }}>
                      {rev.quotes.slice(0, 5).map((q, qi) => (
                        <span key={qi} style={{
                          padding: '3px 8px',
                          borderRadius: 3,
                          background: 'rgba(255,140,0,0.05)',
                          border: '1px solid rgba(255,140,0,0.1)',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: 11,
                          fontWeight: 500,
                          color: theme.text.secondary,
                          fontStyle: 'italic',
                        }}>
                          &laquo;{q}&raquo;
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  )
}
