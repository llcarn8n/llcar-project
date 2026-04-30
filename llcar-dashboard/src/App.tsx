import { Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { ThemeProvider } from './components/shared/ThemeProvider'
import { useDashboardStore } from './stores/dashboardStore'
import { VehicleSetup } from './components/onboarding/VehicleSetup'
import { ConnectionWizard } from './components/onboarding/ConnectionWizard'
import { GlassPanel } from './components/shared/GlassPanel'
import { lazyWithRetry } from './utils/lazyWithRetry'

// Lazy-loaded pages
const Landing = lazyWithRetry(() => import('./pages/Landing').then(m => ({ default: m.Landing })))
// VehicleInfo removed — all info now in Diagnostics overview tab
const KnowledgeBase = lazyWithRetry(() => import('./pages/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })))
const ErrorCodes = lazyWithRetry(() => import('./pages/ErrorCodes').then(m => ({ default: m.ErrorCodes })))
const Diagnostics = lazyWithRetry(() => import('./pages/Diagnostics').then(m => ({ default: m.Diagnostics })))
const Trips = lazyWithRetry(() => import('./pages/Trips').then(m => ({ default: m.Trips })))
const Resources = lazyWithRetry(() => import('./pages/Resources').then(m => ({ default: m.Resources })))
const Pricing = lazyWithRetry(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })))
const NebulaDemo = lazyWithRetry(() => import('./pages/NebulaDemo').then(m => ({ default: m.NebulaDemo })))
const UnderwaterDemo = lazyWithRetry(() => import('./pages/UnderwaterDemo').then(m => ({ default: m.UnderwaterDemo })))
const DiagUnderwaterFullDemo = lazyWithRetry(() => import('./pages/DiagUnderwaterFullDemo').then(m => ({ default: m.DiagUnderwaterFullDemo })))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <GlassPanel style={{ padding: '32px 48px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--f-display)',
          fontSize: 14,
          letterSpacing: '0.15em',
          color: 'var(--c-champagne)',
          textShadow: '0 0 14px rgba(230,212,168,0.55)',
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

  const location = useLocation()
  const navigate = useNavigate()

  // /welcome — всегда показывает Landing, даже если профиль уже сохранён
  if (location.pathname === '/welcome') {
    return (
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <Landing />
        </Suspense>
      </ThemeProvider>
    )
  }

  // Изолированные demo-роуты — минуют лэндинг и MainLayout
  if (location.pathname === '/nebula-demo') {
    return (
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <NebulaDemo />
        </Suspense>
      </ThemeProvider>
    )
  }
  if (location.pathname === '/underwater-demo') {
    return (
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <UnderwaterDemo />
        </Suspense>
      </ThemeProvider>
    )
  }
  if (location.pathname === '/diag-underwater-full') {
    return (
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <DiagUnderwaterFullDemo />
        </Suspense>
      </ThemeProvider>
    )
  }

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
              <Route path="/" element={<Diagnostics />} />
              <Route path="/diagnostics" element={<Diagnostics />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/kb" element={<KnowledgeBase />} />
              <Route path="/dtc" element={<ErrorCodes />} />
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
      {/* Connection wizard modal — открывается с сайдбара, /welcome и /pricing */}
      {showConnectionWizard && (
        <ConnectionWizard
          asModal
          onComplete={() => {
            closeConnectionWizard()
            // Если юзер стартовал онбординг с /pricing — после завершения сразу на диагностику.
            if (location.pathname === '/pricing') {
              navigate('/')
            }
          }}
        />
      )}
    </ThemeProvider>
  )
}

export default App
