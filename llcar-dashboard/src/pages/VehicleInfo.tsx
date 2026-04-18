import { useState, useEffect } from 'react'
import { GlassPanel } from '../components/shared/GlassPanel'
import { SpecCards } from '../components/vehicle/SpecCards'
import { useDashboardStore } from '../stores/dashboardStore'

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
    const rawBrandId = vehicleProfile.brandId || vehicleProfile.brand.toLowerCase().replace(/\s+/g, '_')
    // Map alternative brand-ids to actual filenames in public/data/brands/
    const BRAND_FILE_ALIAS: Record<string, string> = {
      'li-auto': 'li', 'li_auto': 'li',
      'mercedes-benz': 'mercedes', 'mercedes_benz': 'mercedes',
      'faw-bestune': 'bestune', 'faw_bestune': 'bestune',
      'land-rover': 'land_rover',
    }
    const brandId = BRAND_FILE_ALIAS[rawBrandId] || rawBrandId
    const modelId = vehicleProfile.model.toLowerCase().replace(/\s+/g, '_')
    setLoading(true)

    const loadSpecs = fetch(`${import.meta.env.BASE_URL}data/brands/${brandId}.json`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)

    const loadDesc = fetch(`${import.meta.env.BASE_URL}data/brands-info/${brandId}.json`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)

    const loadVideos = fetch(`${import.meta.env.BASE_URL}data/videos/${brandId}_${modelId}.json`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)

    Promise.all([loadSpecs, loadDesc, loadVideos])
      .then(([specs, descs, vids]) => {
        setBrandData(specs)
        if (descs) {
          const info = descs[modelId]
          setModelDesc(info?.desc || null)
        }
        if (vids?.titles) setVideoTitles(vids.titles.slice(0, 10))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
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
    const rawBrandId = vehicleProfile.brandId || vehicleProfile.brand.toLowerCase().replace(/\s+/g, '_')
    // Map alternative brand-ids to actual filenames in public/data/brands/
    const BRAND_FILE_ALIAS: Record<string, string> = {
      'li-auto': 'li', 'li_auto': 'li',
      'mercedes-benz': 'mercedes', 'mercedes_benz': 'mercedes',
      'faw-bestune': 'bestune', 'faw_bestune': 'bestune',
      'land-rover': 'land_rover',
    }
    const brandId = BRAND_FILE_ALIAS[rawBrandId] || rawBrandId
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
              <img src={ICONS.spaceRover} alt="" style={{ width: 64, height: 64, objectFit: 'contain', filter: 'drop-shadow(0 2px 10px var(--c-champagne-border))' }} />
              <div>
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--c-graphite)',
                  marginBottom: 8,
                }}>
                  Выберите автомобиль для просмотра характеристик
                </div>
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize: 13,
                  color: 'var(--c-graphite-muted)',
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
              background: 'linear-gradient(135deg, var(--c-champagne-soft), var(--c-champagne-faint))',
              border: '1px solid var(--c-champagne-border)',
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
                fontFamily: 'var(--f-display)',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--c-graphite)',
                margin: 0,
                textShadow: '0 0 16px var(--c-cherry-glow)',
              }}>
                {title}
              </h1>
              {subtitle && (
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--c-champagne-hi)',
                  marginTop: 4,
                  letterSpacing: '0.05em',
                }}>
                  {subtitle}
                </div>
              )}
              {brandData && (
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize: 11,
                  color: 'var(--c-graphite-muted)',
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
              fontFamily: 'var(--f-body)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--c-graphite)',
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
                  background: 'var(--c-champagne-faint)',
                  border: '1px solid var(--c-champagne-border)',
                  fontFamily: 'var(--f-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--c-graphite)',
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
              fontFamily: 'var(--f-display)',
              fontSize: 12,
              color: 'var(--c-champagne)',
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
              <img src={ICONS.spaceRover} alt="" style={{ width: 64, height: 64, objectFit: 'contain', filter: 'drop-shadow(0 2px 10px var(--c-champagne-border))' }} />
              <div style={{
                fontFamily: 'var(--f-body)',
                fontSize: 14,
                color: 'var(--c-graphite-muted)',
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
              fontFamily: 'var(--f-display)',
              fontSize: 11,
              color: 'var(--c-champagne)',
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
                  background: 'var(--c-champagne-soft)',
                  border: '1px solid var(--c-champagne-border)',
                  fontFamily: 'var(--f-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--c-champagne)',
                }}>
                  {kbMeta.year_start}–{kbMeta.year_end || 'н.в.'}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'var(--c-champagne-soft)',
                  border: '1px solid var(--c-champagne-border)',
                  fontFamily: 'var(--f-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--c-graphite)',
                }}>
                  {kbMeta.body_type}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'var(--c-champagne-soft)',
                  border: '1px solid var(--c-champagne-border)',
                  fontFamily: 'var(--f-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--c-graphite)',
                }}>
                  {kbMeta.trims_count} комплектаций
                </span>
              </div>
              {/* Engines */}
              <div>
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--c-graphite-muted)',
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
                      background: 'var(--c-champagne-faint)',
                      border: '1px solid var(--c-champagne-border)',
                      fontFamily: 'var(--f-body)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--c-graphite)',
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
                    fontFamily: 'var(--f-body)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--c-graphite-muted)',
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
                        background: 'var(--c-champagne-faint)',
                        border: '1px solid var(--c-champagne-border)',
                        fontFamily: 'var(--f-body)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--c-graphite)',
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--f-body)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--c-graphite-muted)',
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
                        background: 'var(--c-champagne-faint)',
                        border: '1px solid var(--c-champagne-border)',
                        fontFamily: 'var(--f-body)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--c-graphite)',
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
                  background: 'var(--c-champagne-faint)',
                  border: '1px solid var(--c-champagne-border)',
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
                    fontFamily: 'var(--f-display)',
                    fontSize: 11,
                    fontWeight: 700,
                    background: sit.urgency >= 4
                      ? 'var(--c-li7-glow)'
                      : sit.urgency >= 2
                        ? 'var(--c-champagne-soft)'
                        : 'var(--c-champagne-faint)',
                    border: `1px solid ${sit.urgency >= 4 ? 'var(--c-li7)' : 'var(--c-champagne-border)'}`,
                    color: sit.urgency >= 4 ? 'var(--c-li7)' : 'var(--c-champagne)',
                  }}>
                    {sit.urgency}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--f-body)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--c-graphite)',
                      marginBottom: 2,
                    }}>
                      {sit.title}
                    </div>
                    <div style={{
                      fontFamily: 'var(--f-body)',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--c-graphite-muted)',
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
                    background: 'var(--c-champagne-soft)',
                    fontFamily: 'var(--f-body)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--c-graphite-muted)',
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
                    background: 'var(--c-champagne-faint)',
                    border: '1px solid var(--c-champagne-border)',
                    textDecoration: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--c-champagne)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--c-champagne-border)')}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>&#x25B6;</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--f-body)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--c-champagne)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {vid.title}
                    </div>
                    {(vid.channel || vid.duration) && (
                      <div style={{
                        fontFamily: 'var(--f-body)',
                        fontSize: 11,
                        color: 'var(--c-graphite-muted)',
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
                  background: 'var(--c-champagne-faint)',
                  border: '1px solid var(--c-champagne-border)',
                }}>
                  {rev.source && (
                    <a
                      href={rev.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--f-body)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--c-champagne)',
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
                          background: 'var(--c-champagne-faint)',
                          border: '1px solid var(--c-champagne-border)',
                          fontFamily: 'var(--f-body)',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--c-graphite)',
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
