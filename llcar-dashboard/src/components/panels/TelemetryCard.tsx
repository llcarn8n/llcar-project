import { theme } from '../../theme'

interface TelemetryCardProps {
  label: string
  value: number | string
  unit: string
  severity?: number // 0-1
  type?: 'gauge' | 'bar' | 'simple'
  max?: number
  sparkData?: number[]
}

export function TelemetryCard({ label, value, unit, severity = 0, type = 'simple', max = 100, sparkData }: TelemetryCardProps) {
  const color = severity > 0.7 ? theme.status.critical : severity > 0.3 ? theme.status.warning : theme.accent.cyan
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
  const percentage = Math.min((numValue / max) * 100, 100)

  return (
    <div className="telemetry-card">
      {/* Corner screws */}
      <div className="tel-screw tel-tl" />
      <div className="tel-screw tel-br" />

      {/* Glass reflection */}
      <div className="tel-reflection" />

      {/* Content */}
      <div className="tel-content">
        <div className="tel-label">{label}</div>

        {type === 'gauge' ? (
          <div className="tel-gauge-row">
            <svg viewBox="0 0 120 120" className="tel-gauge-svg">
              <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="48"
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 3.01} 301.6`}
                transform="rotate(-90 60 60)"
                style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.7s ease' }}
              />
              {/* Tick marks */}
              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={i}
                  x1="60" y1="8" x2="60" y2="14"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity={i < Math.floor(percentage / 8.33) ? 0.8 : 0.2}
                  transform={`rotate(${i * 30} 60 60)`}
                />
              ))}
            </svg>
            <div className="tel-gauge-center">
              <span className="tel-value" style={{ color, textShadow: `0 0 10px ${color}, 0 0 20px ${color}80` }}>{value}</span>
              <span className="tel-unit">{unit}</span>
            </div>
          </div>
        ) : type === 'bar' ? (
          <div className="tel-bar-section">
            <span className="tel-value tel-value-large" style={{ color, textShadow: `0 0 10px ${color}, 0 0 20px ${color}80` }}>{value}</span>
            <span className="tel-unit">{unit}</span>
            <div className="tel-bar-track">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="tel-bar-segment"
                  style={{
                    backgroundColor: i < Math.floor(percentage / 6.25) ? color : 'rgba(0,229,255,0.08)',
                    boxShadow: i < Math.floor(percentage / 6.25) ? `0 0 4px ${color}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="tel-simple">
            <span className="tel-value tel-value-large" style={{ color, textShadow: `0 0 10px ${color}, 0 0 20px ${color}80` }}>{value}</span>
            <span className="tel-unit">{unit}</span>
          </div>
        )}

        {/* Mini sparkline */}
        {sparkData && sparkData.length > 2 && (
          <svg viewBox="0 0 100 20" className="tel-sparkline" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              opacity="0.6"
              points={sparkData.map((v, i) => `${(i / (sparkData.length - 1)) * 100},${20 - (v / Math.max(...sparkData)) * 18}`).join(' ')}
            />
          </svg>
        )}
      </div>
    </div>
  )
}
