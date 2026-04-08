import { SituationsList } from '../components/kb/SituationsList'
import { ManualViewer } from '../components/kb/ManualViewer'
import { GlassPanel } from '../components/shared/GlassPanel'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'

// Robot image removed — will be redesigned

export function KnowledgeBase() {
  const { vehicleProfile } = useDashboardStore()

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Header */}
      <div className="col-span-12">
        <GlassPanel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 48, opacity: 0.4 }}>&#x1F916;</span>
            <div>
              <div className="hud-header" style={{ marginBottom: 4 }}>База знаний</div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 13,
                color: theme.text.muted,
                lineHeight: 1.4,
              }}>
                {vehicleProfile
                  ? `${vehicleProfile.brand} ${vehicleProfile.model} — универсальные и модельные ситуации`
                  : '764 универсальных ситуации для всех марок и моделей'}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Situations */}
      <div className="col-span-12 lg:col-span-8">
        <SituationsList brandId={vehicleProfile?.brandId} />
      </div>

      {/* Right sidebar: manuals + parts (stubs) */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
        {/* Manuals viewer */}
        <ManualViewer
          brandId={vehicleProfile?.brandId || null}
          modelName={vehicleProfile?.model || null}
        />

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
