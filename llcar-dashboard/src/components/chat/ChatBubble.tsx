import { useState } from 'react'
import { ChatPanel } from './ChatPanel'

export function ChatBubble() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating bubble-кнопка в правом нижнем углу */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Закрыть чат с диагностом' : 'Открыть чат с диагностом'}
        title={open ? 'Закрыть чат' : 'Спросить у AI-диагноста'}
        style={{
          position: 'fixed',
          bottom: 18,
          right: 18,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(230,212,168,0.10)',
          border: '1px solid rgba(230,212,168,0.35)',
          color: 'var(--c-champagne)',
          fontSize: 24,
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 20px rgba(230,212,168,0.25)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(230,212,168,0.18)'
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5), 0 0 30px rgba(230,212,168,0.45)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(230,212,168,0.10)'
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5), 0 0 20px rgba(230,212,168,0.25)'
        }}
      >
        {open ? '\u00D7' : '\u{1F4AC}'}
      </button>

      {/* Popup-панель с ChatPanel */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 98,
              background: 'rgba(5,5,5,0.35)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 88,
              right: 18,
              width: 'min(420px, calc(100vw - 36px))',
              maxHeight: 'min(70vh, 560px)',
              overflowY: 'auto',
              zIndex: 99,
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
            }}
          >
            <ChatPanel />
          </div>
        </>
      )}
    </>
  )
}
