import { useMemo } from 'react'

interface PidEntry {
  ts: string
  rpm: number
  speed: number
  coolant: number
  voltage: number
  engine_load: number
  throttle: number
  ltft: number
  stft: number
}

interface LiveTelemetryRibbonProps {
  pids?: PidEntry[]
}

// Voltage присылается бэкендом в миливольтах (сырые OBD-данные).
// 13804 mV → 13.8 V. Делим только если значение явно выше 50V (порог).
function normalizeVoltage(raw: number): number {
  return raw > 50 ? raw / 1000 : raw
}

function MiniSparkline({ data, width = 60, height = 14 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke="var(--c-spectral)"
        strokeWidth={1}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.55}
      />
    </svg>
  )
}

interface Cell {
  label: string
  value: string | null
  series: number[]
  unit?: string
}

function MetricCell({ cell }: { cell: Cell }) {
  const isEmpty = cell.value == null
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
      flex: '1 1 0',
      paddingRight: 12,
    }}>
      <span style={{
        fontSize: 9,
        fontFamily: 'var(--f-body)',
        fontWeight: 600,
        color: '#C8B48E',
        textTransform: 'uppercase',
        letterSpacing: '0.24em',
        lineHeight: 1,
        textShadow: '0 0 6px rgba(200,180,142,0.25)',
      }}>{cell.label}</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <span style={{
          fontSize: 15,
          fontFamily: 'var(--f-mono)',
          color: isEmpty ? 'var(--c-spectral-faint)' : 'var(--c-spectral)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          {isEmpty ? '—' : cell.value}
          {!isEmpty && cell.unit && (
            <span style={{ fontSize: 10, color: 'var(--c-spectral-muted)', marginLeft: 2 }}>{cell.unit}</span>
          )}
        </span>
        {!isEmpty && <MiniSparkline data={cell.series} width={48} height={12} />}
      </div>
    </div>
  )
}

function firstDefined<T>(arr: (T | null | undefined)[]): T | null {
  for (const v of arr) if (v != null) return v
  return null
}

export function LiveTelemetryRibbon({ pids }: LiveTelemetryRibbonProps) {
  const window = useMemo(() => (pids || []).slice(-60), [pids])

  const rpmSeries = useMemo(() => window.map(p => p.rpm).filter((v): v is number => typeof v === 'number'), [window])
  const speedSeries = useMemo(() => window.map(p => p.speed).filter((v): v is number => typeof v === 'number'), [window])
  const coolantSeries = useMemo(() => window.map(p => p.coolant).filter((v): v is number => typeof v === 'number'), [window])
  const voltSeries = useMemo(
    () => window.map(p => (p.voltage != null ? normalizeVoltage(p.voltage) : null)).filter((v): v is number => typeof v === 'number'),
    [window],
  )
  const throttleSeries = useMemo(() => window.map(p => p.throttle).filter((v): v is number => typeof v === 'number'), [window])
  const loadSeries = useMemo(() => window.map(p => p.engine_load).filter((v): v is number => typeof v === 'number'), [window])
  const ltftSeries = useMemo(() => window.map(p => p.ltft).filter((v): v is number => typeof v === 'number'), [window])

  // Take latest non-null per field — последнее событие может иметь не все поля заполненными,
  // но в окне из 60 точек чаще всего есть хотя бы одно валидное значение.
  const latestRpm = firstDefined(window.slice().reverse().map(p => p.rpm))
  const latestSpeed = firstDefined(window.slice().reverse().map(p => p.speed))
  const latestCoolant = firstDefined(window.slice().reverse().map(p => p.coolant))
  const latestVoltRaw = firstDefined(window.slice().reverse().map(p => p.voltage))
  const latestVolt = latestVoltRaw != null ? normalizeVoltage(latestVoltRaw) : null
  const latestThrottle = firstDefined(window.slice().reverse().map(p => p.throttle))
  const latestLoad = firstDefined(window.slice().reverse().map(p => p.engine_load))
  const latestLtft = firstDefined(window.slice().reverse().map(p => p.ltft))

  const cells: Cell[] = [
    { label: 'RPM', value: latestRpm != null ? Math.round(latestRpm).toString() : null, series: rpmSeries },
    { label: 'СКОР', value: latestSpeed != null ? Math.round(latestSpeed).toString() : null, series: speedSeries, unit: 'км/ч' },
    { label: 'Т ОЖ', value: latestCoolant != null ? latestCoolant.toFixed(0) : null, series: coolantSeries, unit: '°' },
    { label: 'НАПР', value: latestVolt != null ? latestVolt.toFixed(1) : null, series: voltSeries, unit: 'В' },
    { label: 'ГАЗ', value: latestThrottle != null ? Math.round(latestThrottle).toString() : null, series: throttleSeries, unit: '%' },
    { label: 'НАГР', value: latestLoad != null ? Math.round(latestLoad).toString() : null, series: loadSeries, unit: '%' },
    { label: 'LTFT', value: latestLtft != null ? latestLtft.toFixed(1) : null, series: ltftSeries, unit: '%' },
  ]

  return (
    <div
      className="canvas-overlay-hud"
      style={{
        position: 'absolute',
        bottom: 40,
        left: 18,
        right: 18,
        zIndex: 20,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '10px 6px 8px',
      }}
    >
      {cells.map((cell, i) => (
        <div key={cell.label} style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 0',
          minWidth: 0,
          borderLeft: i === 0 ? 'none' : '1px solid var(--c-spectral-divider)',
          paddingLeft: i === 0 ? 0 : 14,
        }}>
          <MetricCell cell={cell} />
        </div>
      ))}
    </div>
  )
}

export default LiveTelemetryRibbon
