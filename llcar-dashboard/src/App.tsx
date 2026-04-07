import { MainLayout } from './layouts/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { Diagnostics } from './pages/Diagnostics'
import { Trips } from './pages/Trips'
import { useDashboardStore } from './stores/dashboardStore'

function App() {
  const { activeTab } = useDashboardStore()

  return (
    <MainLayout>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'diagnostics' && <Diagnostics />}
      {activeTab === 'trips' && <Trips />}
    </MainLayout>
  )
}

export default App
