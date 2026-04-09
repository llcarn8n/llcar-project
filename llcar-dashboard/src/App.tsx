import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { ThemeProvider } from './components/shared/ThemeProvider'
import { useDashboardStore } from './stores/dashboardStore'
import { VehicleSetup } from './components/onboarding/VehicleSetup'
import { ConnectionWizard } from './components/onboarding/ConnectionWizard'
import { GlassPanel } from './components/shared/GlassPanel'
import { theme } from './theme'

// Lazy-loaded pages
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })))
const VehicleInfo = lazy(() => import('./pages/VehicleInfo').then(m => ({ default: m.VehicleInfo })))
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })))
const ErrorCodes = lazy(() => import('./pages/ErrorCodes').then(m => ({ default: m.ErrorCodes })))
const Diagnostics = lazy(() => import('./pages/Diagnostics').then(m => ({ default: m.Diagnostics })))
const Resources = lazy(() => import('./pages/Resources').then(m => ({ default: m.Resources })))
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <GlassPanel style={{ padding: '32px 48px', textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 14,
          letterSpacing: '0.15em',
          color: theme.accent.cyan,
          textShadow: `0 0 12px ${theme.accent.cyan}60`,
        }}>
          LOADING...
        </div>
      </GlassPanel>
    </div>
  )
}

function App() {
  const {
    vehicleProfile,
    mode,
    showVehicleSetup,
    closeVehicleSetup,
    showConnectionWizard,
    closeConnectionWizard,
  } = useDashboardStore()

  // No vehicle and no general mode → show landing
  const needsLanding = !vehicleProfile && mode !== 'general'

  return (
    <ThemeProvider>
      {needsLanding ? (
        <Suspense fallback={<PageLoader />}>
          <Landing />
        </Suspense>
      ) : (
        <MainLayout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<VehicleInfo />} />
              <Route path="/vehicle" element={<VehicleInfo />} />
              <Route path="/kb" element={<KnowledgeBase />} />
              <Route path="/dtc" element={<ErrorCodes />} />
              <Route path="/diagnostics" element={<Diagnostics />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </MainLayout>
      )}

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
