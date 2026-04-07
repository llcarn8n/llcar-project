import { useMemo } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

export interface AccelSample {
  x_std: number
  y_std: number
  z_std: number
  ts: string
}

interface AccelBarsProps {
  data: AccelSample[]
}

const AXES = [
  { key: 'x_std' as const, label: 'Боковая', sublabel: 'X', color: '#ef4444' },
  { key: 'y_std' as const, label: 'Продольная', sublabel: 'Y', color: '#4ade80' },
  { key: 'z_std' as const, label: 'Вертикальная', sublabel: 'Z', color: '#60a5fa' },
]

const ZONES = [
  { max: 2, label: 'Норма', color: theme.status.ok, bg: 'rgba(0,230,118,0.12)' },
  { max: 5, label: 'Повышенная', color: theme.status.warning, bg: 'rgba(255,184,0,0.12)' },
  { max: Infinity, label: 'Высокая', color: theme.status.critical, bg: 'rgba(255,23,68,0.12)' },
]

function getZone(val: number) {
  for (const z of ZONES) {
    if (val < z.max) return z
  }
  return ZONES[2]
}

function getSigmaLabel(total: number): { text: string; color: string } {
  if (total < 3) return { text: 'НОРМА', color: theme.status.ok }
  if (total < 8) return { text: 'ПОВЫШЕННАЯ', color: theme.status.warning }
  return { text: 'ВЫСОКАЯ', color: theme.status.critical }
}

export function AccelBars({ data }: AccelBarsProps) {
  const latest = data.length > 0 ? data[data.length - 1] : null

  const { values, totalVib, sigma } = useMemo(() => {
    if (!latest) return { values: [0, 0, 0], totalVib: 0, sigma: getSigmaLabel(0) }
    const vals = [latest.x_std, latest.y_std, latest.z_std]
    const total = Math.sqrt(vals[0] ** 2 + vals[1] ** 2 + vals[2] ** 2)
    return { values: vals, totalVib: total, sigma: getSigmaLabel(total) }
  }, [latest])

  // Max for bar scaling — at least 10, capped at data max * 1.3
  const maxVal = useMemo(() => {
    const m = Math.max(...values, 5)
    return Math.max(m * 1.3, 10)
  }, [values])

  const isEmpty = !latest

  return (
    <GlassPanel className="relative" style={{ minHeight: 280 }}>
      <div className="hud-header mb-4">Акселерометр</div>

      {/* Point count */}
      <div className="absolute top-3 right-3">
        <span className="text-[10px] font-mono" style={{ color: theme.text.muted }}>
          {data.length} точек
        </span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center" style={{ height: 200, color: theme.text.muted, fontSize: 12 }}>
          Нет данных акселерометра
        </div>
      ) : (
        <>
          {/* Sigma total */}
          <div className="flex items-center gap-3 mb-5 px-1">
            <span className="font-mono text-2xl" style={{
              color: sigma.color,
              textShadow: `0 0 10px ${sigma.color}88`,
            }}>
              Σ {totalVib.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: theme.text.muted }}>м/с²</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{
              color: sigma.color,
              background: `${sigma.color}18`,
              border: `1px solid ${sigma.color}33`,
              letterSpacing: '0.1em',
            }}>
              {sigma.text}
            </span>
          </div>

          {/* Axis bars */}
          <div className="space-y-4 px-1">
            {AXES.map((axis, i) => {
              const val = values[i]
              const zone = getZone(val)
              const pct = Math.min((val / maxVal) * 100, 100)

              return (
                <div key={axis.key}>
                  {/* Label row */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1 rounded" style={{
                        color: axis.color,
                        background: `${axis.color}15`,
                      }}>
                        {axis.sublabel}
                      </span>
                      <span className="text-xs" style={{ color: theme.text.secondary }}>
                        {axis.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold" style={{ color: zone.color }}>
                        {val.toFixed(1)}
                      </span>
                      <span className="text-[9px]" style={{ color: theme.text.muted }}>м/с²</span>
                    </div>
                  </div>

                  {/* Bar with zone background */}
                  <div className="relative h-5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {/* Zone indicators */}
                    <div className="absolute inset-0 flex">
                      <div style={{ width: `${(2 / maxVal) * 100}%`, background: 'rgba(0,230,118,0.06)', borderRight: '1px solid rgba(0,230,118,0.2)' }} />
                      <div style={{ width: `${((5 - 2) / maxVal) * 100}%`, background: 'rgba(255,184,0,0.04)', borderRight: '1px solid rgba(255,184,0,0.2)' }} />
                      <div style={{ flex: 1, background: 'rgba(255,23,68,0.03)' }} />
                    </div>

                    {/* Fill bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${zone.color}44, ${zone.color}88)`,
                        boxShadow: `0 0 8px ${zone.color}44`,
                      }}
                    />

                    {/* Zone labels inside bar */}
                    <div className="absolute inset-0 flex items-center px-1">
                      <span className="text-[8px] font-mono" style={{
                        position: 'absolute',
                        left: `${Math.min((2 / maxVal) * 100, 95)}%`,
                        transform: 'translateX(-100%)',
                        color: 'rgba(0,230,118,0.4)',
                        paddingRight: 2,
                      }}>2</span>
                      <span className="text-[8px] font-mono" style={{
                        position: 'absolute',
                        left: `${Math.min((5 / maxVal) * 100, 95)}%`,
                        transform: 'translateX(-100%)',
                        color: 'rgba(255,184,0,0.4)',
                        paddingRight: 2,
                      }}>5</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 px-1">
            {ZONES.filter(z => z.max < Infinity).map(z => (
              <div key={z.label} className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: z.color, opacity: 0.6 }} />
                <span className="text-[9px]" style={{ color: theme.text.muted }}>
                  {'<'}{z.max} {z.label.toLowerCase()}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: theme.status.critical, opacity: 0.6 }} />
              <span className="text-[9px]" style={{ color: theme.text.muted }}>
                {'>'}5 высокая
              </span>
            </div>
          </div>

          {/* Hint */}
          <div className="mt-3 text-[9px] px-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            STD вибрации по осям. Стоянка: 0.3-1.0 | Езда: 2-5 | Тряска: {'>'}5
          </div>
        </>
      )}
    </GlassPanel>
  )
}
