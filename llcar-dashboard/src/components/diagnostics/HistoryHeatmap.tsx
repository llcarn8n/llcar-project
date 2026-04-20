import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { HistoryEntry } from '../../hooks/useDiagnosticV2'

interface HistoryHeatmapProps {
  history: HistoryEntry[] | null | undefined
  height?: number
}

const SYSTEMS: Array<{ key: keyof HistoryEntry; label: string }> = [
  { key: 'suspension_score', label: 'Подвеска' },
  { key: 'engine_score', label: 'Двигатель' },
  { key: 'electrical_score', label: 'Электрика' },
  { key: 'audio_score', label: 'Звук' },
]

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return iso
  }
}

// Хеатмап истории состояния систем.
// Ось X — время (шаги истории), ось Y — системы.
// Значение = severity (100 - score): чем ниже score, тем «горячее» ячейка.
export function HistoryHeatmap({ history, height = 220 }: HistoryHeatmapProps) {
  const { xLabels, data, hasData } = useMemo(() => {
    const h = history ?? []
    if (h.length === 0) {
      return { xLabels: [] as string[], data: [] as Array<[number, number, number]>, hasData: false }
    }
    // Downsample если история >30 точек — берём равномерно каждую k-ю
    const step = Math.max(1, Math.ceil(h.length / 30))
    const sampled: HistoryEntry[] = []
    for (let i = 0; i < h.length; i += step) sampled.push(h[i])

    const labels = sampled.map((e) => formatDate(e.time))
    const cells: Array<[number, number, number]> = []
    for (let xi = 0; xi < sampled.length; xi++) {
      const entry = sampled[xi]
      for (let yi = 0; yi < SYSTEMS.length; yi++) {
        const rawScore = entry[SYSTEMS[yi].key]
        const score = typeof rawScore === 'number' && Number.isFinite(rawScore) ? rawScore : 100
        // severity — инверсия: 100 = хорошо (холодно), 0 = катастрофа (горячо)
        const severity = Math.max(0, Math.min(100, 100 - score))
        cells.push([xi, yi, severity])
      }
    }
    return { xLabels: labels, data: cells, hasData: true }
  }, [history])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 78, right: 24, top: 14, bottom: 28 },
    tooltip: {
      position: 'top' as const,
      backgroundColor: 'rgba(16,18,24,0.92)',
      borderColor: 'rgba(230,212,168,0.25)',
      borderWidth: 1,
      textStyle: { color: '#EFF2F7', fontFamily: 'var(--f-body), sans-serif', fontSize: 11 },
      formatter: (params: { value: [number, number, number] }) => {
        const [xi, yi, sev] = params.value
        const system = SYSTEMS[yi]?.label ?? '—'
        const time = xLabels[xi] ?? '—'
        const score = Math.max(0, 100 - sev)
        const state = score >= 80 ? 'норма' : score >= 60 ? 'внимание' : score >= 40 ? 'ухудшено' : 'критика'
        return `${time}<br/>${system}: ${score} — ${state}`
      },
    },
    xAxis: {
      type: 'category' as const,
      data: xLabels,
      axisLabel: {
        color: 'rgba(184,190,199,0.6)',
        fontFamily: 'var(--f-mono), monospace',
        fontSize: 9,
        interval: Math.max(0, Math.floor(xLabels.length / 6) - 1),
      },
      axisLine: { lineStyle: { color: 'rgba(230,212,168,0.18)' } },
      axisTick: { show: false },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: SYSTEMS.map((s) => s.label),
      axisLabel: {
        color: 'rgba(230,212,168,0.85)',
        fontFamily: 'var(--f-display), sans-serif',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.5,
      },
      axisLine: { lineStyle: { color: 'rgba(230,212,168,0.18)' } },
      axisTick: { show: false },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      show: false,
      inRange: {
        color: [
          'rgba(107,224,143,0.08)', // норма — почти прозрачная зелёная
          'rgba(230,212,168,0.28)', // champagne likely
          'rgba(224,180,107,0.55)', // warn
          'rgba(255,74,74,0.78)',   // crit
        ],
      },
    },
    series: [
      {
        type: 'heatmap' as const,
        data,
        label: { show: false },
        itemStyle: { borderRadius: 1, borderColor: 'rgba(16,18,24,0.4)', borderWidth: 1 },
        emphasis: { itemStyle: { borderColor: 'rgba(230,212,168,0.9)', borderWidth: 1 } },
      },
    ],
  }), [xLabels, data])

  if (!hasData) {
    return (
      <div style={{
        padding: '14px 12px',
        color: 'rgba(184,190,199,0.6)',
        fontFamily: 'var(--f-body)',
        fontSize: 11,
        textAlign: 'center',
      }}>
        История пока не накоплена. Точки появятся после нескольких сеансов диагностики.
      </div>
    )
  }

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
    />
  )
}
