import * as echarts from 'echarts'
import 'echarts-gl'
import { useRef, useEffect, useMemo, useState } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface SuspensionTabProps {
  accelData: Array<{
    x_std: number; y_std: number; z_std: number; ts: string;
    z_min?: number; z_max?: number; z_s1?: number; z_s2?: number; z_s3?: number; z_s4?: number; z?: number;
  }>
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch { return ts }
}

function DetailCharts({ accelData, chartAxesRef, chartCorridorRef }: {
  accelData: SuspensionTabProps['accelData']
  chartAxesRef: React.RefObject<HTMLDivElement | null>
  chartCorridorRef: React.RefObject<HTMLDivElement | null>
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '10px 16px',
          fontFamily: "var(--f-body)",
          fontSize: 13,
          fontWeight: 700,
          color: open ? '#0C1220' : 'var(--c-amber)',
          background: open ? 'var(--c-amber)' : 'var(--border-frost)',
          border: `1px solid ${open ? 'transparent' : 'rgba(214,235,253,0.19)'}`,
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <span style={{ transition: 'transform 0.3s', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
        {open ? 'Скрыть подробности' : 'Подробнее — графики по осям и коридор Z'}
      </button>

      {open && (
        <div className="suspension-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Vibration by axes */}
          <GlassPanel style={{ background: 'rgba(6, 15, 25, 0.5)' }}>
            <div className="hud-header" style={{ marginBottom: 4 }}>Вибрация по осям</div>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.45)',
              fontFamily: "var(--f-body)",
              lineHeight: 1.5, marginBottom: 8,
              padding: '6px 8px',
              background: 'rgba(240,240,250,0.03)',
              borderRadius: 4,
              border: '1px solid var(--border-frost)',
            }}>
              Три линии — тряска по каждой оси за период наблюдения.
              <span style={{ color: '#ef4444' }}> Красная (X)</span> — боковые крены в поворотах и на колее.
              <span style={{ color: '#4ade80' }}> Зелёная (Y)</span> — рывки при разгоне и торможении.
              <span style={{ color: '#60a5fa' }}> Синяя (Z)</span> — удары от ям и лежачих полицейских.
              Если одна ось стабильно выше — проблема в конкретном узле подвески.
            </div>
            <div ref={chartAxesRef} style={{ width: '100%', height: 240 }} />
          </GlassPanel>

          {/* Z corridor */}
          <GlassPanel style={{ background: 'rgba(6, 15, 25, 0.5)', position: 'relative' }}>
            <div className="hud-header" style={{ marginBottom: 4 }}>Вертикальная ось Z — коридор ям</div>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.45)',
              fontFamily: "var(--f-body)",
              lineHeight: 1.5, marginBottom: 8,
              padding: '6px 8px',
              background: 'rgba(240,240,250,0.03)',
              borderRadius: 4,
              border: '1px solid var(--border-frost)',
            }}>
              Синяя линия — текущая вертикальная вибрация (ямы, кочки, лежачие полицейские).
              Пунктир — минимум и максимум за период.
              Широкий коридор = неровная дорога или изношенные амортизаторы.
              Узкий коридор = ровная дорога, подвеска в порядке.
            </div>
            <div ref={chartCorridorRef} style={{ width: '100%', height: 240 }} />
            {!accelData.some(d => d.z_min != null || d.z_max != null) && (
              <div style={{
                position: 'absolute', bottom: 20, left: 0, right: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: 11,
                fontFamily: "var(--f-mono)",
              }}>
                Нет данных min/max для этого периода
              </div>
            )}
          </GlassPanel>
        </div>
      )}
    </>
  )
}

export function SuspensionTab({ accelData }: SuspensionTabProps) {
  const chart3dRef = useRef<HTMLDivElement>(null)
  const chartAxesRef = useRef<HTMLDivElement>(null)
  const chartCorridorRef = useRef<HTMLDivElement>(null)

  const chart3dInstance = useRef<echarts.ECharts | null>(null)
  const chartAxesInstance = useRef<echarts.ECharts | null>(null)
  const chartCorridorInstance = useRef<echarts.ECharts | null>(null)

  // ── Data processing ──
  const { avgX, avgY, avgZ, totalVib, statusIcon, statusTitle, statusDesc, statusColor,
    dominantAxis, trajectoryData, timestamps } = useMemo(() => {
    if (accelData.length === 0) {
      return {
        avgX: 0, avgY: 0, avgZ: 0, totalVib: 0,
        statusIcon: '--', statusTitle: 'Нет данных', statusDesc: '',
        statusColor: 'rgba(255,255,255,0.3)', dominantAxis: '',
        trajectoryData: [] as number[][], timestamps: [] as string[],
      }
    }

    let sumX = 0, sumY = 0, sumZ = 0
    const tData: number[][] = []
    const ts: string[] = []

    for (let i = 0; i < accelData.length; i++) {
      const d = accelData[i]
      sumX += d.x_std
      sumY += d.y_std
      sumZ += d.z_std
      const vib = Math.sqrt(d.x_std ** 2 + d.y_std ** 2 + d.z_std ** 2)
      tData.push([d.x_std, d.y_std, d.z_std, vib, i])
      ts.push(formatTime(d.ts))
    }

    const n = accelData.length
    const aX = sumX / n
    const aY = sumY / n
    const aZ = sumZ / n
    const tVib = Math.sqrt(aX ** 2 + aY ** 2 + aZ ** 2)

    let icon: string, title: string, desc: string, color: string
    if (tVib < 1.5) {
      icon = '\u2705'; title = 'Подвеска в норме'
      desc = 'Вибрация в пределах нормы для данного режима движения'
      color = 'var(--status-ok)'
    } else if (tVib < 3) {
      icon = '\u26A0\uFE0F'; title = 'Вибрация повышена'
      desc = 'Возможно неровная дорога или начальный износ элементов подвески'
      color = 'var(--status-warning)'
    } else {
      icon = '\u{1F534}'; title = 'Вибрация высокая'
      desc = 'Рекомендуется проверить подвеску на СТО'
      color = 'var(--status-critical)'
    }

    // Dominant axis
    const maxAxis = Math.max(aX, aY, aZ)
    let dominant = ''
    if (maxAxis === aX) dominant = 'X (боковая) — крены, колея, боковой ветер'
    else if (maxAxis === aY) dominant = 'Y (продольная) — торможение, разгон, клевки'
    else dominant = 'Z (вертикальная) — ямы, стыки, лежачие полицейские'

    return {
      avgX: aX, avgY: aY, avgZ: aZ, totalVib: tVib,
      statusIcon: icon, statusTitle: title, statusDesc: desc, statusColor: color,
      dominantAxis: dominant, trajectoryData: tData, timestamps: ts,
    }
  }, [accelData])

  // ── 3D Chart ──
  useEffect(() => {
    if (!chart3dRef.current || trajectoryData.length === 0) return

    const chart = echarts.init(chart3dRef.current, undefined, { renderer: 'canvas' })
    chart3dInstance.current = chart

    // Parametric ellipsoid for normal zone
    const parametricData: number[][] = []
    const RADIUS = 1.5
    for (let u = 0; u <= Math.PI * 2; u += Math.PI / 20) {
      for (let v = 0; v <= Math.PI; v += Math.PI / 20) {
        parametricData.push([
          RADIUS * Math.sin(v) * Math.cos(u),
          RADIUS * Math.sin(v) * Math.sin(u),
          RADIUS * Math.cos(v),
        ])
      }
    }

    const times = accelData.map(d => {
      try { return new Date(d.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } catch { return '--' }
    })

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (p: any) => {
          if (!p.data || p.seriesType === 'surface') return ''
          const d = p.data
          const idx = Math.round(d[4] || 0)
          const timeStr = idx >= 0 && idx < times.length ? times[idx] : '--'
          return `<span style="color:#6B5AE0;font-weight:600;">Время: ${timeStr}</span><br>`
            + `X бок: <b>${d[0]?.toFixed(2) ?? '--'}</b> m/s²<br>`
            + `Y прод: <b>${d[1]?.toFixed(2) ?? '--'}</b> m/s²<br>`
            + `Z верт: <b>${d[2]?.toFixed(2) ?? '--'}</b> m/s²<br>`
            + `Общая: <b style="color:${d[3] > 5 ? '#ef4444' : d[3] > 2 ? '#f59e0b' : '#4ade80'}">${d[3]?.toFixed(2) ?? '--'}</b> m/s²`
        },
      },
      visualMap: (() => {
        const vibs = trajectoryData.map(d => d[3]).sort((a, b) => a - b)
        const p5 = vibs[Math.floor(vibs.length * 0.05)] ?? 0
        const p95 = vibs[Math.floor(vibs.length * 0.95)] ?? 1
        const range = p95 - p5
        return {
          show: true,
          dimension: 3,
          min: Math.max(0, p5 - range * 0.1),
          max: (p95 + range * 0.1) || 1,
          inRange: {
            color: ['#EFF2F7', '#C8BFF0', '#8A7AD8', '#6B5AE0', '#FF4A4A'],
          },
          textStyle: { color: 'rgba(255,255,255,0.5)', fontFamily: "var(--f-mono)", fontSize: 9 },
          right: 10,
          top: 10,
          text: ['\u26A0 Тряска', '\u2713 Норма'],
          itemWidth: 8,
          itemHeight: 100,
        }
      })(),
      grid3D: {
        boxWidth: 100,
        boxHeight: 100,
        boxDepth: 100,
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 4,
          distance: 220,
          alpha: 40,
          beta: 30,
        },
        postEffect: {
          enable: true,
          bloom: {
            enable: true,
            bloomIntensity: 0.15,
          },
        },
        light: {
          main: { intensity: 1.2, shadow: false },
          ambient: { intensity: 0.3 },
        },
        axisLine: { lineStyle: { color: 'rgba(240,240,250,0.3)' } },
        axisTick: { lineStyle: { color: 'rgba(214,235,253,0.19)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontFamily: "var(--f-mono)", fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(240,240,250,0.08)' } },
        axisPointer: { lineStyle: { color: 'rgba(255,159,28,0.5)' } },
      },
      xAxis3D: { name: 'X (бок)', type: 'value' as const, nameTextStyle: { color: '#ef4444', fontSize: 10 } },
      yAxis3D: { name: 'Y (прод)', type: 'value' as const, nameTextStyle: { color: '#4ade80', fontSize: 10 } },
      zAxis3D: { name: 'Z (верт)', type: 'value' as const, nameTextStyle: { color: '#60a5fa', fontSize: 10 } },
      series: [
        // Scatter3D — main points
        {
          type: 'scatter3D',
          data: trajectoryData,
          symbolSize: (val: number[]) => Math.max(3, Math.min(val[3] * 3, 18)),
          itemStyle: { opacity: 0.85, borderWidth: 0 },
          emphasis: {
            itemStyle: { borderColor: '#fff', borderWidth: 1 },
          },
        },
        // Line3D — trajectory
        {
          type: 'line3D',
          data: trajectoryData.map(d => [d[0], d[1], d[2]]),
          lineStyle: {
            width: 1.5,
            color: 'rgba(240,240,250,0.3)',
            opacity: 0.5,
          },
        },
        // Center point
        {
          type: 'scatter3D',
          data: [[0, 0, 0]],
          symbolSize: 10,
          itemStyle: { color: '#fff', opacity: 0.9 },
        },
        // Normal zone ellipsoid
        {
          type: 'scatter3D',
          data: parametricData,
          symbolSize: 2,
          itemStyle: { color: 'rgba(0,230,118,0.15)', opacity: 0.15 },
          silent: true,
        },
      ],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chart3dInstance.current = null
    }
  }, [trajectoryData])

  // ── Axes Area Chart ──
  useEffect(() => {
    if (!chartAxesRef.current || accelData.length === 0) return

    const chart = echarts.init(chartAxesRef.current, undefined, { renderer: 'canvas' })
    chartAxesInstance.current = chart

    const option = {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 600,
      grid: { top: 30, right: 16, bottom: 30, left: 50, containLabel: false },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(10, 17, 24, 0.95)',
        borderColor: 'rgba(214,235,253,0.19)',
        borderWidth: 1,
        textStyle: { color: '#fff', fontFamily: "var(--f-mono)", fontSize: 11 },
      },
      legend: {
        top: 4, left: 50,
        textStyle: { color: 'rgba(255,255,255,0.6)', fontFamily: "var(--f-mono)", fontSize: 10 },
        itemWidth: 12, itemHeight: 8,
      },
      xAxis: {
        type: 'category' as const,
        data: timestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(214,235,253,0.19)' } },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(255,255,255,0.4)',
          fontFamily: "var(--f-mono)",
          fontSize: 9,
          interval: Math.max(0, Math.floor(accelData.length / 8) - 1),
        },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: "var(--f-mono)", fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(240,240,250,0.08)', type: 'dashed' as const } },
      },
      series: [
        {
          name: 'X бок',
          type: 'line',
          stack: 'vib',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.5, color: '#ef4444' },
          areaStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.5)' }, { offset: 1, color: 'rgba(239,68,68,0.05)' }] },
          },
          data: accelData.map(d => d.x_std),
        },
        {
          name: 'Y прод',
          type: 'line',
          stack: 'vib',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.5, color: '#4ade80' },
          areaStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(74,222,128,0.5)' }, { offset: 1, color: 'rgba(74,222,128,0.05)' }] },
          },
          data: accelData.map(d => d.y_std),
        },
        {
          name: 'Z верт',
          type: 'line',
          stack: 'vib',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.5, color: '#60a5fa' },
          areaStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(96,165,250,0.5)' }, { offset: 1, color: 'rgba(96,165,250,0.05)' }] },
          },
          data: accelData.map(d => d.z_std),
        },
      ],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chartAxesInstance.current = null
    }
  }, [accelData, timestamps])

  // ── Z Corridor Chart ──
  useEffect(() => {
    if (!chartCorridorRef.current || accelData.length === 0) return

    const hasZData = accelData.some(d => d.z_min != null || d.z_max != null)
    if (!hasZData) return

    const chart = echarts.init(chartCorridorRef.current, undefined, { renderer: 'canvas' })
    chartCorridorInstance.current = chart

    const zLine = accelData.map(d => d.z ?? d.z_std)
    const zMin = accelData.map(d => d.z_min ?? null)
    const zMax = accelData.map(d => d.z_max ?? null)
    const shapeData = accelData.map(d => {
      const vals = [d.z_s1, d.z_s2, d.z_s3, d.z_s4].filter(v => v != null) as number[]
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    })

    const option = {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 600,
      grid: { top: 30, right: 16, bottom: 30, left: 50, containLabel: false },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(10, 17, 24, 0.95)',
        borderColor: 'rgba(214,235,253,0.19)',
        borderWidth: 1,
        textStyle: { color: '#fff', fontFamily: "var(--f-mono)", fontSize: 11 },
      },
      legend: {
        top: 4, left: 50,
        textStyle: { color: 'rgba(255,255,255,0.6)', fontFamily: "var(--f-mono)", fontSize: 10 },
        itemWidth: 12, itemHeight: 8,
      },
      xAxis: {
        type: 'category' as const,
        data: timestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(214,235,253,0.19)' } },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(255,255,255,0.4)',
          fontFamily: "var(--f-mono)",
          fontSize: 9,
          interval: Math.max(0, Math.floor(accelData.length / 8) - 1),
        },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: "var(--f-mono)", fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(240,240,250,0.08)', type: 'dashed' as const } },
      },
      series: [
        {
          name: 'Z',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#60a5fa' },
          data: zLine,
        },
        {
          name: 'Z min',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: 'rgba(96,165,250,0.4)', type: 'dashed' as const },
          data: zMin,
        },
        {
          name: 'Z max',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: 'rgba(96,165,250,0.4)', type: 'dashed' as const },
          data: zMax,
        },
        {
          name: 'Shape avg',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.5, color: '#FFAB00' },
          data: shapeData,
        },
      ],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chartCorridorInstance.current = null
    }
  }, [accelData, timestamps])

  // ── Empty state ──
  if (accelData.length === 0) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">Подвеска</div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 300, color: theme.text.muted, fontSize: 12,
          fontFamily: "var(--f-mono)",
        }}>
          Нет данных
        </div>
      </GlassPanel>
    )
  }

  const STAT_CARDS = [
    { axis: 'X', label: 'Боковая тряска', sublabel: 'Крены / колея', value: avgX, color: '#ef4444' },
    { axis: 'Y', label: 'Разгон / Торможение', sublabel: 'Клевки / рывки', value: avgY, color: '#4ade80' },
    { axis: 'Z', label: 'Вертикальная', sublabel: 'Ямы / лежачие', value: avgZ, color: '#60a5fa' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 1. Status Card */}
      <GlassPanel style={{
        borderLeft: `3px solid ${statusColor}`,
        background: 'rgba(6, 15, 25, 0.7)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{statusIcon}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 16, fontWeight: 700,
              fontFamily: "var(--f-body)",
              color: statusColor,
              textShadow: `0 0 10px ${statusColor}60`,
            }}>
              {statusTitle}
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.6)',
              fontFamily: "var(--f-mono)",
              marginTop: 2,
            }}>
              {statusDesc}
            </div>
            {dominantAxis && (
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.4)',
                fontFamily: "var(--f-mono)",
                marginTop: 4,
              }}>
                Доминирующая ось: {dominantAxis}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 28, fontWeight: 700,
              fontFamily: "var(--f-display)",
              color: statusColor,
              textShadow: `0 0 15px ${statusColor}80`,
            }}>
              {totalVib.toFixed(1)}
            </div>
            <div style={{
              fontSize: 9, color: 'rgba(255,255,255,0.4)',
              fontFamily: "var(--f-mono)",
              letterSpacing: '0.1em',
            }}>
              RMS m/s2
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* 2. Three Stat Cards */}
      <div className="suspension-stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {STAT_CARDS.map(card => {
          const pct = Math.min(card.value / 5 * 100, 100)
          return (
            <GlassPanel key={card.axis} style={{ background: 'rgba(6, 15, 25, 0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  fontFamily: "var(--f-display)",
                  color: card.color,
                  background: `${card.color}15`,
                  padding: '2px 6px',
                  borderRadius: 3,
                }}>
                  {card.axis}
                </span>
                <div>
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    fontFamily: "var(--f-body)",
                    color: theme.text.primary,
                  }}>
                    {card.label}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontFamily: "var(--f-mono)",
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    {card.sublabel}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 22, fontWeight: 700,
                fontFamily: "var(--f-display)",
                color: card.color,
                textShadow: `0 0 10px ${card.color}60`,
                marginBottom: 6,
              }}>
                {card.value.toFixed(2)}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>m/s2</span>
              </div>
              {/* Progress bar */}
              <div style={{
                height: 4, borderRadius: 2, overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${card.color}66, ${card.color})`,
                  boxShadow: `0 0 6px ${card.color}44`,
                  transition: 'width 0.7s ease',
                }} />
              </div>
            </GlassPanel>
          )
        })}
      </div>

      {/* 3. 3D Scatter Plot */}
      <GlassPanel style={{ position: 'relative', background: 'rgba(6, 15, 25, 0.6)' }}>
        <div className="hud-header" style={{ marginBottom: 4 }}>3D-Траектория вибрации</div>
        <div
          ref={chart3dRef}
          style={{ width: '100%', height: 'min(420px, 60vh)' }}
        />
        {/* Overlay explanation */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 16,
          maxWidth: 220,
          padding: '8px 10px',
          background: 'rgba(6, 15, 25, 0.85)',
          border: '1px solid var(--border-frost)',
          borderRadius: 6,
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700,
            fontFamily: "var(--f-body)",
            color: 'var(--c-amber)',
            marginBottom: 4,
            letterSpacing: '0.05em',
          }}>
            Как читать 3D график
          </div>
          <div style={{
            fontSize: 9, lineHeight: 1.5,
            fontFamily: "var(--f-mono)",
            color: 'rgba(255,255,255,0.5)',
          }}>
            Каждая точка — замер вибрации по 3 осям.
            Цвет: зелёный = норма, красный = высокая.
            Зелёная сфера — зона нормы (RMS &lt; 1.5).
            Белая точка в центре — идеальный покой.
            Траектория показывает хронологию замеров.
          </div>
        </div>
      </GlassPanel>

      {/* 4. Details toggle */}
      <DetailCharts
        accelData={accelData}
        chartAxesRef={chartAxesRef}
        chartCorridorRef={chartCorridorRef}
      />
    </div>
  )
}
