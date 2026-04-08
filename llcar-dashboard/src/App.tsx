import { useCallback } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { Diagnostics } from './pages/Diagnostics'
import { Trips } from './pages/Trips'
import { ThemeProvider } from './components/shared/ThemeProvider'
import { useDashboardStore } from './stores/dashboardStore'
import { VehicleSetup } from './components/onboarding/VehicleSetup'
import { ConnectionWizard } from './components/onboarding/ConnectionWizard'

function App() {
  const {
    activeTab,
    vehicleProfile,
    showVehicleSetup,
    closeVehicleSetup,
    connectionDone,
    setConnectionDone,
    showConnectionWizard,
    closeConnectionWizard,
  } = useDashboardStore()

  const handleSetupComplete = useCallback(() => {
    closeVehicleSetup()
  }, [closeVehicleSetup])

  const handleConnectionComplete = useCallback(() => {
    setConnectionDone(true)
  }, [setConnectionDone])

  const handleConnectionWizardClose = useCallback(() => {
    closeConnectionWizard()
  }, [closeConnectionWizard])

  // First-time user: no vehicle profile yet
  if (!vehicleProfile) {
    return (
      <ThemeProvider>
        <VehicleSetup onComplete={() => {}} />
      </ThemeProvider>
    )
  }

  // Vehicle profile set, but connection guide not completed yet
  if (!connectionDone) {
    return (
      <ThemeProvider>
        <ConnectionWizard onComplete={handleConnectionComplete} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <MainLayout>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'diagnostics' && <Diagnostics />}
        {activeTab === 'trips' && <Trips />}
      </MainLayout>
      {/* Re-edit vehicle profile modal (opened from sidebar) */}
      {showVehicleSetup && (
        <VehicleSetup asModal onComplete={handleSetupComplete} />
      )}
      {/* Re-open connection wizard modal (opened from sidebar) */}
      {showConnectionWizard && (
        <ConnectionWizard asModal onComplete={handleConnectionWizardClose} />
      )}
    </ThemeProvider>
  )
}

export default App
