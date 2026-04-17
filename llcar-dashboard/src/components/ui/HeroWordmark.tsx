import type { CSSProperties } from 'react'

interface HeroWordmarkProps {
  size?: number
  text?: string
  style?: CSSProperties
}

export function HeroWordmark({ size = 44, text = 'LLCAR', style }: HeroWordmarkProps) {
  return (
    <span
      className="hero-wordmark"
      style={{
        display: 'inline-block',
        fontFamily: 'var(--f-display)',
        fontSize: size,
        fontWeight: 200,
        letterSpacing: '0.08em',
        lineHeight: 1,
        color: 'var(--c-spectral)',
        backgroundImage:
          'linear-gradient(90deg, rgba(239,242,247,0.4) 0%, rgba(239,242,247,1.0) 50%, rgba(239,242,247,0.4) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 0 20px rgba(239,242,247,0.35))',
        animation: 'wordmark-sweep 8s linear infinite',
        ...style,
      }}
    >
      {text}
      <style>{`
        @keyframes wordmark-sweep {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </span>
  )
}
