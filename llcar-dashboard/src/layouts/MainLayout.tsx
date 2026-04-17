import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../stores/dashboardStore'
import { SidebarContent } from '../components/sidebar/SidebarContent'
import { Logo } from '../components/Logo'

const tabs = [
  { path: '/', label: 'Диагностика', icon: '\u2B21' },
  { path: '/kb', label: 'База знаний', icon: '\u{1F4DA}' },
  { path: '/dtc', label: 'Ошибки', icon: '\u26A0' },
  { path: '/resources', label: 'Ресурсы', icon: '\u{1F517}' },
  { path: '/pricing', label: 'Тарифы', icon: '\u{1F48E}' },
]

export function MainLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar, clientHash, setClient, timeRange, vehicleProfile, openVehicleSetup, openConnectionWizard } = useDashboardStore()

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Breathing background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '15%', left: '10%', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,159,28,0.10) 0%, transparent 60%)',
          filter: 'blur(80px)', animation: 'breathe1 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '5%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,158,255,0.08) 0%, transparent 60%)',
          filter: 'blur(70px)', animation: 'breathe2 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '60%', left: '60%', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,159,28,0.05) 0%, transparent 60%)',
          filter: 'blur(60px)', animation: 'breathe1 22s ease-in-out infinite reverse',
        }} />
      </div>
      {/* Floating particles */}
      <div className="particles-container">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${(i * 10) + Math.random() * 5}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${18 + i * 2}s`,
          }} />
        ))}
      </div>
      {/* Header */}
      <header
        className="flex flex-wrap items-center justify-between px-3 md:px-6 py-2 md:py-3 gap-1"
        style={{ borderBottom: '1px solid var(--border-frost)' }}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <Logo size="md" showWordmark withOrbit subtitle="LONG LIFE CAR" />
        </div>

        <nav className="flex gap-1 flex-shrink min-w-0 overflow-x-auto">
          {tabs.map(t => {
            const isActive = location.pathname === t.path || (t.path === '/' && location.pathname === '/diagnostics')
            return (
              <button
                key={t.path}
                onClick={() => navigate(t.path)}
                className={`nav-btn ${isActive ? 'active' : ''}`}
              >
                <span className="mr-1">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex items-end gap-5 self-end" style={{ marginBottom: -6 }}>
          <div className="hidden md:flex" style={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 4,
          }}>
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--f-body)',
              fontWeight: 600,
              color: '#C8B48E',
              textTransform: 'uppercase',
              letterSpacing: '0.24em',
              lineHeight: 1,
              textShadow: '0 0 6px rgba(200,180,142,0.25)',
            }}>КЛИЕНТ</span>
            <select
              value={clientHash}
              onChange={(e) => setClient(e.target.value)}
              style={{
                fontSize: 13,
                fontFamily: 'var(--f-mono)',
                fontWeight: 600,
                color: 'var(--c-spectral)',
                background: 'transparent',
                border: 'none',
                padding: 0,
                letterSpacing: '0.08em',
                lineHeight: 1,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            >
              <option value="">Все клиенты</option>
              <option value="b5f2f64851802f4859a3ffe3eda4b2d5">b5f2f6 (свежий)</option>
              <option value="362f5a4a5f95127723509e28c392850f">362f5a</option>
              <option value="1bba31ec949a958d87c46c41ef765c7e">1bba31</option>
              <option value="5ce91d1aa578ca17f22c0c2afc009abc">5ce91d</option>
              <option value="b79831a1b4c80fc7549998661e820bef">b79831</option>
            </select>
          </div>
        </div>
      </header>

      {/* EKG Pulse — compact, next to header border */}

      {/* Content */}
      <main className="p-4 relative">
        {children}
        <div className="grid-floor" />
      </main>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside
          className="fixed top-0 right-0 h-full w-[85vw] md:w-80 glass-panel z-50 p-4 md:p-6 overflow-y-auto"
          style={{
            position: 'fixed',
            borderRadius: 0,
            borderLeft: '1px solid var(--border-frost)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            background: 'rgba(5,10,15,0.95)',
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <span
              style={{
                fontFamily: 'var(--f-body)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--c-amber)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {'\u041F\u0430\u043D\u0435\u043B\u0438'}
            </span>
            <button onClick={toggleSidebar} className="text-white/40 hover:text-white text-lg">{'\u2715'}</button>
          </div>
          <SidebarContent clientHash={clientHash} timeRange={timeRange} />

          {/* Vehicle profile edit button */}
          {vehicleProfile && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-frost)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => { openVehicleSetup(); toggleSidebar(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: 'rgba(59,158,255,0.05)',
                  border: '1px solid var(--border-frost)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: 'var(--f-body)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16, opacity: 0.6 }}>{'\u2699'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    {vehicleProfile.brand} {vehicleProfile.model} {vehicleProfile.year}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {'\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0430\u0432\u0442\u043E'}
                  </div>
                </div>
              </button>
              <button
                onClick={() => { openConnectionWizard(); toggleSidebar(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: 'rgba(59,158,255,0.05)',
                  border: '1px solid var(--border-frost)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: 'var(--f-body)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16, opacity: 0.6 }}>{'\u{1F50C}'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    {'\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 OBD-II'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {'\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F'}
                  </div>
                </div>
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}
