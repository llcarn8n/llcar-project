import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

export interface AudioSample {
  ts: string
  freqs: [number, number][]
  quality: number
}

interface AudioSpectrumProps {
  data: AudioSample[]
  compact?: boolean
}

const ZONES = [
  { name: 'Дорога <100Гц',    key: 'road',    color: '#00E5FF', test: (f: number) => f < 100 },
  { name: 'Двигатель 100-300Гц', key: 'engine', color: '#7C4DFF', test: (f: number) => f >= 100 && f < 300 },
  { name: 'Оборудование 300-1кГц', key: 'acc', color: '#FFAB00', test: (f: number) => f >= 300 && f <= 1000 },
  { name: 'ВЧ шум >1кГц',     key: 'hf',      color: '#FF4081', test: (f: number) => f > 1000 },
] as const

function groupByZone(sample: AudioSample): number[] {
  const sums = [0, 0, 0, 0]
  for (const [freq, amp] of sample.freqs) {
    for (let z = 0; z < ZONES.length; z++) {
      if (ZONES[z].test(freq)) { sums[z] += Math.abs(amp); break }
    }
  }
  return sums
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch { return ts }
}

function qualityLabel(q: number): { text: string; color: string } {
  if (q >= 70) return { text: 'ХОРОШЕЕ', color: theme.status.ok }
  if (q >= 40) return { text: 'СРЕДНЕЕ', color: theme.status.warning }
  return { text: 'ПЛОХОЕ', color: theme.status.critical }
}

export function AudioSpectrum({ data, compact = false }: AudioSpectrumProps) {
  const quality = data.length > 0 ? data[data.length - 1].quality : 0
  const qLabel = qualityLabel(quality)
  const isLowData = data.length < 20

  // For low data: aggregate all samples into zone totals
  const zoneAverages = useMemo(() => {
    if (data.length === 0) return [0, 0, 0, 0]
    const totals = [0, 0, 0, 0]
    for (const s of data) {
      const g = groupByZone(s)
      for (let i = 0; i < 4; i++) totals[i] += g[i]
    }
    return totals.map(t => Math.round(t / data.length))
  }, [data])

  // For timeline: process series
  const timelineData = useMemo(() => {
    if (isLowData || data.length === 0) return null
    const timestamps = data.map(s => formatTime(s.ts))
    const zoneSeries = ZONES.map((zone, zi) => ({
      name: zone.name,
      type: 'line' as const,
      stack: 'audio',
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color: zone.color, shadowColor: zone.color, shadowBlur: 6 },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: zone.color + '99' },
            { offset: 1, color: zone.color + '1A' },
          ],
        },
      },
      emphasis: { focus: 'series' as const },
      data: data.map(s => groupByZone(s)[zi]),
    }))
    return { timestamps, zoneSeries }
  }, [data, isLowData])

  // Auto Y max
  const yMax = useMemo(() => {
    if (data.length === 0) return 1000
    let m = 0
    for (const s of data) {
      const sums = groupByZone(s)
      m = Math.max(m, sums.reduce((a, b) => a + b, 0))
    }
    return Math.ceil(m * 1.2 / 100) * 100 || 1000
  }, [data])

  if (data.length === 0) {
    return (
      <GlassPanel>
        <div className="hud-header mb-2">NVH Спектр</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: compact ? 180 : 260, color: theme.text.muted, fontSize: 12 }}>
          Нет аудио данных
        </div>
      </GlassPanel>
    )
  }

  // BAR MODE for low data
  if (isLowData) {
    const maxZoneVal = Math.max(...zoneAverages, 1)
    return (
      <GlassPanel>
        <div className="hud-header mb-2">NVH Спектр</div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-mono" style={{ color: theme.text.muted }}>{data.length} замеров</span>
          <span className="text-[10px]" style={{ color: theme.text.muted }}>|</span>
          <QualityBadge quality={quality} label={qLabel} />
        </div>

        {/* Zone bars */}
        <div className="space-y-3 px-1">
          {ZONES.map((zone, i) => {
            const val = zoneAverages[i]
            const pct = Math.min((val / maxZoneVal) * 100, 100)
            return (
              <div key={zone.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: zone.color }}>{zone.name}</span>
                  <span className="text-xs font-mono" style={{ color: theme.text.secondary }}>{val}</span>
                </div>
                <div className="relative h-4 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="absolute inset-y-0 left-0 rounded transition-all duration-700" style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${zone.color}44, ${zone.color}88)`,
                    boxShadow: `0 0 6px ${zone.color}44`,
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-[9px] px-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Средняя амплитуда по зонам. Мало данных — график появится при &gt;20 замерах.
        </div>
      </GlassPanel>
    )
  }

  // TIMELINE MODE for enough data
  const chartOption = {
    animation: true,
    animationDuration: 600,
    grid: { top: 40, right: 16, bottom: 30, left: 50, containLabel: false },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(10, 17, 24, 0.95)',
      borderColor: 'rgba(0, 229, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: 11 },
    },
    legend: {
      show: !compact,
      top: 6, left: 50,
      textStyle: { color: theme.text.secondary, fontFamily: "'Share Tech Mono', monospace", fontSize: 10 },
      itemWidth: 12, itemHeight: 8, itemGap: 10,
    },
    xAxis: {
      type: 'category' as const,
      data: timelineData!.timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(0,229,255,0.2)' } },
      axisTick: { show: false },
      axisLabel: {
        color: theme.text.secondary,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 9,
        interval: Math.max(0, Math.floor(data.length / 8) - 1),
        rotate: data.length > 30 ? 30 : 0,
      },
    },
    yAxis: {
      type: 'value' as const,
      max: yMax,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.text.secondary, fontFamily: "'Share Tech Mono', monospace", fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(0,229,255,0.1)', type: 'dashed' as const } },
    },
    series: timelineData!.zoneSeries,
  }

  return (
    <GlassPanel>
      <div style={{ position: 'relative' }}>
        <div className="hud-header mb-1">NVH Спектр</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono" style={{ color: theme.text.muted }}>{data.length} замеров</span>
          <span className="text-[10px]" style={{ color: theme.text.muted }}>|</span>
          <QualityBadge quality={quality} label={qLabel} />
        </div>
        <ReactECharts option={chartOption} style={{ height: compact ? 160 : 300, width: '100%' }} opts={{ renderer: 'canvas' }} notMerge />
      </div>
    </GlassPanel>
  )
}

function QualityBadge({ quality, label }: { quality: number; label: { text: string; color: string } }) {
  return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{
      color: label.color,
      background: `${label.color}15`,
      border: `1px solid ${label.color}33`,
    }}>
      Микрофон: {quality}% — {label.text}
    </span>
  )
}
