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
        background: 'rgba(5,6,12,0.88)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.25s ease',
        cursor: 'zoom-out',
      }}
    >
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
          maxWidth: 'min(90vw, 760px)',
          maxHeight: '85vh',
          borderRadius: 12,
          boxShadow: '0 0 80px rgba(230,212,168,0.25), 0 30px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(230,212,168,0.35)',
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
