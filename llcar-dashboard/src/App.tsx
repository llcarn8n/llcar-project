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
    showConnectionWizard,
    closeConnectionWizard,
  } = useDashboardStore()

  // First-time user: no vehicle profile yet — go straight to dashboard after setup
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
      {/* Re-edit vehicle profile modal */}
      {showVehicleSetup && (
        <VehicleSetup asModal onComplete={() => closeVehicleSetup()} />
      )}
      {/* Connection wizard modal (from sidebar) */}
      {showConnectionWizard && (
        <ConnectionWizard asModal onComplete={() => closeConnectionWizard()} />
      )}
    </ThemeProvider>
  )
}

export default App
