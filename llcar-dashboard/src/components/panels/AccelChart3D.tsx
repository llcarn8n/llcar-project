import { useRef, useEffect, useMemo } from 'react'
import * as echarts from 'echarts'
import 'echarts-gl'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

export interface AccelSample { x_std: number; y_std: number; z_std: number; ts: string }

interface AccelChart3DProps {
  data: AccelSample[]
  compact?: boolean
}

function getStatus(total: number, x: number, y: number, z: number) {
  const worst = [
    { v: z, ax: 'вертикально', why: 'ямы, амортизаторы' },
    { v: x, ax: 'вбок', why: 'колея, сайлентблоки' },
    { v: y, ax: 'продольно', why: 'опоры двигателя' },
  ].sort((a, b) => b.v - a.v)[0]
  if (total < 2) return { label: 'НОРМА', color: '#3b9eff', text: 'Подвеска ок' }
  if (total < 5) return { label: 'УМЕРЕННАЯ', color: '#FFAB00', text: `Больше ${worst.ax}` }
  if (total < 8) return { label: 'ПОВЫШЕННАЯ', color: '#FFAB00', text: `Проверить. ${worst.ax} — ${worst.why}` }
  return { label: 'ВЫСОКАЯ', color: '#FF1744', text: `Диагностика! ${worst.ax} — ${worst.why}` }
}

export function AccelChart3D({ data, compact = true }: AccelChart3DProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const latest = data.length > 0 ? data[data.length - 1] : null
  const x = latest?.x_std ?? 0, y = latest?.y_std ?? 0, z = latest?.z_std ?? 0
  const total = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
  const st = getStatus(total, x, y, z)

  // Process data — from V2 render3DTrajectory
  const { trajectoryData, times, maxVib, meanX, meanY, meanZ, stdX, stdY, stdZ } = useMemo(() => {
    if (data.length === 0) return { trajectoryData: [], times: [], maxVib: 1, meanX: 0, meanY: 0, meanZ: 0, stdX: 1, stdY: 1, stdZ: 1 }

    const maxPts = compact ? 200 : 400
    let src = data
    if (src.length > maxPts) {
      const step = Math.ceil(src.length / maxPts)
      src = src.filter((_, i) => i % step === 0)
    }

    const tData: number[][] = []
    const vibArr: number[] = []
    let sumX = 0, sumY = 0, sumZ = 0

    for (let i = 0; i < src.length; i++) {
      const d = src[i]
      const xs = d.x_std || 0, ys = d.y_std || 0, zs = d.z_std || 0
      const vib = Math.sqrt(xs * xs + ys * ys + zs * zs)
      tData.push([xs, ys, zs, vib, i])
      vibArr.push(vib)
      sumX += xs; sumY += ys; sumZ += zs
    }

    const n = src.length
    const mX = sumX / n, mY = sumY / n, mZ = sumZ / n
    let sX = 0, sY = 0, sZ = 0
    for (const d of src) {
      sX += (d.x_std - mX) ** 2
      sY += (d.y_std - mY) ** 2
      sZ += (d.z_std - mZ) ** 2
    }

    return {
      trajectoryData: tData,
      times: src.map(d => d.ts),
      maxVib: Math.max(...vibArr, 0.5),
      meanX: mX, meanY: mY, meanZ: mZ,
      stdX: Math.sqrt(sX / n) || 0.5,
      stdY: Math.sqrt(sY / n) || 0.5,
      stdZ: Math.sqrt(sZ / n) || 0.5,
    }
  }, [data, compact])

  // Normal zone ellipsoid (detailed only)
  const normalZone = useMemo(() => {
    if (compact) return []
    const pts: number[][] = []
    const res = 16
    for (let u = 0; u <= res; u++) {
      for (let v = 0; v <= res; v++) {
        const theta = (u / res) * Math.PI
        const phi = (v / res) * 2 * Math.PI
        pts.push([
          meanX + stdX * 1.5 * Math.sin(theta) * Math.cos(phi),
          meanY + stdY * 1.5 * Math.sin(theta) * Math.sin(phi),
          meanZ + stdZ * 1.5 * Math.cos(theta),
        ])
      }
    }
    return pts
  }, [compact, meanX, meanY, meanZ, stdX, stdY, stdZ])

  useEffect(() => {
    if (!chartRef.current || trajectoryData.length === 0) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }
    const chart = chartInstance.current

    const series: any[] = [
      // Trajectory line
      {
        type: 'line3D',
        data: trajectoryData,
        lineStyle: { width: compact ? 2 : 3, opacity: 0.7 },
        animation: true,
        animationDurationUpdate: 500,
      },
      // Scatter overlay
      {
        type: 'scatter3D',
        data: trajectoryData,
        symbolSize: compact
          ? (val: number[]) => 3 + (val[3] || 0) * 0.8
          : (val: number[]) => 5 + (val[3] || 0) * 2,
        itemStyle: { opacity: compact ? 0.6 : 0.85, borderWidth: 0 },
      },
    ]

    // Center point + ellipsoid (detailed only)
    if (!compact && normalZone.length > 0) {
      series.push({
        type: 'scatter3D',
        data: [[meanX, meanY, meanZ, 0, 0]],
        symbolSize: 10,
        itemStyle: { color: '#ffffff', opacity: 0.8, borderWidth: 2, borderColor: '#3b9eff' },
      })
      series.push({
        type: 'scatter3D',
        data: normalZone,
        symbolSize: 2,
        itemStyle: { color: '#3b9eff', opacity: 0.08 },
        silent: true,
      })
    }

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (p: any) => {
          if (!p.data || p.seriesType === 'surface') return ''
          const d = p.data
          const idx = Math.round(d[4] || 0)
          const timeStr = idx >= 0 && idx < times.length
            ? new Date(times[idx]).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '--'
          return `<span style="color:#FF9F1C;font-weight:600;">Время: ${timeStr}</span><br>`
            + `X бок.: <b>${d[0]?.toFixed(2) ?? '--'}</b> м/с²<br>`
            + `Y прод.: <b>${d[1]?.toFixed(2) ?? '--'}</b> м/с²<br>`
            + `Z верт.: <b>${d[2]?.toFixed(2) ?? '--'}</b> м/с²<br>`
            + `Общая: <b style="color:${d[3] > 5 ? '#ef4444' : d[3] > 2 ? '#f59e0b' : '#4ade80'}">${d[3]?.toFixed(2) ?? '--'}</b> м/с²`
        },
      },
      visualMap: {
        show: !compact,
        min: 0,
        max: maxVib,
        dimension: 3,
        inRange: { color: ['#3b9eff', '#4ade80', '#FF9F1C', '#ff2047'] },
        textStyle: { color: '#aaa', fontFamily: "var(--f-mono)", fontSize: 10 },
        right: 10,
        top: 10,
        text: ['⚠ Тряска', '✓ Норма'],
        itemWidth: 10,
        itemHeight: compact ? 60 : 140,
      },
      grid3D: {
        boxWidth: compact ? 80 : 90,
        boxHeight: compact ? 50 : 60,
        boxDepth: compact ? 80 : 90,
        viewControl: {
          distance: compact ? 240 : 220,
          alpha: 25,
          beta: 40,
          autoRotate: true,
          autoRotateSpeed: 2,
          damping: 0.93,
        },
        axisLine: { lineStyle: { color: 'rgba(240,240,250,0.18)' } },
        axisLabel: { color: 'rgba(240,240,250,0.4)', fontFamily: "var(--f-mono)", fontSize: 9 },
        axisPointer: { lineStyle: { color: 'rgba(255,159,28,0.35)' } },
        splitLine: { lineStyle: { color: 'rgba(240,240,250,0.05)' } },
        environment: 'transparent',
        light: {
          main: { intensity: 1.0, shadow: !compact, shadowQuality: 'medium', alpha: 40, beta: 30 },
          ambient: { intensity: 0.4 },
        },
        postEffect: { enable: true, bloom: { enable: true, intensity: 0.1 } },
      },
      xAxis3D: {
        type: 'value', name: compact ? 'X' : 'X бок.',
        nameTextStyle: { color: '#ef4444', fontSize: compact ? 9 : 11, fontWeight: 'bold' },
        axisLabel: { color: '#888', formatter: (v: number) => v.toFixed(1) },
      },
      yAxis3D: {
        type: 'value', name: compact ? 'Y' : 'Y прод.',
        nameTextStyle: { color: '#4ade80', fontSize: compact ? 9 : 11, fontWeight: 'bold' },
        axisLabel: { color: '#888', formatter: (v: number) => v.toFixed(1) },
      },
      zAxis3D: {
        type: 'value', name: compact ? 'Z' : 'Z верт.',
        nameTextStyle: { color: '#60a5fa', fontSize: compact ? 9 : 11, fontWeight: 'bold' },
        axisLabel: { color: '#888', formatter: (v: number) => v.toFixed(1) },
      },
      series,
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize) }
  }, [trajectoryData, times, maxVib, compact, normalZone, meanX, meanY, meanZ])

  // Cleanup
  useEffect(() => {
    return () => { chartInstance.current?.dispose(); chartInstance.current = null }
  }, [])

  if (data.length === 0) {
    return (
      <GlassPanel style={{ height: compact ? 240 : 420 }}>
        <div className="hud-header mb-3">Вибрация 3D</div>
        <div className="flex items-center justify-center" style={{ height: '60%', color: theme.text.muted, fontSize: 12 }}>Нет данных</div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div ref={chartRef} style={{ width: '100%', height: compact ? 240 : 420 }} />

      {/* Status overlay */}
      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 10,
        background: 'rgba(5,10,15,0.88)', borderRadius: 4, padding: '6px 10px',
        border: '1px solid var(--border-frost)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, boxShadow: `0 0 8px ${st.color}`, animation: 'pulse-critical 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 16, fontWeight: 700, color: st.color, textShadow: `0 0 8px ${st.color}44` }}>{total.toFixed(1)}</span>
          <span style={{ fontSize: 9, color: theme.text.muted }}>м/с²</span>
        </div>
        <p style={{ fontSize: 9, color: theme.text.muted, maxWidth: 180 }}>{st.text}</p>
      </div>
    </GlassPanel>
  )
}
