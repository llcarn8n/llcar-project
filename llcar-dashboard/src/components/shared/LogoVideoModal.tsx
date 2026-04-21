import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function LogoVideoModal({ open, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Try to autoplay when opened
    const v = videoRef.current
    if (v) {
      v.currentTime = 0
      v.play().catch(() => {})
    }
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="LLCAR logo reveal"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background:
          'radial-gradient(circle at 50% 50%, rgba(255,188,110,0.22) 0%, rgba(230,160,80,0.12) 25%, rgba(18,12,6,0.92) 65%, rgba(5,6,12,0.95) 100%)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.25s ease',
        cursor: 'zoom-out',
      }}
    >
      {/* Warm champagne halo behind video — soft glow внутри модалки. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 'min(82vw, 860px)',
          height: 'min(82vw, 860px)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,210,140,0.38) 0%, rgba(240,170,80,0.18) 40%, rgba(180,90,30,0.05) 70%, transparent 100%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <video
        ref={videoRef}
        src={`${import.meta.env.BASE_URL}logo-intro.mp4`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 'min(90vw, 760px)',
          maxHeight: '85vh',
          borderRadius: 12,
          boxShadow: '0 0 120px rgba(255,188,110,0.35), 0 0 60px rgba(230,212,168,0.25), 0 30px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(230,212,168,0.4)',
          cursor: 'default',
        }}
      />
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        aria-label="Закрыть"
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(10,11,22,0.8)',
          border: '1px solid rgba(230,212,168,0.35)',
          color: 'var(--c-champagne, #E6D4A8)',
          fontSize: 20,
          fontFamily: 'var(--f-display), sans-serif',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(230,212,168,0.2)',
        }}
      >
        ×
      </button>
    </div>
  )
}
