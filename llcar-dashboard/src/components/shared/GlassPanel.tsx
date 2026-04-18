import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export function GlassPanel({ children, className = '', onClick, style }: Props) {
  return (
    <div
      className={`glass-panel p-4 ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  )
}
