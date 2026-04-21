import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { SituationsList } from '../components/kb/SituationsList'
import { DtcSearch } from '../components/kb/DtcSearch'
import { ManualViewer } from '../components/kb/ManualViewer'
import { GlassPanel } from '../components/shared/GlassPanel'
import { RecallsBrowser } from '../components/panels/RecallsBrowser'

const VehicleInfo = lazy(() => import('./VehicleInfo').then(m => ({ default: m.VehicleInfo })))
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'
import { ICONS } from '../utils/icons'
import { deriveKBGenPath } from '../utils/kbPath'
import { getKBStats } from '../utils/kbStats'

const KB_STATS = getKBStats()

interface DtcSituationRef {
  sit_id: string
  title: string
  brand: string
  model: string
  generation: string
  urg: number
  cat: string
}

interface KbPart {
  name?: string
  article?: string
  articul?: string
  oem_part_number?: string
  price?: number
  price_rub?: number
  category?: string
  system?: string
}

interface KbPartsCatalog {
  brand?: string
  model?: string
  total_parts?: number
  parts_capped?: boolean
  parts?: KbPart[]
  systems?: Record<string, string>
}

interface KbManualMeta {
  brand?: string
  model?: string
  source_path_rel?: string
  manual_md_size?: number
  has_dita?: boolean
  has_pdf?: boolean
  variants?: string[]
}

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
  const { vehicleProfile, setVehicleProfile } = useDashboardStore()
  const [genName, setGenName] = useState<string | null>(null)
  const [videos, setVideos] = useState<KbVideo[]>([])
  const [reviews, setReviews] = useState<KbReview[]>([])
  const [leftTab, setLeftTab] = useState<'situations' | 'dtc'>('situations')
  const [pendingExpandId, setPendingExpandId] = useState<string | null>(null)
  const [partsCat, setPartsCat] = useState<KbPartsCatalog | null>(null)
  const [manualMeta, setManualMeta] = useState<KbManualMeta | null>(null)
  const [vehicleInfoOpen, setVehicleInfoOpen] = useState(false)
  const [recallsOpen, setRecallsOpen] = useState(false)
  const [recallsMyCarMode, setRecallsMyCarMode] = useState(false)
  const [situationsOpen, setSituationsOpen] = useState(false)

  const jumpToRecallsForBrand = () => {
    setRecallsOpen(true)
    setRecallsMyCarMode(true)
    // Даём секции раскрыться, затем скроллим к ней.
    setTimeout(() => {
      const el = document.getElementById('kb-recalls-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 180)
  }

  // Derive generation name from brands data
  useEffect(() => {
    if (!vehicleProfile?.brandId || !vehicleProfile?.generationId) {
      setGenName(null)
      return
    }
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/brands/${vehicleProfile.brandId}.json`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (controller.signal.aborted || !data) return
        const model = data.models?.find((m: any) =>
          m.name.toLowerCase() === vehicleProfile.model.toLowerCase()
        )
        const gen = model?.generations?.find((g: any) =>
          g.id === vehicleProfile.generationId
        )
        setGenName(gen?.name || null)
      })
      .catch((e) => {
        if ((e as { name?: string })?.name === 'AbortError') return
        setGenName(null)
      })
    return () => controller.abort()
  }, [vehicleProfile?.brandId, vehicleProfile?.generationId, vehicleProfile?.model])

  // Compute KB generation path
  const kbGenPath = useMemo(() => {
    if (!vehicleProfile?.brandId || !genName) return null
    return deriveKBGenPath(vehicleProfile.brandId, genName)
  }, [vehicleProfile?.brandId, genName])

  // Model-level path (same as gen path but without last segment) — для файлов которые лежат
  // один раз на модель (parts-catalog, reviews, manual_meta, images)
  const kbModelPath = useMemo(() => {
    if (!kbGenPath) return null
    const parts = kbGenPath.split('/')
    if (parts.length < 3) return null
    return parts.slice(0, -1).join('/')
  }, [kbGenPath])

  // Load videos.json for this generation
  useEffect(() => {
    if (!kbGenPath) { setVideos([]); return }
    const ctrl = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/videos.json`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : [])
      .then((data: KbVideo[]) => {
        if (ctrl.signal.aborted) return
        if (!Array.isArray(data)) { setVideos([]); return }
        const seen = new Set<string>()
        const filtered = data.filter(v => {
          if (!v.url || seen.has(v.url)) return false
          seen.add(v.url)
          const t = (v.title || '').toLowerCase()
          if (t.includes('ванн') || t.includes('кухн') || t.includes('деревн') || t.includes('ремонт квартир')) return false
          return true
        })
        setVideos(filtered)
      })
      .catch((e) => {
        if ((e as { name?: string })?.name === 'AbortError') return
        setVideos([])
      })
    return () => ctrl.abort()
  }, [kbGenPath])

  // Load reviews.json at GEN-level (legacy) — new reviews.md at model-level not JSON
  useEffect(() => {
    if (!kbGenPath) { setReviews([]); return }
    const ctrl = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/reviews.json`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : [])
      .then((data: KbReview[]) => {
        if (ctrl.signal.aborted) return
        setReviews(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if ((e as { name?: string })?.name === 'AbortError') return
        setReviews([])
      })
    return () => ctrl.abort()
  }, [kbGenPath])

  // Model-level: parts-catalog.json (one per model, not per gen)
  useEffect(() => {
    if (!kbModelPath) { setPartsCat(null); return }
    const ctrl = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/kb/${kbModelPath}/parts-catalog.json`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then((data: KbPartsCatalog | null) => {
        if (!ctrl.signal.aborted) setPartsCat(data)
      })
      .catch((e) => {
        if ((e as { name?: string })?.name === 'AbortError') return
        setPartsCat(null)
      })
    return () => ctrl.abort()
  }, [kbModelPath])

  // Model-level: manual_meta.json
  useEffect(() => {
    if (!kbModelPath) { setManualMeta(null); return }
    const ctrl = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/kb/${kbModelPath}/manual_meta.json`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then((data: KbManualMeta | null) => {
        if (!ctrl.signal.aborted) setManualMeta(data)
      })
      .catch((e) => {
        if ((e as { name?: string })?.name === 'AbortError') return
        setManualMeta(null)
      })
    return () => ctrl.abort()
  }, [kbModelPath])

  async function handleDtcSelect(ref: DtcSituationRef) {
    const brandId = ref.brand.toLowerCase().replace(/[\s-]+/g, '_')
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}data/brands/${brandId}.json`)
      if (r.ok) {
        const data = await r.json()
        const model = data.models?.find((m: any) =>
          m.name.toLowerCase() === ref.model.toLowerCase() ||
          m.name.toLowerCase().includes(ref.model.toLowerCase()) ||
          ref.model.toLowerCase().includes(m.name.toLowerCase())
        )
        const gen = model?.generations?.find((g: any) =>
          g.name === ref.generation ||
          g.name.toLowerCase().includes(ref.generation.toLowerCase()) ||
          ref.generation.toLowerCase().includes(g.name.toLowerCase())
        )
        if (model && gen) {
          setVehicleProfile({
            brand: data.name ?? ref.brand,
            brandId: data.id ?? brandId,
            model: model.name,
            generationId: gen.id,
            year: gen.ys ?? 0,
            engine: '',
          })
        }
      }
    } catch {
      // edge case: brand/model lookup failed — still highlight in current list
    }
    setPendingExpandId(ref.sit_id)
    setLeftTab('situations')
  }

  // Reset pending expand after the switch animation so repeated clicks work
  useEffect(() => {
    if (leftTab !== 'dtc') return
    const t = setTimeout(() => setPendingExpandId(null), 500)
    return () => clearTimeout(t)
  }, [leftTab])

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <img src={ICONS.knowledgeBase} alt="" style={{ width: 56, height: 56, objectFit: 'contain', mixBlendMode: 'screen', filter: 'brightness(1.45) contrast(1.15) saturate(1.2) drop-shadow(0 0 10px rgba(255,239,180,0.55)) drop-shadow(0 0 22px rgba(232,184,110,0.4)) drop-shadow(0 0 48px rgba(200,148,70,0.2))' }} />
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div className="hud-header" style={{ marginBottom: 4 }}>База знаний</div>
              <div style={{
                fontFamily: 'var(--f-body), sans-serif',
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
            {vehicleProfile?.brand && (
              <button
                type="button"
                onClick={jumpToRecallsForBrand}
                style={{
                  flexShrink: 0,
                  minHeight: 44,
                  padding: '10px 14px',
                  fontFamily: 'var(--f-display)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: 'var(--c-champagne)',
                  background: 'rgba(255,23,68,0.08)',
                  border: '1px solid rgba(255,23,68,0.35)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'rgba(255,23,68,0.25)',
                }}
                title={`Открыть отзывные кампании ${vehicleProfile.brand}`}
              >
                <span aria-hidden>🔔</span>
                Отзывные кампании {vehicleProfile.brand}
              </button>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Общая информация о вашем автомобиле — сворачиваемая секция */}
      <div className="col-span-12">
        <GlassPanel>
          <button
            type="button"
            onClick={() => setVehicleInfoOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              marginBottom: vehicleInfoOpen ? 10 : 0, gap: 12,
            }}
          >
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div className="hud-header">Общая информация о вашем автомобиле</div>
              <div style={{ fontSize: 11, color: '#FFFFFF', fontFamily: 'var(--f-body)', marginTop: 4, opacity: 0.85, lineHeight: 1.5 }}>
                Полный паспорт вашей машины: VIN и его расшифровка, комплектация,
                объём и тип двигателя, трансмиссия, год выпуска и поколение, дата
                последнего ТО. Данные берём из профиля авто (который вы ввели при
                подключении) + из каталога моделей (10 000+ комплектаций).
              </div>
            </div>
            <span style={{
              fontFamily: 'var(--f-display)', fontSize: 10, letterSpacing: '0.1em',
              color: 'var(--c-champagne)', padding: '4px 10px',
              border: '1px solid rgba(230,212,168,0.25)', borderRadius: 2, flexShrink: 0,
            }}>
              {vehicleInfoOpen ? 'СВЕРНУТЬ ▲' : 'РАСКРЫТЬ ▼'}
            </span>
          </button>
          {vehicleInfoOpen && (
            <Suspense fallback={null}>
              <VehicleInfo />
            </Suspense>
          )}
        </GlassPanel>
      </div>

      {/* Отзывные кампании — свёрнуто по умолчанию */}
      <div className="col-span-12" id="kb-recalls-section">
        <GlassPanel>
          <button
            type="button"
            onClick={() => setRecallsOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              marginBottom: recallsOpen ? 10 : 0, gap: 12,
            }}
          >
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div className="hud-header">Отзывные кампании</div>
              <div style={{ fontSize: 11, color: '#FFFFFF', fontFamily: 'var(--f-body)', marginTop: 4, opacity: 0.85, lineHeight: 1.5 }}>
                Официально признанные производителем заводские дефекты, которые
                дилер обязан устранить <strong>бесплатно</strong> — даже если
                гарантия закончилась. Собираем ежедневно с сайта Росстандарта
                (gost.ru), NHTSA (США) и сервисных бюллетеней OEM. Сейчас в базе
                <strong> 298 кампаний</strong> по <strong>91 бренду</strong>.
                Ищите вашу машину по бренду, модели, году или описанию.
              </div>
            </div>
            <span style={{
              fontFamily: 'var(--f-display)', fontSize: 10, letterSpacing: '0.1em',
              color: 'var(--c-champagne)', padding: '4px 10px',
              border: '1px solid rgba(230,212,168,0.25)', borderRadius: 2, flexShrink: 0,
            }}>
              {recallsOpen ? 'СВЕРНУТЬ ▲' : 'РАСКРЫТЬ ▼'}
            </span>
          </button>
          {recallsOpen && (
            <div style={{ marginTop: 4 }}>
              <RecallsBrowser
                key={recallsMyCarMode ? 'mine' : 'all'}
                vehicleBrand={vehicleProfile?.brand}
                vehicleModel={vehicleProfile?.model}
                initialOnlyMyCar={recallsMyCarMode && !!vehicleProfile?.brand}
              />
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Ситуации / DTC — свёрнуто по умолчанию */}
      <div className="col-span-12 lg:col-span-8">
        <GlassPanel>
          <button
            type="button"
            onClick={() => setSituationsOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              marginBottom: situationsOpen ? 10 : 0, gap: 12,
            }}
          >
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div className="hud-header">Ситуации и поиск по DTC</div>
              <div style={{ fontSize: 11, color: '#FFFFFF', fontFamily: 'var(--f-body)', marginTop: 4, opacity: 0.85, lineHeight: 1.5 }}>
                Два справочника в одном: (1) <strong>Ситуации</strong> — подборка
                реальных случаев именно для вашей модели и поколения с объяснением
                «что значит / причина / что делать / во сколько обойдётся». База
                из <strong>764 универсальных</strong> и <strong>58 брендовых</strong>
                ситуаций собрана из автофорумов, FAQ и сервисных мануалов.
                (2) <strong>Поиск по DTC</strong> — справочник стандартных кодов
                неисправностей OBD-II (P-коды): расшифровка, срочность,
                привязка к ситуациям на вашей машине.
              </div>
            </div>
            <span style={{
              fontFamily: 'var(--f-display)', fontSize: 10, letterSpacing: '0.1em',
              color: 'var(--c-champagne)', padding: '4px 10px',
              border: '1px solid rgba(230,212,168,0.25)', borderRadius: 2, flexShrink: 0,
            }}>
              {situationsOpen ? 'СВЕРНУТЬ ▲' : 'РАСКРЫТЬ ▼'}
            </span>
          </button>
          {situationsOpen && (
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  { id: 'situations', label: 'Ситуации' },
                  { id: 'dtc', label: 'Поиск по DTC' },
                ] as const).map(tab => {
                  const active = leftTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setLeftTab(tab.id)}
                      style={{
                        padding: '8px 18px',
                        fontFamily: 'var(--f-display), sans-serif',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: active ? '#0C1220' : theme.accent.cyan,
                        background: active ? theme.accent.cyan : 'rgba(0,229,255,0.04)',
                        border: `1px solid ${active ? 'transparent' : 'rgba(0,229,255,0.18)'}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: active ? `0 0 10px ${theme.accent.cyan}60` : 'none',
                      }}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              {leftTab === 'situations' ? (
                <SituationsList
                  brandId={vehicleProfile?.brandId}
                  kbGenPath={kbGenPath}
                  initialExpandedId={pendingExpandId}
                />
              ) : (
                <DtcSearch onSelectSituation={handleDtcSelect} />
              )}
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Руководства — под Ситуациями, в левой колонке */}
      <div className="col-span-12 lg:col-span-8">
        <ManualViewer
          brandId={vehicleProfile?.brandId || null}
          modelName={vehicleProfile?.model || null}
          kbGenPath={kbGenPath || undefined}
        />
      </div>

      {/* Right sidebar: videos + reviews + parts */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
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
                    className="kb-video-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      minHeight: 48,
                      borderRadius: 4,
                      background: 'rgba(0,229,255,0.02)',
                      border: '1px solid rgba(0,229,255,0.06)',
                      textDecoration: 'none',
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'rgba(0,229,255,0.25)',
                      touchAction: 'manipulation',
                      userSelect: 'none',
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
                        fontFamily: 'var(--f-body), sans-serif',
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
                          fontFamily: 'var(--f-body), sans-serif',
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
                      fontFamily: 'var(--f-display), sans-serif',
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
                    fontFamily: 'var(--f-body), sans-serif',
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
                      fontFamily: 'var(--f-body), sans-serif',
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
                        fontFamily: 'var(--f-display), sans-serif',
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

        {/* Parts catalog */}
        {partsCat && Array.isArray(partsCat.parts) && partsCat.parts.length > 0 && (
          <GlassPanel>
            <div className="hud-header mb-3">
              Запчасти
              <span style={{ fontSize: 10, color: theme.text.muted, marginLeft: 8, fontWeight: 400 }}>
                {partsCat.parts.length}{partsCat.parts_capped ? ` из ${partsCat.total_parts ?? '?'}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '40vh', overflowY: 'auto' }}>
              {partsCat.parts.slice(0, 50).map((p, i) => {
                const price = p.price ?? p.price_rub
                const article = p.article ?? p.articul ?? p.oem_part_number
                return (
                  <div key={i} style={{
                    padding: '6px 10px',
                    borderRadius: 3,
                    background: 'rgba(0,229,255,0.02)',
                    border: '1px solid rgba(0,229,255,0.05)',
                  }}>
                    <div style={{
                      fontFamily: 'var(--f-body), sans-serif',
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.text.secondary,
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {p.name || article || 'Часть'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, gap: 6 }}>
                      {article && (
                        <span style={{
                          fontFamily: 'var(--f-display), sans-serif',
                          fontSize: 9,
                          color: theme.accent.cyan,
                          letterSpacing: '0.05em',
                        }}>
                          {article}
                        </span>
                      )}
                      {p.category && (
                        <span style={{
                          fontSize: 9,
                          fontFamily: 'var(--f-body), sans-serif',
                          color: theme.text.muted,
                          fontWeight: 600,
                        }}>
                          {p.category}
                        </span>
                      )}
                      {typeof price === 'number' && price > 0 && (
                        <span style={{
                          fontFamily: 'var(--f-display), sans-serif',
                          fontSize: 10,
                          color: '#FFD700',
                          fontWeight: 700,
                          marginLeft: 'auto',
                        }}>
                          {price.toLocaleString('ru-RU')} &#8381;
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassPanel>
        )}

        {/* Manual reference */}
        {manualMeta && (manualMeta.manual_md_size || manualMeta.has_dita || manualMeta.has_pdf) && (
          <GlassPanel>
            <div className="hud-header mb-3">Мануал</div>
            <div style={{
              fontFamily: 'var(--f-body), sans-serif',
              fontSize: 12,
              color: theme.text.secondary,
              lineHeight: 1.5,
            }}>
              <div>
                Доступен в базе: {manualMeta.manual_md_size ? `${Math.round(manualMeta.manual_md_size / 1024)} КБ` : '—'}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {manualMeta.has_dita && (
                  <span style={{
                    fontFamily: 'var(--f-display), sans-serif',
                    fontSize: 9,
                    color: theme.accent.teal,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: 'rgba(0,200,180,0.08)',
                    border: '1px solid rgba(0,200,180,0.2)',
                    letterSpacing: '0.05em',
                  }}>DITA</span>
                )}
                {manualMeta.has_pdf && (
                  <span style={{
                    fontFamily: 'var(--f-display), sans-serif',
                    fontSize: 9,
                    color: theme.status.critical,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: 'rgba(255,80,80,0.08)',
                    border: '1px solid rgba(255,80,80,0.2)',
                    letterSpacing: '0.05em',
                  }}>PDF</span>
                )}
                {manualMeta.variants && manualMeta.variants.length > 0 && (
                  <span style={{
                    fontSize: 9,
                    color: theme.text.muted,
                    fontFamily: 'var(--f-body), sans-serif',
                  }}>
                    {manualMeta.variants.length} вариантов
                  </span>
                )}
              </div>
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Статистика KB — в конце страницы, полная ширина */}
      <div className="col-span-12">
        <GlassPanel>
          <div className="hud-header mb-3">Статистика KB</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 36px', fontFamily: 'var(--f-body)', fontSize: 13, lineHeight: 1.3, justifyContent: 'flex-start' }}>
            {[
              { label: 'Универсальных ситуаций', value: '764' },
              { label: 'Полных мануалов', value: String(KB_STATS.generations) },
              { label: 'Брендов с ситуациями', value: String(KB_STATS.brands) },
              { label: 'Моделей в базе', value: String(KB_STATS.models) },
              { label: 'Отзывных кампаний', value: '298' },
            ].map(({ label, value }) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
                <strong style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-champagne)', fontWeight: 700 }}>{value}</strong>
                <span style={{ color: '#FFFFFF' }}>{label}</span>
              </span>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
