import { useCallback } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { Diagnostics } from './pages/Diagnostics'
import { Trips } from './pages/Trips'
import { ThemeProvider } from './components/shared/ThemeProvider'
import { useDashboardStore } from './stores/dashboardStore'
import { VehicleSetup } from './components/onboarding/VehicleSetup'

function App() {
  const { activeTab, vehicleProfile, showVehicleSetup, closeVehicleSetup } = useDashboardStore()

  const handleSetupComplete = useCallback(() => {
    closeVehicleSetup()
  }, [closeVehicleSetup])

  // First-time user: no vehicle profile yet
  if (!vehicleProfile) {
    return (
      <ThemeProvider>
        <VehicleSetup onComplete={() => {}} />
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
    </ThemeProvider>
  )
}

export default App
