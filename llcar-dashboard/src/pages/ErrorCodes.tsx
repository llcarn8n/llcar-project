import { GlassPanel } from '../components/shared/GlassPanel'
import { theme } from '../theme'

export function ErrorCodes() {
  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12">
        <GlassPanel>
          <div className="hud-header mb-4">Коды ошибок</div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 24px',
            gap: 16,
          }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>&#x26A0;</div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: theme.text.secondary,
            }}>
              Поиск и расшифровка 36 000+ DTC кодов
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              color: theme.text.muted,
            }}>
              Раздел в разработке
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
