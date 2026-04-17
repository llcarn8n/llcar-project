import type { CSSProperties, ReactNode } from 'react'

type Corner = 'tr' | 'tl' | 'br' | 'bl'

interface NebulaPanelProps {
  warmHalo?: Corner
  coolHalo?: Corner
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

const cornerToPos: Record<Corner, string> = {
  tr: '82% 18%',
  tl: '18% 18%',
  br: '82% 82%',
  bl: '18% 82%',
}

export function NebulaPanel({
  warmHalo,
  coolHalo,
  className,
  style,
  children,
}: NebulaPanelProps) {
  const layers: string[] = []
  if (warmHalo) {
    layers.push(
      `radial-gradient(circle at ${cornerToPos[warmHalo]}, rgba(232,184,112,0.12) 0%, transparent 55%)`
    )
  }
  if (coolHalo) {
    layers.push(
      `radial-gradient(circle at ${cornerToPos[coolHalo]}, rgba(106,139,174,0.15) 0%, transparent 55%)`
    )
  }
  layers.push('var(--bg-nebula-panel)')
  layers.push('var(--c-void)')

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: layers.join(', '),
        borderRadius: 'var(--r-tile)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </div>
  )
}
