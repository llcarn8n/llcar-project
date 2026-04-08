import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

// ── Types ──

interface AccelSample {
  ts: string
  x_std: number
  y_std: number
  z_std: number
}

interface PidSample {
  ts: string
  rpm: number
  speed?: number
  [key: string]: any
}

interface PseudoOrderPlotProps {
  accel: AccelSample[]
  pids: PidSample[]
}

// ── Constants ──

const MIN_PAIRED = 5
const MAX_TIME_DIFF_MS = 3000 // 3 seconds pairing window

// Regime classification by RPM
const REGIMES = [
  { name: 'Холостой',   min: 0,    max: 900,   color: '#00E5FF' },
  { name: 'Город',      min: 900,  max: 2000,  color: '#7C4DFF' },
  { name: 'Трасса',     min: 2000, max: 3500,  color: '#00E676' },
  { name: 'Разгон',     min: 3500, max: 8000,  color: '#FFAB00' },
] as const

function getRegime(rpm: number) {
  for (const r of REGIMES) {
    if (rpm >= r.min && rpm < r.max) return r
  }
  return REGIMES[REGIMES.length - 1]
}

// Engine order harmonic lines: frequency = order * RPM / 60
// For vibration amplitude vs RPM, we show reference amplitude thresholds
// where harmonics typically cause resonance peaks
function engineOrderLines(_maxRpm: number) {
  const orders = [
    { order: 1, label: '1-й порядок (дисбаланс)', dash: [8, 4] },
    { order: 2, label: '2-й порядок (опоры)', dash: [4, 4] },
    { order: 3, label: '3-й порядок (подшипники)', dash: [2, 4] },
  ]
  return orders.map(o => ({
    ...o,
    // Reference RPM markers where harmonics align with typical resonance bands
    // Engine frequency = order * RPM / 60
    // Typical body resonance at 10-25 Hz → RPM = freq * 60 / order
    resonanceRpms: [10, 15, 20, 25].map(freq => Math.round(freq * 60 / o.order)),
  }))
}

// ── Component ──

export function PseudoOrderPlot({ accel, pids }: PseudoOrderPlotProps) {
  const result = useMemo(() => {
    if (!accel || !pids || accel.length < MIN_PAIRED || pids.length < MIN_PAIRED) {
      return null
    }

    // Parse and sort PIDs by timestamp
    const pidsParsed = pids
      .filter(p => p.rpm > 0)
      .map(p => ({ ts: new Date(p.ts).getTime(), rpm: p.rpm }))
      .sort((a, b) => a.ts - b.ts)

    if (pidsParsed.length < MIN_PAIRED) return null

    // For each accel sample, find closest PID and pair them
    const points: Array<{ rpm: number; vib: number; regime: typeof REGIMES[number] }> = []

    for (const sample of accel) {
      const accelTs = new Date(sample.ts).getTime()

      // Binary search for closest PID
      let lo = 0, hi = pidsParsed.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (pidsParsed[mid].ts < accelTs) lo = mid + 1
        else hi = mid
      }
      const closest = lo === 0
        ? pidsParsed[0]
        : Math.abs(pidsParsed[lo].ts - accelTs) <= Math.abs(pidsParsed[lo - 1].ts - accelTs)
          ? pidsParsed[lo]
          : pidsParsed[lo - 1]

      if (Math.abs(closest.ts - accelTs) > MAX_TIME_DIFF_MS) continue

      const totalVib = Math.sqrt(
        sample.x_std ** 2 + sample.y_std ** 2 + sample.z_std ** 2
      )

      points.push({
        rpm: closest.rpm,
        vib: parseFloat(totalVib.toFixed(3)),
        regime: getRegime(closest.rpm),
      })
    }

    if (points.length < MIN_PAIRED) return null

    const maxRpm = Math.max(...points.map(p => p.rpm))
    const maxVib = Math.max(...points.map(p => p.vib))

    return { points, maxRpm, maxVib }
  }, [accel, pids])

  // ── Empty state ──
  if (!result) {
    return (
      <GlassPanel>
        <div className="hud-header" style={{ marginBottom: 8 }}>
          PSEUDO ORDER PLOT
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 160,
          color: theme.text.secondary,
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 12,
          letterSpacing: 2,
        }}>
          <span style={{ opacity: 0.6 }}>{'// '}</span>
          <span>Недостаточно данных (RPM + акселерометр)</span>
        </div>
      </GlassPanel>
    )
  }

  // ── Build series per regime ──
  const seriesMap = new Map<string, { data: [number, number][]; color: string }>()
  for (const r of REGIMES) {
    seriesMap.set(r.name, { data: [], color: r.color })
  }
  for (const p of result.points) {
    const entry = seriesMap.get(p.regime.name)
    if (entry) entry.data.push([p.rpm, p.vib])
  }

  // Engine order harmonic reference lines (vertical at resonance RPMs)
  const harmonicColors = ['rgba(0,229,255,0.25)', 'rgba(124,77,255,0.25)', 'rgba(255,64,129,0.25)']
  const orders = engineOrderLines(result.maxRpm)
  const markLines = orders.flatMap((o, oi) =>
    o.resonanceRpms
      .filter(rpm => rpm > 200 && rpm <= result.maxRpm * 1.05)
      .map(rpm => ({
        xAxis: rpm,
        lineStyle: {
          color: harmonicColors[oi],
          type: o.dash[0] === 8 ? 'dashed' as const : o.dash[0] === 4 ? 'dotted' as const : 'dotted' as const,
          width: 1,
        },
        label: {
          show: rpm === o.resonanceRpms[0],
          formatter: o.label,
          fontSize: 9,
          fontFamily: "'Share Tech Mono', monospace",
          color: harmonicColors[oi].replace('0.25', '0.7'),
          position: 'insideEndTop' as const,
        },
      }))
  )

  const series = Array.from(seriesMap.entries())
    .filter(([, v]) => v.data.length > 0)
    .map(([name, { data, color }], idx) => ({
      name,
      type: 'scatter' as const,
      data,
      symbolSize: 5,
      itemStyle: {
        color,
        borderColor: color,
        borderWidth: 0.5,
        opacity: 0.75,
        shadowColor: color + '44',
        shadowBlur: 4,
      },
      emphasis: {
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1.5,
          shadowBlur: 10,
          shadowColor: color + '88',
          opacity: 1,
        },
      },
      // Attach markLine only to the first series
      ...(idx === 0 && markLines.length > 0
        ? {
            markLine: {
              silent: true,
              symbol: 'none',
              data: markLines,
              animation: false,
            },
          }
        : {}),
    }))

  const chartOption = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 400,
    grid: { top: 40, right: 20, bottom: 40, left: 56, containLabel: false },
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(10, 17, 24, 0.95)',
      borderColor: 'rgba(0, 229, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: 11 },
      formatter(params: any) {
        const [rpm, vib] = params.value
        return (
          `<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:4px">${params.seriesName}</div>` +
          `<div>RPM: <b>${Math.round(rpm)}</b></div>` +
          `<div>Вибрация: <b>${vib.toFixed(3)}</b> g</div>` +
          `<div style="margin-top:3px;font-size:10px;color:rgba(255,255,255,0.4)">Частота: ${(rpm / 60).toFixed(1)} Гц</div>`
        )
      },
    },
    legend: {
      top: 6,
      right: 10,
      textStyle: { color: theme.text.secondary, fontFamily: "'Share Tech Mono', monospace", fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
    },
    xAxis: {
      type: 'value' as const,
      name: 'RPM',
      nameLocation: 'center' as const,
      nameGap: 26,
      nameTextStyle: {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 10,
        color: theme.text.secondary,
        letterSpacing: 2,
      },
      min: 0,
      max: Math.ceil(result.maxRpm / 500) * 500,
      axisLine: { lineStyle: { color: 'rgba(0,229,255,0.2)' } },
      axisTick: { show: false },
      axisLabel: {
        color: theme.text.secondary,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 9,
      },
      splitLine: { lineStyle: { color: 'rgba(0,229,255,0.06)', type: 'dashed' as const } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'Вибрация (g)',
      nameLocation: 'center' as const,
      nameGap: 42,
      nameTextStyle: {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 10,
        color: theme.text.secondary,
      },
      min: 0,
      max: Math.ceil(result.maxVib * 1.2 * 100) / 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: theme.text.secondary,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 9,
      },
      splitLine: { lineStyle: { color: 'rgba(0,229,255,0.08)', type: 'dashed' as const } },
    },
    series,
  }

  return (
    <GlassPanel>
      <div className="hud-header" style={{ marginBottom: 4 }}>
        PSEUDO ORDER PLOT
      </div>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 10,
        color: theme.text.muted,
        marginBottom: 4,
      }}>
        {result.points.length} точек | RPM vs вибрация | гармоники двигателя
      </div>
      <ReactECharts
        option={chartOption}
        style={{ height: 260, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </GlassPanel>
  )
}
