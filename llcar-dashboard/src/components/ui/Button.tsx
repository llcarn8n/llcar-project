import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './ui.css'

type Variant = 'primary' | 'ghost' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <button
      className={`lumen-btn lumen-btn--${variant} lumen-btn--${size} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
