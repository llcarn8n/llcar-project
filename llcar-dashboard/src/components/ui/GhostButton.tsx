import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'pill' | 'rect'
type Size = 'sm' | 'md'

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function GhostButton({
  active = false,
  variant = 'rect',
  size = 'md',
  children,
  style,
  ...rest
}: GhostButtonProps) {
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
