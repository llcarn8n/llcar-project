import { MainLayout } from './layouts/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { Diagnostics } from './pages/Diagnostics'
import { Trips } from './pages/Trips'
import { ThemeProvider } from './components/shared/ThemeProvider'
import { useDashboardStore } from './stores/dashboardStore'

function App() {
  const { activeTab } = useDashboardStore()

  return (
    <ThemeProvider>
      <MainLayout>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'diagnostics' && <Diagnostics />}
        {activeTab === 'trips' && <Trips />}
      </MainLayout>
    </ThemeProvider>
  )
}

export default App
