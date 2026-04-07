import { useApiData } from '../../hooks/useApiData'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

// ── Types ──

interface EcuRow {
  ts: string
  rpm?: number
  speed?: number
  coolant?: number
  load?: number
  throttle?: number
  fuel?: number
  voltage?: number
  soc?: number
  cell_min?: number
  cell_max?: number
  temp_max?: number
  inlet?: number
  outlet?: number
  fan?: number
  motor_rpm?: number
  motor_torque?: number
  motor_temp?: number
  [key: string]: any
}

interface Alert {
  type: 'info' | 'warning' | 'critical'
  msg: string
}

interface DtcData {
  status: string
  total_packets: number
  codes: string[]
}

interface DiagnosticsResponse {
  ecu: Record<string, EcuRow[]>
  alerts: Alert[]
  dtc: DtcData
  voltage_history: Record<string, number[]>
}

interface SidebarContentProps {
  clientHash: string
  timeRange: number
}

// ── ECU name mapping ──

const ECU_META: Record<string, { name: string; icon: string }> = {
  '7e8': { name: 'ДВС', icon: '\u2699' },
  '7ea': { name: 'Электромотор', icon: '\u26A1' },
  '7eb': { name: 'BMS', icon: '\u2B21' },
  '7ef': { name: 'Охлаждение', icon: '\u2744' },
}

// ── Alert type colors ──

const ALERT_COLORS: Record<string, string> = {
  info: theme.accent.cyan,
  warning: theme.status.warning,
  critical: theme.status.critical,
}

// ── Mini sparkline (SVG) ──

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (!values || values.length < 2) return null

  const w = 100
  const h = 20
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 2) - 1
    return `${x},${y}`
  })

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: 20 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <polygon
        points={`0,${h} ${points.join(' ')} ${w},${h}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      {/* Line */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      {/* Last point dot */}
      <circle
        cx={w}
        cy={parseFloat(points[points.length - 1].split(',')[1])}
        r="2"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}

// ── Key metrics extractor per ECU ──

function getKeyMetrics(ecuId: string, row: EcuRow): Array<{ label: string; value: string }> {
  switch (ecuId) {
    case '7e8':
      return [
        ...(row.rpm != null ? [{ label: 'RPM', value: String(row.rpm) }] : []),
        ...(row.speed != null ? [{ label: 'км/ч', value: String(row.speed) }] : []),
        ...(row.coolant != null ? [{ label: 'Охл.', value: `${row.coolant}\u00B0` }] : []),
      ].slice(0, 3)
    case '7ea':
      return [
        ...(row.motor_rpm != null ? [{ label: 'RPM', value: String(row.motor_rpm) }] : []),
        ...(row.motor_torque != null ? [{ label: 'Nm', value: String(row.motor_torque) }] : []),
        ...(row.motor_temp != null ? [{ label: 'T\u00B0', value: `${row.motor_temp}\u00B0` }] : []),
      ].slice(0, 3)
    case '7eb':
      return [
        ...(row.soc != null ? [{ label: 'SOC', value: `${row.soc}%` }] : []),
        ...(row.voltage != null ? [{ label: 'V', value: `${row.voltage}` }] : []),
        ...(row.cell_min != null && row.cell_max != null
          ? [{ label: '\u0394cell', value: `${(Number(row.cell_max) - Number(row.cell_min)).toFixed(2)}` }]
          : []),
      ].slice(0, 3)
    case '7ef':
      return [
        ...(row.inlet != null ? [{ label: 'Вход', value: `${row.inlet}\u00B0` }] : []),
        ...(row.outlet != null ? [{ label: 'Выход', value: `${row.outlet}\u00B0` }] : []),
        ...(row.fan != null ? [{ label: 'Вент.', value: `${row.fan}%` }] : []),
      ].slice(0, 3)
    default: {
      // Generic: show first numeric values
      const entries = Object.entries(row).filter(
        ([k, v]) => k !== 'ts' && typeof v === 'number'
      )
      return entries.slice(0, 3).map(([k, v]) => ({ label: k, value: String(v) }))
    }
  }
}

// ── Section sub-header ──

function SectionHeader({ text }: { text: string }) {
  return (
    <div
      className="hud-header"
      style={{ marginBottom: 10, fontSize: '0.6rem' }}
    >
      {text}
    </div>
  )
}

// ── Loading skeleton ──

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 60,
            borderRadius: 4,
            background: 'rgba(0,229,255,0.04)',
            animation: 'pulse-critical 2s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )
}

// ── Main sidebar content ──

export function SidebarContent({ clientHash, timeRange }: SidebarContentProps) {
  const { data, loading, error } = useApiData<DiagnosticsResponse>({
    endpoint: '/api/diagnostics/',
    params: { client: clientHash, minutes: timeRange },
    refreshInterval: 30000,
  })

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div
        style={{
          padding: '12px',
          color: theme.status.critical,
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 13,
          border: `1px solid ${theme.status.critical}30`,
          borderRadius: 4,
          background: `${theme.status.critical}08`,
        }}
      >
        Ошибка: {error}
      </div>
    )
  }

  if (!data) return null

  const ecuIds = Object.keys(ECU_META)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── 1. ECU Overview ── */}
      <GlassPanel className="!p-3" style={{ borderRadius: 4 }}>
        <SectionHeader text="МОДУЛИ ECU" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {ecuIds.map((id) => {
            const meta = ECU_META[id]
            const rows = data.ecu?.[id] || []
            const hasData = rows.length > 0
            const latest = hasData ? rows[rows.length - 1] : null
            const metrics = latest ? getKeyMetrics(id, latest) : []

            return (
              <div
                key={id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 3,
                  background: hasData
                    ? 'rgba(0,229,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hasData ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.3s ease',
                }}
              >
                {/* ECU header: name + status dot */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: hasData ? theme.status.ok : theme.text.muted,
                      boxShadow: hasData ? `0 0 6px ${theme.status.ok}` : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: hasData ? theme.text.primary : theme.text.muted,
                      letterSpacing: '0.03em',
                      lineHeight: 1.2,
                    }}
                  >
                    {meta.icon} {meta.name}
                  </span>
                </div>

                {/* ECU ID + data points */}
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 9,
                    color: theme.text.muted,
                    marginBottom: hasData ? 6 : 0,
                    letterSpacing: '0.05em',
                  }}
                >
                  {id.toUpperCase()} {'\u00B7'} {rows.length} pts
                </div>

                {/* Key metrics */}
                {metrics.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
                    {metrics.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                        <span
                          className="metric-value"
                          style={{ fontSize: 13, lineHeight: 1.2 }}
                        >
                          {m.value}
                        </span>
                        <span className="metric-label" style={{ fontSize: 8 }}>
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </GlassPanel>

      {/* ── 2. DTC Codes ── */}
      <GlassPanel className="!p-3" style={{ borderRadius: 4 }}>
        <SectionHeader text="КОДЫ ОШИБОК (DTC)" />

        {data.dtc?.codes?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.dtc.codes.map((code, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 8px',
                  borderRadius: 3,
                  background: `${theme.status.critical}08`,
                  border: `1px solid ${theme.status.critical}25`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: theme.status.critical,
                    boxShadow: `0 0 6px ${theme.status.critical}`,
                    animation: 'pulse-critical 2s infinite',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 12,
                    color: theme.status.critical,
                    letterSpacing: '0.05em',
                  }}
                >
                  {code}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 3,
              background: `${theme.status.ok}12`,
              border: `1px solid ${theme.status.ok}30`,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: theme.status.ok,
                boxShadow: `0 0 6px ${theme.status.ok}`,
              }}
            />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: theme.status.ok,
                letterSpacing: '0.05em',
              }}
            >
              Нет ошибок
            </span>
          </div>
        )}

        {/* Total packets metadata */}
        {data.dtc?.total_packets != null && (
          <div
            style={{
              marginTop: 8,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: theme.text.muted,
              letterSpacing: '0.05em',
            }}
          >
            Обработано пакетов: {data.dtc.total_packets.toLocaleString()}
          </div>
        )}
      </GlassPanel>

      {/* ── 3. Alerts ── */}
      {data.alerts && data.alerts.length > 0 && (
        <GlassPanel className="!p-3" style={{ borderRadius: 4 }}>
          <SectionHeader text="УВЕДОМЛЕНИЯ" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.alerts.map((alert, i) => {
              const color = ALERT_COLORS[alert.type] || theme.text.secondary
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 3,
                    background: `${color}06`,
                    borderLeft: `2px solid ${color}60`,
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: color,
                      boxShadow: `0 0 4px ${color}80`,
                      marginTop: 4,
                      flexShrink: 0,
                      animation: alert.type === 'critical' ? 'pulse-critical 1.5s infinite' : 'none',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 11,
                      color: theme.text.secondary,
                      lineHeight: 1.4,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {alert.msg}
                  </span>
                </div>
              )
            })}
          </div>
        </GlassPanel>
      )}

      {/* ── 4. Voltage History ── */}
      {data.voltage_history && Object.keys(data.voltage_history).length > 0 && (
        <GlassPanel className="!p-3" style={{ borderRadius: 4 }}>
          <SectionHeader text="НАПРЯЖЕНИЕ" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(data.voltage_history).map(([ecuId, values]) => {
              const meta = ECU_META[ecuId]
              const label = meta ? meta.name : ecuId.toUpperCase()
              const last5 = values.slice(-5)
              const lastVal = values.length > 0 ? values[values.length - 1] : null

              return (
                <div key={ecuId}>
                  {/* Label row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 10,
                        color: theme.text.muted,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {label} ({ecuId})
                    </span>
                    {lastVal != null && (
                      <span
                        className="metric-value"
                        style={{ fontSize: 12 }}
                      >
                        {Number(lastVal).toFixed(1)}V
                      </span>
                    )}
                  </div>

                  {/* Sparkline */}
                  {values.length >= 2 ? (
                    <MiniSparkline values={values} color={theme.accent.cyan} />
                  ) : (
                    /* Fallback: last 5 values as text */
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        justifyContent: 'flex-end',
                      }}
                    >
                      {last5.map((v, i) => (
                        <span
                          key={i}
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: 10,
                            color: i === last5.length - 1 ? theme.accent.cyan : theme.text.muted,
                            padding: '1px 4px',
                            borderRadius: 2,
                            background: i === last5.length - 1
                              ? 'rgba(0,229,255,0.1)'
                              : 'transparent',
                          }}
                        >
                          {Number(v).toFixed(1)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
