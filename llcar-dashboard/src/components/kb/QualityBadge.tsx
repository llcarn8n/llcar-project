import { theme } from '../../theme'

interface QualityBadgeProps {
  qaLength?: number
  dtcCount?: number
  solutionsCount?: number
  hasFullArticle?: boolean
  size?: 'sm' | 'md'
}

type Quality = 'high' | 'medium' | 'low'

function computeQuality({
  qaLength = 0,
  dtcCount = 0,
  solutionsCount = 0,
  hasFullArticle = false,
}: QualityBadgeProps): Quality {
  if (hasFullArticle) return 'high'
  if (qaLength >= 500 && dtcCount >= 3 && solutionsCount >= 3) return 'high'
  if (qaLength >= 300) return 'medium'
  return 'low'
}

const STYLES: Record<Quality, { color: string; bg: string; label: string; icon: string }> = {
  high: {
    color: theme.status.ok,
    bg: `${theme.status.ok}15`,
    label: 'ПОЛНАЯ',
    icon: '\u25C9',
  },
  medium: {
    color: theme.status.warning,
    bg: `${theme.status.warning}15`,
    label: 'БАЗА',
    icon: '\u25CE',
  },
  low: {
    color: theme.status.critical,
    bg: `${theme.status.critical}15`,
    label: 'КРАТКО',
    icon: '\u25CB',
  },
}

export function QualityBadge(props: QualityBadgeProps) {
  const quality = computeQuality(props)
  const style = STYLES[quality]
  const size = props.size ?? 'sm'
  const fontSize = size === 'md' ? 11 : 9
  const padding = size === 'md' ? '3px 8px' : '2px 6px'

  return (
    <span
      title={`qa=${props.qaLength ?? 0}ch · dtc=${props.dtcCount ?? 0} · solutions=${props.solutionsCount ?? 0}${props.hasFullArticle ? ' · full article' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: "'Orbitron', sans-serif",
        fontSize,
        fontWeight: 700,
        color: style.color,
        padding,
        borderRadius: 3,
        background: style.bg,
        border: `1px solid ${style.color}40`,
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}
    >
      <span aria-hidden style={{ filter: `drop-shadow(0 0 3px ${style.color}80)` }}>
        {style.icon}
      </span>
      {style.label}
    </span>
  )
}
