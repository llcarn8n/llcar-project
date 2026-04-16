import type { ReactNode, CSSProperties } from 'react'
import './ui.css'

type Accent = 'amber' | 'blue' | 'none'

type Props = {
  children: ReactNode
  accent?: Accent
  bloom?: boolean
  className?: string
  style?: CSSProperties
  as?: keyof HTMLElementTagNameMap
}

export function Card({ children, accent = 'none', bloom = false, className = '', style, as = 'div' }: Props) {
  const Tag = as as 'div'
  return (
    <Tag
      className={`lumen-card lumen-card--${accent} ${bloom ? 'lumen-card--bloom' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  )
}

export default Card
