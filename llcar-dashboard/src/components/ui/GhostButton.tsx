import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react'

type Variant = 'pill' | 'rect'
type Size = 'sm' | 'md' | 'lg'
type Tone = 'default' | 'aerospace'

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  variant?: Variant
  size?: Size
  tone?: Tone
  children: ReactNode
}

export function GhostButton({
  active = false,
  variant = 'rect',
  size = 'md',
  tone = 'default',
  children,
  style,
  ...rest
}: GhostButtonProps) {
  if (tone === 'aerospace') {
    const pad = size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 28px' : '12px 22px'
    const fs = size === 'sm' ? 11 : size === 'lg' ? 14 : 13
    const aero: CSSProperties = {
      background: active ? 'rgba(239,242,247,0.18)' : 'rgba(239,242,247,0.08)',
      border: '1px solid rgba(239,242,247,0.32)',
      color: 'var(--c-spectral)',
      padding: pad,
      borderRadius: 32,
      fontFamily: 'var(--f-display)',
      fontSize: fs,
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '1.17px',
      textTransform: 'uppercase',
      cursor: 'pointer',
      transition: 'all 220ms var(--ease-hud)',
      boxShadow: active ? '0 0 18px rgba(239,242,247,0.15)' : 'none',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      ...style,
    }
    return (
      <button
        data-ghost-tone="aerospace"
        data-active={active ? 'true' : 'false'}
        {...rest}
        style={aero}
      >
        {children}
      </button>
    )
  }

  const pad = size === 'sm' ? '6px 12px' : '10px 16px'
  const fs = size === 'sm' ? 10 : 12

  return (
    <button
      data-active={active ? 'true' : 'false'}
      {...rest}
      style={{
        background: active ? 'var(--c-indigo)' : 'transparent',
        border: `1px solid ${active ? 'var(--c-indigo)' : 'var(--c-spectral-ghost)'}`,
        color: active ? 'var(--c-spectral)' : 'var(--c-spectral-muted)',
        padding: pad,
        borderRadius: variant === 'pill' ? 'var(--r-pill)' : 'var(--r-btn)',
        fontFamily: 'var(--f-body)',
        fontSize: fs,
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 200ms var(--ease-hud)',
        boxShadow: active ? '0 0 20px var(--c-indigo-glow)' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
