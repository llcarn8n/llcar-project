import { useState, useMemo } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'
import { useRecallsSearch, type RecallCampaign } from '../../hooks/useRecallsSearch'

interface RecallsBrowserProps {
  vehicleBrand?: string | null
  vehicleModel?: string | null
}

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: '#FF1744', label: 'КРИТИЧНО' },
  high: { color: '#FF6D00', label: 'ВЫСОКИЙ' },
  medium: { color: '#FFAB00', label: 'СРЕДНИЙ' },
  low: { color: 'var(--c-spectral)', label: 'НИЗКИЙ' },
}

const SEVERITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Все уровни' },
  { value: 'critical', label: 'Критичные' },
  { value: 'high', label: 'Высокие' },
  { value: 'medium', label: 'Средние' },
  { value: 'low', label: 'Низкие' },
]

const SYSTEM_LABELS: Record<string, string> = {
  fuel: 'Топливная система',
  engine: 'Двигатель',
  brakes: 'Тормозная система',
  steering: 'Рулевое управление',
  suspension: 'Подвеска',
  transmission: 'Трансмиссия',
  electrical: 'Электрика',
  safety: 'Безопасность',
  airbag: 'Подушки безопасности',
  seatbelt: 'Ремни безопасности',
  lights: 'Освещение',
  exhaust: 'Выпускная система',
  body: 'Кузов',
  other: 'Прочее',
}

function translateSystem(system: string): string {
  return SYSTEM_LABELS[system] || system || 'Прочее'
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function RecallCard({ recall }: { recall: RecallCampaign }) {
  const [open, setOpen] = useState(false)
  const sev = SEVERITY_CONFIG[recall.severity] || SEVERITY_CONFIG.medium

  return (
    <div
      style={{
        padding: '10px 12px', borderRadius: 2,
        borderLeft: `3px solid ${sev.color}`,
        background: `${sev.color}0A`,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onClick={() => setOpen(v => !v)}
      onMouseEnter={e => { e.currentTarget.style.background = `${sev.color}14` }}
      onMouseLeave={e => { e.currentTarget.style.background = `${sev.color}0A` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontFamily: 'var(--f-body)', fontWeight: 600, color: theme.text.primary, lineHeight: 1.3 }}>
          {recall.title_ru || recall.id}
        </span>
        <span style={{
          fontSize: 8, fontFamily: 'var(--f-display)', fontWeight: 700,
          color: sev.color, padding: '2px 6px', border: `1px solid ${sev.color}40`,
          borderRadius: 2, background: `${sev.color}10`, letterSpacing: '0.1em', flexShrink: 0,
        }}>
          {sev.label}
        </span>
      </div>
      <div style={{ fontSize: 11, color: theme.text.muted, fontFamily: 'var(--f-body)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <span>🏭 <strong style={{ color: theme.text.secondary, textTransform: 'capitalize' }}>{recall.brand}</strong></span>
        <span>📅 {formatDate(recall.date)}{recall.years ? ` · г.в. ${recall.years}` : ''}</span>
        <span>🔧 {translateSystem(recall.system)}</span>
        <span>🚗 {(recall.count || 0).toLocaleString('ru-RU')} авто</span>
      </div>

      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(230,212,168,0.12)' }}>
          {recall.description_ru && (
            <div style={{ fontSize: 12, color: theme.text.secondary, fontFamily: 'var(--f-body)', lineHeight: 1.55, marginBottom: 10 }}>
              {recall.description_ru}
            </div>
          )}

          {recall.models && recall.models.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: theme.accent.teal, fontFamily: 'var(--f-display)', letterSpacing: '0.1em', marginBottom: 4 }}>
                МОДЕЛИ ({recall.models.length}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {recall.models.map((m, i) => (
                  <span key={i} style={{
                    fontSize: 10, padding: '2px 6px', background: 'rgba(230,212,168,0.08)',
                    border: '1px solid rgba(230,212,168,0.18)', borderRadius: 2, color: theme.text.secondary,
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: theme.text.muted, fontFamily: 'var(--f-mono)' }}>
            <span>ID: {recall.id}</span>
            {recall.source_url ? (
              <a
                href={recall.source_url}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ color: 'var(--c-spectral)', textDecoration: 'underline' }}
              >
                Первоисточник ({recall.source || 'internet'}) ↗
              </a>
            ) : (
              <span>Источник: {recall.source || '—'}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function RecallsBrowser({ vehicleBrand, vehicleModel }: RecallsBrowserProps) {
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('')
  const [severity, setSeverity] = useState('')
  const [onlyMyCar, setOnlyMyCar] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const effectiveBrand = onlyMyCar && vehicleBrand ? vehicleBrand.toLowerCase() : brand
  const effectiveQ = onlyMyCar && vehicleModel ? vehicleModel : q

  const { data, loading, error } = useRecallsSearch({
    q: effectiveQ,
    brand: effectiveBrand,
    severity,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const totalPages = useMemo(() => {
    if (!data) return 0
    return Math.max(1, Math.ceil(data.total / PAGE_SIZE))
  }, [data])

  const resetPage = () => setPage(0)

  return (
    <GlassPanel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="hud-header">
          Отзывные кампании
          {data && (
            <span style={{ fontSize: 10, color: theme.text.muted, marginLeft: 8, fontWeight: 400 }}>
              {data.total.toLocaleString('ru-RU')} найдено
            </span>
          )}
        </div>
      </div>

      {/* Объяснение */}
      <div style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: theme.text.muted, lineHeight: 1.55, marginBottom: 12 }}>
        Официальные отзывные кампании (Росстандарт / NHTSA / сервисные бюллетени OEM) — ситуации, когда производитель
        признал заводской дефект и обязан устранить его <strong style={{ color: theme.text.secondary }}>бесплатно</strong>.
        Найдите свою машину в списке — возможно, вы имеете право на ремонт за счёт дилера.
      </div>

      {/* Фильтры */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Поиск: бренд, модель, описание..."
          value={q}
          onChange={e => { setQ(e.target.value); resetPage() }}
          disabled={onlyMyCar}
          style={{
            flex: '1 1 240px', padding: '8px 12px',
            fontFamily: 'var(--f-body)', fontSize: 13,
            color: 'var(--text-primary)',
            background: 'rgba(230,212,168,0.04)',
            border: '1px solid rgba(230,212,168,0.18)',
            borderRadius: 4, outline: 'none',
            opacity: onlyMyCar ? 0.5 : 1,
          }}
        />
        <select
          value={brand}
          onChange={e => { setBrand(e.target.value); resetPage() }}
          disabled={onlyMyCar}
          style={{
            padding: '8px 10px',
            fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'rgba(230,212,168,0.04)',
            border: '1px solid rgba(230,212,168,0.18)',
            borderRadius: 4, outline: 'none', cursor: 'pointer',
            minWidth: 140,
            opacity: onlyMyCar ? 0.5 : 1,
          }}
        >
          <option value="">Все бренды</option>
          {data?.brands.map(b => (
            <option key={b.slug} value={b.slug}>
              {b.name} ({b.count})
            </option>
          ))}
        </select>
        <select
          value={severity}
          onChange={e => { setSeverity(e.target.value); resetPage() }}
          style={{
            padding: '8px 10px',
            fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'rgba(230,212,168,0.04)',
            border: '1px solid rgba(230,212,168,0.18)',
            borderRadius: 4, outline: 'none', cursor: 'pointer',
            minWidth: 140,
          }}
        >
          {SEVERITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {vehicleBrand && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            padding: '8px 12px', fontFamily: 'var(--f-body)', fontSize: 12,
            color: onlyMyCar ? 'var(--c-spectral)' : theme.text.secondary,
            background: onlyMyCar ? 'rgba(230,212,168,0.08)' : 'transparent',
            border: `1px solid ${onlyMyCar ? 'rgba(230,212,168,0.35)' : 'rgba(230,212,168,0.18)'}`,
            borderRadius: 4,
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={onlyMyCar}
              onChange={e => { setOnlyMyCar(e.target.checked); resetPage() }}
              style={{ accentColor: 'var(--c-spectral)' }}
            />
            Только для моего авто
            {vehicleModel && <span style={{ color: theme.text.muted, fontSize: 11 }}>({vehicleBrand} {vehicleModel})</span>}
          </label>
        )}
      </div>

      {/* Результаты */}
      {error && (
        <div style={{ padding: 16, textAlign: 'center', color: theme.status.critical, fontFamily: 'var(--f-body)', fontSize: 12 }}>
          Ошибка загрузки: {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ padding: 16, textAlign: 'center', fontFamily: 'var(--f-display)', fontSize: 11, color: 'var(--c-spectral)', letterSpacing: '0.15em' }}>
          ЗАГРУЗКА...
        </div>
      )}

      {data && data.campaigns.length === 0 && !loading && (
        <div style={{ padding: 16, textAlign: 'center', color: theme.text.muted, fontFamily: 'var(--f-body)', fontSize: 12 }}>
          По указанным параметрам отзывных кампаний не найдено.
        </div>
      )}

      {data && data.campaigns.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
            {data.campaigns.map((c, i) => <RecallCard key={c.id || i} recall={c} />)}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
              marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(230,212,168,0.12)',
            }}>
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={paginationBtnStyle(page === 0)}
              >
                ← НАЗАД
              </button>
              <span style={{
                fontFamily: 'var(--f-display)', fontSize: 10,
                color: theme.text.muted, letterSpacing: '0.1em', minWidth: 80, textAlign: 'center',
              }}>
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={paginationBtnStyle(page >= totalPages - 1)}
              >
                ВПЕРЁД →
              </button>
            </div>
          )}
        </>
      )}
    </GlassPanel>
  )
}

function paginationBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: '1px solid rgba(230,212,168,0.25)',
    color: disabled ? 'rgba(230,212,168,0.3)' : 'var(--c-spectral)',
    fontFamily: 'var(--f-display)',
    fontSize: 10,
    letterSpacing: '0.1em',
    padding: '6px 12px',
    borderRadius: 2,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  }
}
