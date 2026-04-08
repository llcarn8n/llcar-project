import { useState, useMemo, useEffect } from 'react'
import { GlassPanel } from '../components/shared/GlassPanel'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'

// Robot image removed — will be redesigned

interface Resource {
  name: string
  url: string
  desc: string
  category: 'forum' | 'video' | 'tool' | 'manufacturer' | 'recall'
  brands?: string[] // empty = universal
}

const RESOURCES: Resource[] = [
  // Forums
  { name: 'Drive2.ru', url: 'https://www.drive2.ru', desc: 'Крупнейшее автосообщество России: бортжурналы, отзывы, запчасти', category: 'forum' },
  { name: 'Drom.ru', url: 'https://www.drom.ru', desc: 'Отзывы владельцев, каталог авто, форум по маркам', category: 'forum' },
  { name: 'Forum.auto.ru', url: 'https://forum.auto.ru', desc: 'Форумы по маркам и моделям, технические обсуждения', category: 'forum' },

  // Video
  { name: 'АвтоТехЛаб', url: 'https://youtube.com/@autotechlab', desc: 'Диагностика и ремонт: осциллограммы, анализ DTC, практика', category: 'video' },
  { name: 'Garage54', url: 'https://youtube.com/@Garage54', desc: 'Автомобильные эксперименты и тесты', category: 'video' },
  { name: 'АвтоВАЗ Техно', url: 'https://youtube.com/@AutoVAZTechno', desc: 'Ремонт и обслуживание российских авто', category: 'video' },

  // Tools
  { name: 'OBD Codes Lookup', url: 'https://www.obd-codes.com', desc: 'Международная база кодов ошибок OBD-II (англ.)', category: 'tool' },
  { name: 'ELM327 — гид по адаптерам', url: 'https://www.elm327.com', desc: 'Как выбрать OBD-II адаптер, совместимость', category: 'tool' },

  // Manufacturers
  { name: 'Lada (АвтоВАЗ)', url: 'https://www.lada.ru', desc: 'Официальный сайт, сервисная документация', category: 'manufacturer', brands: ['lada'] },
  { name: 'Toyota Russia', url: 'https://www.toyota.ru', desc: 'Модельный ряд, сервис, отзывные кампании', category: 'manufacturer', brands: ['toyota'] },
  { name: 'BMW Russia', url: 'https://www.bmw.ru', desc: 'Официальный сайт, ConnectedDrive', category: 'manufacturer', brands: ['bmw'] },
  { name: 'Hyundai Russia', url: 'https://www.hyundai.ru', desc: 'Модели, сервис, запчасти', category: 'manufacturer', brands: ['hyundai'] },
  { name: 'Kia Russia', url: 'https://www.kia.ru', desc: 'Официальный сайт, гарантия', category: 'manufacturer', brands: ['kia'] },

  // Recalls
  { name: 'Росстандарт — Отзывные кампании', url: 'https://www.rst.gov.ru/portal/gost/home/presscenter/news', desc: 'Официальный реестр отзывных кампаний РФ', category: 'recall' },
  { name: 'NHTSA Recalls', url: 'https://www.nhtsa.gov/recalls', desc: 'База отзывных кампаний США (англ.)', category: 'recall' },
]

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  forum: { label: 'Форумы', icon: '\u{1F4AC}', color: theme.accent.cyan },
  video: { label: 'Видео', icon: '\u{1F3AC}', color: theme.status.ok },
  tool: { label: 'Инструменты', icon: '\u{1F6E0}', color: theme.accent.teal },
  manufacturer: { label: 'Производители', icon: '\u{1F3ED}', color: theme.status.warning },
  recall: { label: 'Отзывные кампании', icon: '\u26A0', color: theme.status.critical },
}

interface RecallCampaign {
  id: string; brand: string; models: string[]; date: string;
  count: number; title: string; desc: string; severity: string;
}

function RecallsSearch({ brand }: { brand: string | null; model: string | null }) {
  const [recalls, setRecalls] = useState<RecallCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/recalls.json`)
      .then(r => r.json())
      .then((d: RecallCampaign[]) => { setRecalls(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let results = recalls
    if (brand) results = results.filter(r => r.brand === brand)
    if (search) {
      const q = search.toLowerCase()
      results = results.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.models.some(m => m.toLowerCase().includes(q)) ||
        r.brand.includes(q)
      )
    }
    return results.slice(0, 30)
  }, [recalls, brand, search])

  return (
    <GlassPanel>
      <div className="hud-header mb-3">
        Отзывные кампании
        {!loading && <span style={{ fontSize: 10, color: theme.text.muted, marginLeft: 8, fontWeight: 400 }}>{recalls.length} в базе</span>}
      </div>

      <input
        type="text"
        placeholder="Поиск по кампаниям..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', marginBottom: 12,
          fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 600,
          color: '#ffffff', background: '#0f1923',
          border: '1px solid rgba(0,229,255,0.15)', borderRadius: 4, outline: 'none',
        }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 16, fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: theme.accent.cyan }}>LOADING...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '50vh', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 16, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: theme.text.muted, textAlign: 'center' }}>
              {brand ? `Нет отзывных кампаний для ${brand}` : 'Введите запрос или выберите автомобиль'}
            </div>
          )}
          {filtered.map(r => (
            <div key={r.id} style={{
              padding: '12px 14px', borderRadius: 4,
              background: 'rgba(255,23,68,0.03)', border: '1px solid rgba(255,23,68,0.1)',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, color: theme.text.secondary, marginBottom: 4 }}>
                    {r.title}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: theme.text.muted, lineHeight: 1.4, marginBottom: 6 }}>
                    {r.desc}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.models.slice(0, 5).map(m => (
                      <span key={m} style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 2,
                        background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)',
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.accent.cyan,
                      }}>{m}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: theme.status.critical }}>
                    {r.count.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: theme.text.muted }}>авто</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: theme.text.muted, marginTop: 4 }}>{r.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}

export function Resources() {
  const { vehicleProfile } = useDashboardStore()
  const [catFilter, setCatFilter] = useState('')

  const filtered = useMemo(() => {
    return RESOURCES.filter(r => {
      if (catFilter && r.category !== catFilter) return false
      return true
    })
  }, [catFilter])

  const categories = Object.keys(CATEGORY_INFO)

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Header */}
      <div className="col-span-12">
        <GlassPanel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 48, opacity: 0.4 }}>&#x1F916;</span>
            <div>
              <div className="hud-header" style={{ marginBottom: 4 }}>Полезные источники</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: theme.text.muted, lineHeight: 1.4 }}>
                Форумы, видео, инструменты диагностики и отзывные кампании
                {vehicleProfile && ` для ${vehicleProfile.brand} ${vehicleProfile.model}`}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Category filter */}
      <div className="col-span-12">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCatFilter('')}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: !catFilter ? '#0C1220' : theme.text.muted,
              background: !catFilter ? `linear-gradient(135deg, ${theme.accent.cyan}, ${theme.accent.teal})` : 'rgba(0,229,255,0.04)',
              border: `1px solid ${!catFilter ? 'transparent' : 'rgba(0,229,255,0.15)'}`,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              transition: 'all 0.2s',
            }}
          >
            Все ({RESOURCES.length})
          </button>
          {categories.map(cat => {
            const info = CATEGORY_INFO[cat]
            const count = RESOURCES.filter(r => r.category === cat).length
            const active = catFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(active ? '' : cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: active ? '#0C1220' : info.color,
                  background: active ? info.color : `${info.color}08`,
                  border: `1px solid ${active ? 'transparent' : `${info.color}20`}`,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                }}
              >
                {info.icon} {info.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Resources list */}
      <div className="col-span-12">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(r => {
            const info = CATEGORY_INFO[r.category]
            return (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <GlassPanel style={{
                  height: '100%',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      fontSize: 24,
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      {info.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: theme.text.primary,
                        marginBottom: 4,
                      }}>
                        {r.name}
                        <span style={{
                          fontSize: 10,
                          color: info.color,
                          marginLeft: 8,
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase' as const,
                        }}>
                          {info.label}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 12,
                        color: theme.text.muted,
                        lineHeight: 1.4,
                      }}>
                        {r.desc}
                      </div>
                    </div>
                    <span style={{ color: theme.accent.cyan, opacity: 0.4, fontSize: 14, flexShrink: 0 }}>&#x2197;</span>
                  </div>
                </GlassPanel>
              </a>
            )
          })}
        </div>
      </div>

      {/* Recalls search */}
      <div className="col-span-12">
        <RecallsSearch brand={vehicleProfile?.brandId || null} model={vehicleProfile?.model || null} />
      </div>
    </div>
  )
}
