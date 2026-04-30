import { useState, useMemo } from 'react'
import { GlassPanel } from '../components/shared/GlassPanel'
import { Pricing } from './Pricing'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'
import { ICONS } from '../utils/icons'

interface Resource {
  name: string
  url: string
  /** URL с плейсхолдером {q} для deep-link'а поиска по «бренд модель». Если
   *  у пользователя не выбрано авто — fallback на обычный url. */
  searchPattern?: string
  desc: string
  category: 'forum' | 'video' | 'tool' | 'manufacturer'
  brands?: string[] // empty = universal
}

const RESOURCES: Resource[] = [
  // Forums — deep-link в поиск по «бренд модель»
  { name: 'Drive2.ru', url: 'https://www.drive2.ru',
    searchPattern: 'https://www.drive2.ru/l/?q={q}',
    desc: 'Крупнейшее автосообщество России: бортжурналы, отзывы, запчасти', category: 'forum' },
  { name: 'Drom.ru', url: 'https://www.drom.ru',
    searchPattern: 'https://www.drom.ru/search/?keyword={q}',
    desc: 'Отзывы владельцев, каталог авто, форум по маркам', category: 'forum' },
  { name: 'Forum.auto.ru', url: 'https://forum.auto.ru',
    searchPattern: 'https://forum.auto.ru/search/?query={q}',
    desc: 'Форумы по маркам и моделям, технические обсуждения', category: 'forum' },

  // Video — поиск внутри канала по марке
  { name: 'АвтоТехЛаб', url: 'https://www.youtube.com/@autotechlab',
    searchPattern: 'https://www.youtube.com/@autotechlab/search?query={q}',
    desc: 'Диагностика и ремонт: осциллограммы, анализ DTC, практика', category: 'video' },
  { name: 'Garage54', url: 'https://www.youtube.com/@Garage54',
    searchPattern: 'https://www.youtube.com/@Garage54/search?query={q}',
    desc: 'Автомобильные эксперименты и тесты', category: 'video' },
  { name: 'АвтоВАЗ Техно', url: 'https://www.youtube.com/@AutoVAZTechno',
    searchPattern: 'https://www.youtube.com/@AutoVAZTechno/search?query={q}',
    desc: 'Ремонт и обслуживание российских авто', category: 'video' },
  // Общий YouTube-поиск — когда вообще ничего своего не знаем
  { name: 'YouTube — общий поиск', url: 'https://www.youtube.com',
    searchPattern: 'https://www.youtube.com/results?search_query={q}+диагностика',
    desc: 'Поиск роликов про диагностику именно вашего авто', category: 'video' },

  // Tools — общие базы, search по коду DTC
  { name: 'OBD Codes Lookup', url: 'https://www.obd-codes.com',
    searchPattern: 'https://www.obd-codes.com/search?q={q}',
    desc: 'Международная база кодов ошибок OBD-II (англ.)', category: 'tool' },
  { name: 'ELM327 — гид по адаптерам', url: 'https://www.elm327.com', desc: 'Как выбрать OBD-II адаптер, совместимость', category: 'tool' },

  // Manufacturers
  { name: 'Lada (АвтоВАЗ)', url: 'https://www.lada.ru', desc: 'Официальный сайт, сервисная документация', category: 'manufacturer', brands: ['lada'] },
  { name: 'Toyota Russia', url: 'https://www.toyota.ru', desc: 'Модельный ряд, сервис, отзывные кампании', category: 'manufacturer', brands: ['toyota'] },
  { name: 'BMW Russia', url: 'https://www.bmw.ru', desc: 'Официальный сайт, ConnectedDrive', category: 'manufacturer', brands: ['bmw'] },
  { name: 'Hyundai Russia', url: 'https://www.hyundai.ru', desc: 'Модели, сервис, запчасти', category: 'manufacturer', brands: ['hyundai'] },
  { name: 'Kia Russia', url: 'https://www.kia.ru', desc: 'Официальный сайт, гарантия', category: 'manufacturer', brands: ['kia'] },

  // Recalls удалены — отзывные кампании живут в /v3/kb (полноценный
  // RecallsBrowser с фильтрами, поиском, пагинацией и быстрой кнопкой
  // «Отзывные кампании {brand}» в header'е KB).
]

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  forum: { label: 'Форумы', icon: '\u{1F4AC}', color: 'var(--c-champagne)' },
  video: { label: 'Видео', icon: '\u{1F3AC}', color: 'var(--c-champagne)' },
  tool: { label: 'Инструменты', icon: '\u{1F6E0}', color: 'var(--c-champagne)' },
  manufacturer: { label: 'Производители', icon: '\u{1F3ED}', color: 'var(--c-champagne)' },
  pricing: { label: 'Тарифы', icon: '\u{1F4B3}', color: 'var(--c-champagne)' },
}

/* RecallsSearch удалён — отзывные кампании теперь только в /v3/kb */

export function Resources() {
  const { vehicleProfile } = useDashboardStore()
  const [catFilter, setCatFilter] = useState('')

  const filtered = useMemo(() => {
    return RESOURCES.filter(r => {
      if (catFilter && r.category !== catFilter) return false
      return true
    })
  }, [catFilter])

  // Преобразуем общий url в deep-link «бренд модель», если у юзера есть профиль
  // и у ресурса есть searchPattern. Иначе — обычный url ведёт на главную.
  const resolveUrl = (r: Resource): string => {
    if (!r.searchPattern) return r.url
    if (!vehicleProfile?.brand) return r.url
    const query = [vehicleProfile.brand, vehicleProfile.model].filter(Boolean).join(' ').trim()
    if (!query) return r.url
    return r.searchPattern.replace('{q}', encodeURIComponent(query))
  }

  const categories = Object.keys(CATEGORY_INFO)

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Header */}
      <div className="col-span-12">
        <GlassPanel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={ICONS.knowledgeBase} alt="" style={{ width: 56, height: 56, objectFit: 'contain', mixBlendMode: 'screen', filter: 'brightness(1.45) contrast(1.15) saturate(1.2) drop-shadow(0 0 10px rgba(255,239,180,0.55)) drop-shadow(0 0 22px rgba(232,184,110,0.4)) drop-shadow(0 0 48px rgba(200,148,70,0.2))' }} />
            <div>
              <div className="hud-header" style={{ marginBottom: 4 }}>Полезные источники</div>
              <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: theme.text.muted, lineHeight: 1.4 }}>
                Форумы, видео, инструменты диагностики, сайты производителей
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
              fontFamily: "var(--f-body)",
              fontSize: 12,
              fontWeight: 700,
              color: !catFilter ? '#0C1220' : theme.text.muted,
              background: !catFilter ? 'var(--c-champagne)' : 'rgba(230,212,168,0.04)',
              border: `1px solid ${!catFilter ? 'transparent' : 'rgba(230,212,168,0.15)'}`,
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
                  fontFamily: "var(--f-body)",
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

      {/* Pricing tab — rendered inline instead of resource grid */}
      {catFilter === 'pricing' && (
        <div className="col-span-12">
          <Pricing />
        </div>
      )}

      {/* Resources list (hidden when pricing tab is active) */}
      {catFilter !== 'pricing' && (
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
                href={resolveUrl(r)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
                title={vehicleProfile?.brand && r.searchPattern
                  ? `Поиск «${vehicleProfile.brand} ${vehicleProfile.model ?? ''}» на ${r.name}`
                  : r.name}
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
                        fontFamily: "var(--f-body)",
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
                        fontFamily: "var(--f-body)",
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
      )}

      {/* Recalls блок удалён — отзывные кампании живут в /v3/kb. */}
    </div>
  )
}
