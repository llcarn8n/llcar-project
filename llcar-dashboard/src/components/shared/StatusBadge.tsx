import { theme } from '../../theme'

interface Props {
  status: 'ok' | 'warning' | 'critical' | 'unknown' | 'offline'
  label?: string
}

const statusConfig = {
  ok: { color: theme.status.ok, text: 'НОРМА' },
  warning: { color: theme.status.warning, text: 'ВНИМАНИЕ' },
  critical: { color: theme.status.critical, text: 'КРИТИЧНО' },
  unknown: { color: theme.text.muted, text: 'Н/Д' },
  offline: { color: theme.text.muted, text: 'ОФЛАЙН' },
}

export function StatusBadge({ status, label }: Props) {
  const cfg = statusConfig[status]
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider"
      style={{ backgroundColor: cfg.color + '22', color: cfg.color, border: `1px solid ${cfg.color}44`, textShadow: `0 0 8px ${cfg.color}80` }}
    >
      {label || cfg.text}
    </span>
  )
}
