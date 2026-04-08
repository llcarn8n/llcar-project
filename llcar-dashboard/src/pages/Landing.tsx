import { useDashboardStore } from '../stores/dashboardStore'
import { VehicleSetup } from '../components/onboarding/VehicleSetup'
import { theme } from '../theme'

export function Landing() {
  const { setMode } = useDashboardStore()

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg.void,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      {/* TODO Phase 1: split into LandingHero (left) + VehicleSelect (right) */}
      <VehicleSetup onComplete={() => {}} />

      {/* "Ознакомиться с продуктом" button underneath */}
      <button
        onClick={() => setMode('general')}
        style={{
          marginTop: 16,
          padding: '12px 32px',
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: theme.text.muted,
          background: 'transparent',
          border: `1px solid rgba(0,229,255,0.2)`,
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
      >
        Ознакомиться с продуктом
      </button>
    </div>
  )
}
