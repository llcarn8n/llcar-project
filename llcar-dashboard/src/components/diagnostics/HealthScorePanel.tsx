import { theme } from '../../theme'

interface HealthScorePanelProps {
  overall: number
  loading?: boolean
}

function statusText(score: number): string {
  if (score >= 80) return 'НОРМА'
  if (score >= 50) return 'ВНИМАНИЕ'
  return 'КРИТИЧНО'
}

function statusColor(score: number): string {
  if (score >= 80) return theme.status.ok
  if (score >= 50) return theme.status.warning
  return theme.status.critical
}

const SWEEP_DEG = 240
const START_DEG = 150

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polar(cx, cy, r, endDeg)
  const end = polar(cx, cy, r, startDeg)
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function HealthScorePanel({ overall, loading }: HealthScorePanelProps) {
  const color = statusColor(overall)
  const cx = 50
  const cy = 52
  const radius = 40
  const progress = loading ? 0 : Math.min(Math.max(overall, 0) / 100, 1)
  const trackPath = describeArc(cx, cy, radius, START_DEG, START_DEG + SWEEP_DEG)
  const valuePath = describeArc(cx, cy, radius, START_DEG, START_DEG + SWEEP_DEG * progress)
  const gradId = 'hp-grad-amber'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--f-section)', fontSize: '0.58rem', letterSpacing: '0.22em',
        textTransform: 'uppercase' as const, color: 'var(--c-text-muted)',
        marginBottom: 8, fontWeight: 600,
      }}>Здоровье авто</div>

      <svg width="108" height="108" viewBox="0 0 100 100" style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--c-amber-soft)" />
            <stop offset="100%" stopColor="var(--c-amber)" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(214,235,253,0.12)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Value arc */}
        {progress > 0 && (
          <path
            d={valuePath}
            fill="none"
            stroke={overall >= 80 ? `url(#${gradId})` : color}
            strokeWidth="4"
            strokeLinecap="round"
            style={{ transition: 'd 0.8s ease, stroke 0.3s', filter: `drop-shadow(0 0 6px ${color}aa)` }}
          />
        )}

        {/* Number */}
        <text
          x="50" y="54" textAnchor="middle" dominantBaseline="middle"
          style={{
            fontFamily: 'var(--f-display)',
            fontSize: 30,
            fontWeight: 200,
            letterSpacing: '-0.02em',
            fill: 'var(--c-text)',
          }}
        >
          {loading ? '—' : overall}
        </text>
      </svg>

      {/* Status label */}
      <div style={{
        fontFamily: 'var(--f-section)',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.24em',
        textTransform: 'uppercase' as const,
        color,
        marginTop: 4,
        textShadow: `0 0 10px ${color}55`,
      }}>
        {loading ? 'ЗАГРУЗКА' : statusText(overall)}
      </div>

      {/* EKG pulse */}
      <div style={{ margin: '6px 0 0', overflow: 'hidden', height: 14 }}>
        <svg width="100%" height="14" viewBox="0 0 160 14" preserveAspectRatio="none">
          <path d="M0,7 L35,7 L44,2 L48,12 L52,3 L56,11 L60,7 L160,7"
            fill="none" stroke={color} strokeWidth="1" opacity="0.55"
            strokeDasharray="260" strokeDashoffset="0"
            style={{ animation: 'pulse-scroll 2s linear infinite' }} />
        </svg>
      </div>
    </div>
  )
}
