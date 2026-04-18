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

interface AudioSample {
  ts: string
  freqs: [number, number][]
  quality: number
}

interface CoherenceMapProps {
  accel: AccelSample[]
  audio: AudioSample[]
}

// ── Frequency bands ──

const FREQ_BANDS = [
  { label: '0–50',      min: 0,    max: 50   },
  { label: '50–100',    min: 50,   max: 100  },
  { label: '100–150',   min: 100,  max: 150  },
  { label: '150–200',   min: 150,  max: 200  },
  { label: '200–300',   min: 200,  max: 300  },
  { label: '300–500',   min: 300,  max: 500  },
  { label: '500–700',   min: 500,  max: 700  },
  { label: '700–1k',    min: 700,  max: 1000 },
  { label: '1k–2k',     min: 1000, max: 2000 },
  { label: '2k+',       min: 2000, max: Infinity },
] as const

const AXES = ['X', 'Y', 'Z'] as const

const MIN_PAIRED_SAMPLES = 5

// ── Helpers ──

/** Find the closest accel sample to a given timestamp */
function findClosestAccel(targetTs: number, accelSorted: { ts: number; x_std: number; y_std: number; z_std: number }[]): typeof accelSorted[0] | null {
  if (accelSorted.length === 0) return null

  let lo = 0
  let hi = accelSorted.length - 1

  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (accelSorted[mid].ts < targetTs) lo = mid + 1
    else hi = mid
  }

  // Check lo and lo-1 for closest
  if (lo === 0) return accelSorted[0]
  const diffLo = Math.abs(accelSorted[lo].ts - targetTs)
  const diffPrev = Math.abs(accelSorted[lo - 1].ts - targetTs)
  return diffPrev <= diffLo ? accelSorted[lo - 1] : accelSorted[lo]
}

/** Sum amplitudes within a frequency band */
function bandAmplitude(freqs: [number, number][], minF: number, maxF: number): number {
  let sum = 0
  for (const [f, amp] of freqs) {
    if (f >= minF && (maxF === Infinity ? true : f < maxF)) {
      sum += amp
    }
  }
  return sum
}

/** Pearson correlation coefficient between two arrays */
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < MIN_PAIRED_SAMPLES) return 0

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (let i = 0; i < n; i++) {
    sumX += xs[i]
    sumY += ys[i]
    sumXY += xs[i] * ys[i]
    sumX2 += xs[i] * xs[i]
    sumY2 += ys[i] * ys[i]
  }

  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (denom === 0) return 0
  return (n * sumXY - sumX * sumY) / denom
}

/** Determine status color for axis health dot */
function axisHealthColor(maxCorr: number): string {
  if (maxCorr > 0.7) return theme.status.critical
  if (maxCorr >= 0.5) return theme.status.warning
  return theme.status.ok
}

// ── Component ──

export function CoherenceMap({ accel, audio }: CoherenceMapProps) {
  const result = useMemo(() => {
    if (!accel || !audio || accel.length < MIN_PAIRED_SAMPLES || audio.length < MIN_PAIRED_SAMPLES) {
      return null
    }

    // Pre-parse accel timestamps and sort
    const accelParsed = accel
      .map(a => ({ ts: new Date(a.ts).getTime(), x_std: a.x_std, y_std: a.y_std, z_std: a.z_std }))
      .sort((a, b) => a.ts - b.ts)

    // For each audio sample, find closest accel and build paired data
    const paired: Array<{
      bandAmps: number[]   // 10 band amplitudes
      x: number
      y: number
      z: number
    }> = []

    for (const sample of audio) {
      const audioTs = new Date(sample.ts).getTime()
      const closest = findClosestAccel(audioTs, accelParsed)
      if (!closest) continue

      // Only pair if within 5 seconds
      if (Math.abs(closest.ts - audioTs) > 5000) continue

      const bandAmps = FREQ_BANDS.map(b => bandAmplitude(sample.freqs, b.min, b.max))
      paired.push({
        bandAmps,
        x: closest.x_std,
        y: closest.y_std,
        z: closest.z_std,
      })
    }

    if (paired.length < MIN_PAIRED_SAMPLES) return null

    // Compute 10x3 correlation matrix
    // heatmapData: [bandIndex, axisIndex, correlationValue]
    const heatmapData: [number, number, number][] = []
    const axisMaxCorr = [0, 0, 0] // track max |correlation| per axis

    for (let bandIdx = 0; bandIdx < FREQ_BANDS.length; bandIdx++) {
      const bandValues = paired.map(p => p.bandAmps[bandIdx])

      for (let axisIdx = 0; axisIdx < 3; axisIdx++) {
        const axisKey = (['x', 'y', 'z'] as const)[axisIdx]
        const axisValues = paired.map(p => p[axisKey])
        const corr = pearson(bandValues, axisValues)
        const absCorr = Math.abs(corr)

        heatmapData.push([bandIdx, axisIdx, parseFloat(absCorr.toFixed(3))])

        if (absCorr > axisMaxCorr[axisIdx]) {
          axisMaxCorr[axisIdx] = absCorr
        }
      }
    }

    return { heatmapData, axisMaxCorr, pairedCount: paired.length }
  }, [accel, audio])

  // ── Empty state ──
  if (!result) {
    return (
      <GlassPanel>
        <div className="hud-header" style={{ marginBottom: 8 }}>
          КОГЕРЕНТНОСТЬ
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 160,
          color: theme.text.secondary,
          fontFamily: "var(--f-display)",
          fontSize: 12,
          letterSpacing: 2,
        }}>
          <span style={{ opacity: 0.6 }}>{'// '}</span>
          <span>Недостаточно данных</span>
        </div>
      </GlassPanel>
    )
  }

  // ── Chart option ──
  const chartOption = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 600,
    grid: {
      top: 10,
      right: 14,
      bottom: 36,
      left: 40,
      containLabel: false,
    },
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(10, 17, 24, 0.95)',
      borderColor: 'rgba(0, 229, 255, 0.3)',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontFamily: "var(--f-mono)",
        fontSize: 11,
      },
      formatter(params: { value: [number, number, number] }) {
        const [bandIdx, axisIdx, val] = params.value
        const bandLabel = FREQ_BANDS[bandIdx].label + ' Hz'
        const axisLabel = AXES[axisIdx]
        const pct = (val * 100).toFixed(1)
        return (
          '<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:4px">Корреляция</div>' +
          '<div><b>' + axisLabel + '</b> × <b>' + bandLabel + '</b></div>' +
          '<div style="margin-top:4px;font-size:14px;color:' +
          (val > 0.7 ? theme.status.critical : val >= 0.5 ? theme.status.warning : theme.accent.cyan) +
          '"><b>' + pct + '%</b></div>'
        )
      },
    },
    xAxis: {
      type: 'category' as const,
      data: FREQ_BANDS.map(b => b.label),
      position: 'bottom' as const,
      axisLine: { lineStyle: { color: 'rgba(0,229,255,0.15)' } },
      axisTick: { show: false },
      axisLabel: {
        color: theme.text.secondary,
        fontFamily: "var(--f-mono)",
        fontSize: 9,
        interval: 0,
        rotate: 0,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: [...AXES],
      axisLine: { lineStyle: { color: 'rgba(0,229,255,0.15)' } },
      axisTick: { show: false },
      axisLabel: {
        color: theme.accent.cyan,
        fontFamily: "var(--f-display)",
        fontSize: 11,
        fontWeight: 'bold' as const,
      },
      splitLine: { show: false },
    },
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      inRange: {
        color: ['#073642', '#073642', '#0A4A52', '#00838F', '#00ACC1', '#00E5FF', '#FF8A65', '#FF5252', '#FF1744'],
      },
    },
    series: [
      {
        type: 'heatmap' as const,
        data: result.heatmapData,
        itemStyle: {
          borderColor: 'rgba(12,18,32,0.8)',
          borderWidth: 2,
          borderRadius: 3,
        },
        emphasis: {
          itemStyle: {
            borderColor: theme.accent.cyan,
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: 'rgba(0,229,255,0.5)',
          },
        },
        label: {
          show: true,
          fontSize: 9,
          fontFamily: "var(--f-mono)",
          formatter(params: { value: [number, number, number] }) {
            const val = params.value[2]
            // Dim cells with low correlation
            return val < 0.3 ? '' : (val * 100).toFixed(0)
          },
          color: (params: { value: [number, number, number] }) => {
            const val = params.value[2]
            if (val < 0.3) return 'transparent'
            if (val > 0.7) return '#fff'
            return 'rgba(255,255,255,0.8)'
          },
        },
      },
    ],
  }

  return (
    <GlassPanel>
      <div className="hud-header" style={{ marginBottom: 4 }}>
        КОГЕРЕНТНОСТЬ
      </div>

      <ReactECharts
        option={chartOption}
        style={{ height: 140, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />

      {/* Axis health status dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        marginTop: 4,
        paddingTop: 6,
        borderTop: '1px solid rgba(0,229,255,0.08)',
      }}>
        {AXES.map((axis, idx) => {
          const color = axisHealthColor(result.axisMaxCorr[idx])
          return (
            <div key={axis} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}, 0 0 2px ${color}`,
                transition: 'background-color 0.4s ease, box-shadow 0.4s ease',
              }} />
              <span style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10,
                color: theme.text.secondary,
                letterSpacing: 1,
              }}>
                {axis}
              </span>
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}
