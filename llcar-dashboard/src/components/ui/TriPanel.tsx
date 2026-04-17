import type { CSSProperties, ReactNode } from 'react'

interface TriPanelProps {
  left: ReactNode
  center: ReactNode
  right: ReactNode
  leftWidth?: number
  rightWidth?: number
  gap?: number
  className?: string
  style?: CSSProperties
}

export function TriPanel({
  left,
  center,
  right,
  leftWidth = 320,
  rightWidth = 380,
  gap = 0,
  className,
  style,
}: TriPanelProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `${leftWidth}px 1fr ${rightWidth}px`,
        gap,
        width: '100%',
        minHeight: 'calc(100vh - 120px)',
        ...style,
      }}
    >
      <div style={{
        position: 'relative',
        borderRight: '1px solid var(--c-spectral-divider)',
      }}>
        {left}
      </div>
      <div style={{
        position: 'relative',
        borderRight: '1px solid var(--c-spectral-divider)',
      }}>
        {center}
      </div>
      <div style={{ position: 'relative' }}>
        {right}
      </div>
    </div>
  )
}
