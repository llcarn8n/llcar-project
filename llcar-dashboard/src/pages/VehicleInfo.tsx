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

import { ICONS } from '../utils/icons'

export function VehicleInfo() {
  const { vehicleProfile, mode } = useDashboardStore()
  const [brandData, setBrandData] = useState<BrandData | null>(null)
  const [modelDesc, setModelDesc] = useState<string | null>(null)
  const [videoTitles, setVideoTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

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
    </div>
  )
}
