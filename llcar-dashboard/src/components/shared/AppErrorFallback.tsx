import { useState } from 'react'

interface Props {
  error?: Error | null
}

export function AppErrorFallback({ error }: Props) {
  const [hardReloading, setHardReloading] = useState(false)

  const handleReload = () => {
    setHardReloading(true)
    try {
      sessionStorage.removeItem('chunk-retry')
    } catch {}
    const bust = Date.now()
    const href = window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + '_=' + bust
    window.location.replace(href)
  }

  const handleReset = () => {
    try {
      localStorage.removeItem('llcar-vehicle-profile')
      localStorage.removeItem('llcar-onboarding-v3-done')
      sessionStorage.clear()
    } catch {}
    window.location.replace(window.location.pathname)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#07080F',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          padding: '28px 28px 24px',
          border: '1px solid rgba(224,107,107,0.35)',
          background: 'rgba(14,16,30,0.85)',
          borderRadius: 8,
          fontFamily: 'var(--f-body), system-ui, sans-serif',
          color: 'rgba(239,242,247,0.9)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: '0.18em', color: '#E06B6B', marginBottom: 14, textTransform: 'uppercase' }}>
          Произошла ошибка
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 18, opacity: 0.85 }}>
          Интерфейс не смог загрузиться. Обычно помогает перезагрузка страницы — возможно, обновилась версия приложения.
        </div>
        {error?.message && (
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--f-mono), monospace',
              opacity: 0.5,
              marginBottom: 18,
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 4,
              wordBreak: 'break-word',
              textAlign: 'left',
            }}
          >
            {error.message}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleReload}
            disabled={hardReloading}
            style={{
              padding: '10px 20px',
              fontFamily: 'var(--f-display), system-ui, sans-serif',
              fontSize: 12,
              letterSpacing: '0.14em',
              color: 'var(--c-champagne, #E6D4A8)',
              background: 'rgba(230,212,168,0.1)',
              border: '1px solid rgba(230,212,168,0.4)',
              borderRadius: 4,
              cursor: hardReloading ? 'wait' : 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {hardReloading ? 'Перезагрузка…' : 'Перезагрузить'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              fontFamily: 'var(--f-display), system-ui, sans-serif',
              fontSize: 12,
              letterSpacing: '0.14em',
              color: 'rgba(239,242,247,0.7)',
              background: 'transparent',
              border: '1px solid rgba(239,242,247,0.2)',
              borderRadius: 4,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Сбросить и начать заново
          </button>
        </div>
      </div>
    </div>
  )
}
