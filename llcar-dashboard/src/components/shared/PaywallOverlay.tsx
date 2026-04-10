import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHasAccess } from '../../stores/dashboardStore'
import { trackEvent } from '../../utils/analytics'
import { theme } from '../../theme'

interface PaywallOverlayProps {
  children: React.ReactNode
  feature: string
  blurIntensity?: number
  ctaText?: string
  compact?: boolean
}

export function PaywallOverlay({
  children,
  feature,
  blurIntensity = 6,
  ctaText = 'Разблокировать за 349 руб.',
  compact = false,
}: PaywallOverlayProps) {
  const hasAccess = useHasAccess()
  const navigate = useNavigate()
  const trackedRef = useRef(false)

  useEffect(() => {
    if (!hasAccess && !trackedRef.current) {
      trackedRef.current = true
      trackEvent('paywall_shown', { feature })
    }
  }, [hasAccess, feature])

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred content */}
      <div
        style={{
          filter: `blur(${blurIntensity}px)`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: compact ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? 12 : 16,
          background: 'rgba(12,18,32,0.7)',
          borderRadius: 8,
          zIndex: 10,
          padding: compact ? '8px 16px' : '24px 16px',
        }}
      >
        {/* Lock icon */}
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: compact ? 14 : 18,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: theme.accent.cyan,
            textShadow: `0 0 12px rgba(0,229,255,0.5)`,
            textAlign: 'center',
          }}
        >
          {compact ? '\u{1F512}' : '\u{1F512} PREMIUM'}
        </div>

        {/* CTA button */}
        <button
          onClick={() => {
            trackEvent('paywall_cta_click', { feature })
            navigate('/pricing')
          }}
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: compact ? 10 : 12,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#0C1220',
            background: 'linear-gradient(135deg, #00E5FF, #00E5FF)',
            border: 'none',
            borderRadius: 6,
            padding: compact ? '6px 14px' : '10px 24px',
            cursor: 'pointer',
            boxShadow: '0 0 16px rgba(0,229,255,0.3)',
            transition: 'all 0.3s',
            whiteSpace: 'nowrap',
          }}
        >
          {ctaText}
        </button>

        {/* Link to pricing */}
        {!compact && (
          <button
            onClick={() => navigate('/pricing')}
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              color: theme.text.secondary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              opacity: 0.7,
              transition: 'opacity 0.3s',
            }}
          >
            Подробнее о тарифах
          </button>
        )}
      </div>
    </div>
  )
}
