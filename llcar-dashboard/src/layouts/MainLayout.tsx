import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../stores/dashboardStore'
import { useApiData } from '../hooks/useApiData'
import { SidebarContent } from '../components/sidebar/SidebarContent'
import { theme } from '../theme'

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
  const { sidebarOpen, toggleSidebar, clientHash, setClient, timeRange, isDarkMode, toggleTheme, vehicleProfile, openVehicleSetup, openConnectionWizard, resetVehicle } = useDashboardStore()

  const { data: recentData } = useApiData<any[]>({
    endpoint: '/api/data/',
    params: { client: clientHash, minutes: 5, limit: 1 },
    refreshInterval: 60_000,
  })

  const isOnline = Array.isArray(recentData) && recentData.length > 0

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Breathing background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '15%', left: '10%', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 60%)',
          filter: 'blur(80px)', animation: 'breathe1 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '5%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.06) 0%, transparent 60%)',
          filter: 'blur(70px)', animation: 'breathe2 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '60%', left: '60%', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.05) 0%, transparent 60%)',
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
      <header className="flex flex-wrap items-center justify-between px-3 md:px-6 py-2 md:py-3 border-b border-white/5 gap-1">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 md:gap-3">
              <img
                src={`${import.meta.env.BASE_URL}llcar-logo.png`}
                alt="LLCAR"
                className="h-8 w-8 md:h-10 md:w-10 logo-pulse"
                style={{
                  filter: 'brightness(2.0) drop-shadow(0 0 10px rgba(0,229,255,0.8)) drop-shadow(0 0 20px rgba(0,229,255,0.5))',
                }}
              />
              <span className="logo-text text-base md:text-lg tracking-widest">
                LLCAR<span style={{ opacity: 0.25, marginLeft: -2 }}>E</span>
              </span>
              <span className="text-xs text-white/20 font-mono hidden lg:inline" style={{ letterSpacing: '0.2em' }}>LONG LIFE CAR</span>
            </div>
            {/* EKG pulse — UNDER logo */}
            <div className="header-pulse hidden md:block" style={{ marginTop: -4, marginLeft: 2 }}>
              <svg viewBox="0 0 320 32" className="header-pulse-svg">
                <path className="pulse-path" style={{ '--pulse-color': '#00E5FF' } as React.CSSProperties}
                  d="M0,16 L20,16 L25,16 L30,4 L35,28 L40,10 L45,22 L50,16 L70,16 L80,16 L85,16 L90,4 L95,28 L100,10 L105,22 L110,16 L130,16 L140,16 L145,16 L150,4 L155,28 L160,10 L165,22 L170,16 L190,16 L200,16 L205,16 L210,4 L215,28 L220,10 L225,22 L230,16 L250,16 L260,16 L265,16 L270,4 L275,28 L280,10 L285,22 L290,16 L320,16"
                />
              </svg>
            </div>
          </div>
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

        <div className="flex items-center gap-2 md:gap-4">
          {/* Change vehicle button */}
          {vehicleProfile && (
            <button
              onClick={() => { resetVehicle(); navigate('/') }}
              style={{
                padding: '4px 10px',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: theme.accent.orange,
                background: 'rgba(255,140,0,0.08)',
                border: '1px solid rgba(255,140,0,0.25)',
                borderRadius: 4,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
              }}
              title="Сменить автомобиль"
            >
              {vehicleProfile.brand} {vehicleProfile.model} ✕
            </button>
          )}
          {/* Connection status + vehicle badge — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3" style={{ opacity: 0.6 }}>
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isOnline ? theme.status.ok : theme.text.muted,
                  display: 'inline-block',
                  boxShadow: isOnline ? `0 0 6px ${theme.status.ok}` : 'none',
                  animation: isOnline ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                }}
              />
              <span style={{ fontSize: 10, color: theme.text.secondary, letterSpacing: '0.05em' }}>
                {isOnline ? 'Онлайн' : 'Офлайн'}
              </span>
            </div>
            <select
              value={clientHash}
              onChange={(e) => setClient(e.target.value)}
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                color: theme.accent.teal,
                backgroundColor: 'rgba(6,15,25,0.9)',
                padding: '2px 6px',
                borderRadius: 4,
                letterSpacing: '0.05em',
                border: '1px solid rgba(0,229,255,0.2)',
                cursor: 'pointer',
                outline: 'none',
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

          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? '\u2600' : '\u263E'}
          </button>

          <button
            onClick={toggleSidebar}
            className={`font-mono text-xl px-3 py-2 min-w-[44px] min-h-[44px] flex items-center justify-center ${isDarkMode ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {sidebarOpen ? '\u2715' : '\u2630'}
          </button>
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
          className="fixed top-0 right-0 h-full w-[85vw] md:w-80 glass-panel border-l border-cyan-500/10 z-50 p-4 md:p-6 overflow-y-auto"
          style={{ position: 'fixed', borderRadius: 0, backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', background: 'rgba(5,10,15,0.95)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <span className="font-mono text-sm uppercase tracking-wider" style={{ color: theme.accent.cyan }}>
              {'\u041F\u0430\u043D\u0435\u043B\u0438'}
            </span>
            <button onClick={toggleSidebar} className="text-white/40 hover:text-white text-lg">{'\u2715'}</button>
          </div>
          <SidebarContent clientHash={clientHash} timeRange={timeRange} />

          {/* Vehicle profile edit button */}
          {vehicleProfile && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,229,255,0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => { openVehicleSetup(); toggleSidebar(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: 'rgba(0,229,255,0.04)',
                  border: '1px solid rgba(0,229,255,0.12)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Rajdhani', sans-serif",
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
                  background: 'rgba(0,229,255,0.04)',
                  border: '1px solid rgba(0,229,255,0.12)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Rajdhani', sans-serif",
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
