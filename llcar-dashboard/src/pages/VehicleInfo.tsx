import { GlassPanel } from '../components/shared/GlassPanel'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'

export function VehicleInfo() {
  const { vehicleProfile, mode } = useDashboardStore()

  const title = vehicleProfile
    ? `${vehicleProfile.brand} ${vehicleProfile.model} (${vehicleProfile.year})`
    : 'Об автомобиле'

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12">
        <GlassPanel>
          <div className="hud-header mb-4">{title}</div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 24px',
            gap: 16,
          }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>&#x1F697;</div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: theme.text.secondary,
            }}>
              {mode === 'general'
                ? 'Выберите автомобиль для просмотра характеристик'
                : 'Спецификации, типовые болячки, народная репутация'}
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              color: theme.text.muted,
            }}>
              Раздел в разработке — скоро здесь появятся полные ТТХ поколения
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
