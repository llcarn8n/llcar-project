import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { GlassPanel } from '../shared/GlassPanel'

// ── Types ──

export interface HistoryPoint {
  time: string
  overall: number
  suspension: number
  engine: number
  electrical: number
  audio: number
  confidence: number
  degradation: boolean
  trend: number
  regime: string
  top_diagnostic: string
  top_diagnostic_confidence: number
}

export interface AnomalyTimelineProps {
  history: HistoryPoint[]
  selectedSystem?: string | null
  compact?: boolean
}

// ── Constants ──

const LINE_COLORS: Record<string, string> = {
  overall: '#00E5FF',
  suspension: '#00E5FF',
  engine: '#7C4DFF',
  electrical: '#FFAB00',
  audio: '#FF4081',
}

const REGIME_COLORS: Record<string, string> = {
  idle: 'rgba(128,128,128,0.05)',
  city: 'rgba(33,150,243,0.05)',
  highway: 'rgba(76,175,80,0.05)',
  acceleration: 'rgba(0,229,255,0.05)',
}

const REGIME_LABELS: Record<string, string> = {
  idle: '\u0425\u043e\u043b\u043e\u0441\u0442\u043e\u0439 \u0445\u043e\u0434',
  city: '\u0413\u043e\u0440\u043e\u0434',
  highway: '\u0422\u0440\u0430\u0441\u0441\u0430',
  acceleration: '\u0420\u0430\u0437\u0433\u043e\u043d',
}

const SYSTEM_LABELS: Record<string, string> = {
  overall: '\u041e\u0431\u0449\u0435\u0435',
  suspension: '\u041f\u043e\u0434\u0432\u0435\u0441\u043a\u0430',
  engine: '\u0414\u0432\u0438\u0433\u0430\u0442\u0435\u043b\u044c',
  electrical: '\u042d\u043b\u0435\u043a\u0442\u0440\u0438\u043a\u0430',
  audio: '\u0410\u0443\u0434\u0438\u043e',
}

const SUBSYSTEMS = ['suspension', 'engine', 'electrical', 'audio'] as const

/** Returns color based on health score value */
function scoreColor(value: number): string {
  if (value > 80) return '#00E5FF'
  if (value >= 50) return '#FFAB00'
  return '#FF1744'
}

/** Format time label for X axis */
function formatTimeLabel(val: string): string {
  const d = new Date(val)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return h + ':' + m
}

/** Build tooltip formatter with closure over history data */
function buildTooltipFormatter(history: HistoryPoint[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function tooltipFormatter(params: any): string {
    if (!params || !Array.isArray(params) || params.length === 0) return ''
    const time = params[0].axisValue as string
    const point = history.find((p) => p.time === time)

    if (!point) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lines = params.map((p: any) =>
        '<span style="color:' + p.color + '">\u25CF</span> ' + p.seriesName + ': <b>' + p.value[1] + '</b>'
      )
      return (
        '<div style="font-size:11px;margin-bottom:4px;color:rgba(255,255,255,0.5)">' +
        new Date(time).toLocaleString('ru-RU') +
        '</div>' +
        lines.join('<br/>')
      )
    }

    const regimeLabel = REGIME_LABELS[point.regime] || point.regime
    const diagConf = (point.top_diagnostic_confidence * 100).toFixed(0)
    const trendSign = point.trend > 0 ? '+' : ''

    let html = ''
    html += '<div style="font-size:11px;margin-bottom:6px;color:rgba(255,255,255,0.5)">'
    html += new Date(time).toLocaleString('ru-RU') + '</div>'

    html += '<div style="margin-bottom:4px">'
    html += '<span style="color:' + LINE_COLORS.overall + '">\u25CF</span> '
    html += '\u041e\u0431\u0449\u0435\u0435: <b style="color:' + scoreColor(point.overall) + '">' + point.overall + '</b></div>'

    html += '<div><span style="color:' + LINE_COLORS.suspension + '">\u25CF</span> \u041f\u043e\u0434\u0432\u0435\u0441\u043a\u0430: <b>' + point.suspension + '</b></div>'
    html += '<div><span style="color:' + LINE_COLORS.engine + '">\u25CF</span> \u0414\u0432\u0438\u0433\u0430\u0442\u0435\u043b\u044c: <b>' + point.engine + '</b></div>'
    html += '<div><span style="color:' + LINE_COLORS.electrical + '">\u25CF</span> \u042d\u043b\u0435\u043a\u0442\u0440\u0438\u043a\u0430: <b>' + point.electrical + '</b></div>'
    html += '<div><span style="color:' + LINE_COLORS.audio + '">\u25CF</span> \u0410\u0443\u0434\u0438\u043e: <b>' + point.audio + '</b></div>'

    html += '<div style="margin-top:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">'
    html += '<div style="color:rgba(255,255,255,0.5)">\u0420\u0435\u0436\u0438\u043c: <span style="color:#fff">' + regimeLabel + '</span></div>'
    html += '<div style="color:rgba(255,255,255,0.5)">\u0414\u0438\u0430\u0433\u043d.: <span style="color:#fff">' + point.top_diagnostic + '</span> (' + diagConf + '%)</div>'
    if (point.degradation) {
      html += '<div style="color:#FF1744;margin-top:2px">\u26A0 CUSUM \u0442\u0440\u0435\u0432\u043e\u0433\u0430</div>'
    }
    html += '<div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:2px">'
    html += '\u0422\u0440\u0435\u043d\u0434: ' + trendSign + point.trend.toFixed(1) + ' \u043e\u0447\u043a/\u0434\u0435\u043d\u044c</div>'
    html += '</div>'

    return html
  }
}

// ── Component ──

export function AnomalyTimeline({ history, selectedSystem, compact = false }: AnomalyTimelineProps) {
  const chartHeight = compact ? 180 : 320

  const option = useMemo(() => {
    if (!history || history.length === 0) return null

    const times = history.map((p) => p.time)

    // Build regime background markAreas
    const regimeAreas: Array<[{ xAxis: string; itemStyle: { color: string } }, { xAxis: string }]> = []
    let currentRegime: string | null = null
    let regimeStart = ''

    for (let i = 0; i < history.length; i++) {
      const regime = history[i].regime
      if (regime !== currentRegime) {
        if (currentRegime && regimeStart) {
          regimeAreas.push([
            { xAxis: regimeStart, itemStyle: { color: REGIME_COLORS[currentRegime] || 'transparent' } },
            { xAxis: history[i].time },
          ])
        }
        currentRegime = regime
        regimeStart = history[i].time
      }
    }
    // Close last regime segment
    if (currentRegime && regimeStart && history.length > 0) {
      regimeAreas.push([
        { xAxis: regimeStart, itemStyle: { color: REGIME_COLORS[currentRegime] || 'transparent' } },
        { xAxis: history[history.length - 1].time },
      ])
    }

    // Degradation alarm diamond markers
    const degradationPoints = history
      .filter((p) => p.degradation)
      .map((p) => ({
        coord: [p.time, p.overall],
        symbol: 'diamond',
        symbolSize: compact ? 8 : 12,
        itemStyle: {
          color: '#FF1744',
          borderColor: '#FF1744',
          borderWidth: 1,
          shadowColor: 'rgba(255,23,68,0.6)',
          shadowBlur: 8,
        },
      }))

    // Opacity helpers for system selection highlighting
    function subsystemOpacity(system: string): number {
      if (!selectedSystem) return 0.5
      if (selectedSystem === system) return 0.9
      return 0.08
    }

    function overallOpacity(): number {
      if (!selectedSystem || selectedSystem === 'overall') return 1
      return 0.2
    }

    const lineWidth = 2
    const subLineWidth = 1.5

    // Overall health score series (main line)
    const overallSeries = {
      name: SYSTEM_LABELS.overall,
      type: 'line' as const,
      data: history.map((p) => [p.time, p.overall]),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: lineWidth,
        opacity: overallOpacity(),
      },
      areaStyle: {
        opacity: overallOpacity() * 0.15,
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0,229,255,0.3)' },
            { offset: 1, color: 'rgba(0,229,255,0)' },
          ],
        },
      },
      markPoint: {
        data: degradationPoints,
        label: {
          show: !compact,
          formatter: 'CUSUM',
          fontSize: 9,
          color: '#FF1744',
          position: 'top',
          distance: 8,
        },
      },
      markArea: {
        silent: true,
        data: regimeAreas,
      },
      z: 10,
    }

    // Subsystem series (thinner, semi-transparent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subsystemSeries = SUBSYSTEMS.map((sys) => ({
      name: SYSTEM_LABELS[sys],
      type: 'line' as const,
      data: history.map((p: any) => [p.time, p[sys]]),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: subLineWidth,
        color: LINE_COLORS[sys],
        opacity: subsystemOpacity(sys),
      },
      itemStyle: {
        color: LINE_COLORS[sys],
      },
      z: selectedSystem === sys ? 11 : 5,
    }))

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 800,
      grid: {
        top: compact ? 10 : 40,
        right: compact ? 12 : 20,
        bottom: compact ? 40 : 55,
        left: compact ? 36 : 52,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(12,18,32,0.95)',
        borderColor: 'rgba(0,229,255,0.2)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12,
          fontFamily: 'Consolas, monospace',
        },
        formatter: buildTooltipFormatter(history),
      },
      legend: compact
        ? undefined
        : {
            show: true,
            top: 8,
            right: 10,
            textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
            itemWidth: 14,
            itemHeight: 2,
            data: [
              { name: SYSTEM_LABELS.overall, itemStyle: { color: LINE_COLORS.overall } },
              { name: SYSTEM_LABELS.suspension, itemStyle: { color: LINE_COLORS.suspension } },
              { name: SYSTEM_LABELS.engine, itemStyle: { color: LINE_COLORS.engine } },
              { name: SYSTEM_LABELS.electrical, itemStyle: { color: LINE_COLORS.electrical } },
              { name: SYSTEM_LABELS.audio, itemStyle: { color: LINE_COLORS.audio } },
            ],
          },
      xAxis: {
        type: 'category' as const,
        data: times,
        axisLine: { lineStyle: { color: 'rgba(0,229,255,0.15)' } },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(255,255,255,0.4)',
          fontSize: compact ? 9 : 10,
          fontFamily: 'Consolas, monospace',
          formatter: formatTimeLabel,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        min: 0,
        max: 100,
        name: compact ? '' : '\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435 %',
        nameTextStyle: {
          color: 'rgba(255,255,255,0.4)',
          fontSize: 10,
          fontFamily: 'Consolas, monospace',
          padding: [0, 0, 0, -10],
        },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          formatter: '{value}',
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0,229,255,0.05)',
            type: 'dashed' as const,
          },
        },
      },
      // Color the overall line by score value ranges
      visualMap: {
        show: false,
        seriesIndex: 0,
        pieces: [
          { gt: 80, lte: 100, color: '#00E5FF' },
          { gt: 50, lte: 80, color: '#FFAB00' },
          { gte: 0, lte: 50, color: '#FF1744' },
        ],
        outOfRange: { color: '#FF1744' },
      },
      dataZoom: [
        { type: 'slider', start: 70, end: 100, height: 20, bottom: 5, borderColor: 'rgba(0,229,255,0.2)', fillerColor: 'rgba(0,229,255,0.05)', handleStyle: { color: '#00E5FF' }, textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 9 } },
        { type: 'inside', start: 70, end: 100 },
      ],
      series: [overallSeries, ...subsystemSeries],
    }
  }, [history, selectedSystem, compact])

  // Empty state
  if (!history || history.length === 0) {
    return (
      <GlassPanel>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: chartHeight,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: 'Consolas, monospace',
            fontSize: 14,
            letterSpacing: 1,
          }}
        >
          {'\u041d\u0435\u0442 \u0438\u0441\u0442\u043e\u0440\u0438\u0438'}
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel>
      <ReactECharts
        option={option!}
        style={{ height: chartHeight, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </GlassPanel>
  )
}
