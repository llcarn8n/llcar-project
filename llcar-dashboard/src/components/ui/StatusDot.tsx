import './ui.css'

type Kind = 'ok' | 'warn' | 'critical' | 'idle'

type Props = {
  kind?: Kind
  pulsing?: boolean
  className?: string
}

export function StatusDot({ kind = 'ok', pulsing = false, className = '' }: Props) {
  return (
    <span
      className={`lumen-dot lumen-dot--${kind} ${pulsing ? 'lumen-dot--pulse' : ''} ${className}`.trim()}
      aria-hidden="true"
    />
  )
}

export default StatusDot
