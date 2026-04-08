import type { ReactNode } from 'react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useApiData } from '../hooks/useApiData'
import { SidebarContent } from '../components/sidebar/SidebarContent'
import { theme } from '../theme'

const tabs = [
  { id: 'dashboard' as const, label: 'Обзор', icon: '\u25C8' },
  { id: 'diagnostics' as const, label: 'Диагностика', icon: '\u2B21' },
  { id: 'trips' as const, label: 'Поездки', icon: '\u25C7' },
]

export function MainLayout({ children }: { children: ReactNode }) {
  const { activeTab, setTab, sidebarOpen, toggleSidebar, clientHash, timeRange, isDarkMode, toggleTheme } = useDashboardStore()

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
          position: 'absolute', top: '20%', left: '20%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-cyan, rgba(0,229,255,0.2)) 0%, transparent 70%)',
          opacity: 0.2,
          filter: 'blur(60px)', animation: 'breathe1 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '15%', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--status-critical, rgba(255,23,68,0.12)) 0%, transparent 70%)',
          opacity: 0.12,
          filter: 'blur(60px)', animation: 'breathe2 18s ease-in-out infinite',
        }} />
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
                <path className="pulse-path" style={{ '--pulse-color': '#00E676' } as React.CSSProperties}
                  d="M0,16 L20,16 L25,16 L30,4 L35,28 L40,10 L45,22 L50,16 L70,16 L80,16 L85,16 L90,4 L95,28 L100,10 L105,22 L110,16 L130,16 L140,16 L145,16 L150,4 L155,28 L160,10 L165,22 L170,16 L190,16 L200,16 L205,16 L210,4 L215,28 L220,10 L225,22 L230,16 L250,16 L260,16 L265,16 L270,4 L275,28 L280,10 L285,22 L290,16 L320,16"
                />
              </svg>
            </div>
          </div>
        </div>

        <nav className="flex gap-1 flex-shrink min-w-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`nav-btn ${activeTab === t.id ? 'active' : ''}`}
            >
              <span className="mr-1">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
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
            <span
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                color: theme.accent.teal,
                backgroundColor: 'rgba(100,255,218,0.08)',
                padding: '2px 6px',
                borderRadius: 4,
                letterSpacing: '0.1em',
              }}
            >
              {clientHash.slice(0, 6)}
            </span>
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
        </aside>
      )}
    </div>
  )
}
