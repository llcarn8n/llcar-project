import { useMemo, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'
import type { AudioSample } from './AudioSpectrum'

interface AudioTabProps {
  data: AudioSample[]
}

/* ── 6 зон из V2 template ── */
const ZONES = [
  { name: 'Низкий гул (дорога)', color: '#60a5fa', min: 0, max: 80 },
  { name: 'Гул двигателя', color: '#4ade80', min: 80, max: 150 },
  { name: 'Трансмиссия', color: '#22d3ee', min: 150, max: 300 },
  { name: 'Навесное оборудование', color: '#f59e0b', min: 300, max: 600 },
  { name: 'Подшипники / клапаны', color: '#f97316', min: 600, max: 2000 },
  { name: 'Высокочаст. шум', color: '#ef4444', min: 2000, max: 99999 },
]

/* ── 4 полосы для line chart ── */
const BANDS = [
  { name: 'Дорога (<100 Гц)', color: '#60a5fa', min: 0, max: 100 },
  { name: 'Двигатель (100–300 Гц)', color: '#4ade80', min: 100, max: 300 },
  { name: 'Навесное (300–1000 Гц)', color: '#f59e0b', min: 300, max: 1000 },
  { name: 'Шум (>1000 Гц)', color: '#ef4444', min: 1000, max: 99999 },
]

function qualityColor(q: number): string {
  if (q >= 70) return theme.status.ok
  if (q >= 40) return theme.status.warning
  return theme.status.critical
}

export function AudioTab({ data }: AudioTabProps) {
  const chartMainRef = useRef<HTMLDivElement>(null)
  const chartQualRef = useRef<HTMLDivElement>(null)

  const last = data.length > 0 ? data[data.length - 1] : null

  // ── Status ──
  const { avgQual, statusIcon, statusTitle, statusDesc, statusColor } = useMemo(() => {
    let qualSum = 0, qualCnt = 0
    for (const a of data) {
      if (a.quality != null) { qualSum += a.quality; qualCnt++ }
    }
    const avg = qualCnt ? qualSum / qualCnt : 0

    let highFreq = false
    if (last?.freqs) {
      for (const f of last.freqs) { if (f[0] > 500) { highFreq = true; break } }
    }

    return {
      avgQual: Math.round(avg),
      statusIcon: highFreq ? '⚠️' : '✅',
      statusTitle: highFreq ? 'Обнаружены нетипичные частоты' : 'Звуковой фон в норме',
      statusDesc: highFreq
        ? 'Микрофон зафиксировал высокочастотные звуки (>500 Гц). Это может указывать на износ подшипников или ремня. Рекомендуется проверка.'
        : `Микрофон слышит только низкочастотный гул двигателя и дороги (50–290 Гц). Высокочастотных аномалий (свист, скрежет) не обнаружено. Качество записи: ${Math.round(avg)}/100.`,
      statusColor: highFreq ? theme.status.warning : theme.status.ok,
    }
  }, [data, last])

  // ── Zone bars (last sample) ──
  const zoneBars = useMemo(() => {
    if (!last?.freqs?.length) return []
    const zones = ZONES.map(z => ({ ...z, sum: 0, count: 0, freqList: [] as number[] }))
    for (const [hz, amp] of last.freqs) {
      for (const z of zones) {
        if (hz >= z.min && hz < z.max) {
          z.sum += Math.abs(amp || 0)
          z.count++
          z.freqList.push(hz)
          break
        }
      }
    }
    const active = zones.filter(z => z.count > 0).sort((a, b) => b.sum - a.sum)
    const maxSum = active.length ? active[0].sum : 1
    return active.map(z => ({ ...z, pct: Math.round(z.sum / maxSum * 100) }))
  }, [last])

  // ── Звук по времени (ECharts) ──
  useEffect(() => {
    if (!chartMainRef.current || data.length === 0) return
    const chart = echarts.getInstanceByDom(chartMainRef.current) || echarts.init(chartMainRef.current)

    // Compute band sums per sample
    const rawBands: { ts: string; v: number }[][] = BANDS.map(() => [])
    for (const a of data) {
      const sums = [0, 0, 0, 0]
      if (a.freqs) {
        for (const [hz, amp] of a.freqs) {
          for (let bi = 0; bi < BANDS.length; bi++) {
            if (hz >= BANDS[bi].min && hz < BANDS[bi].max) { sums[bi] += Math.abs(amp || 0); break }
          }
        }
      }
      for (let bi = 0; bi < 4; bi++) rawBands[bi].push({ ts: a.ts, v: sums[bi] })
    }

    // Moving average (window=10) + downsample
    const win = 10
    const step = data.length > 400 ? Math.ceil(data.length / 400) : 1
    const bandData: [string, number][][] = BANDS.map(() => [])
    for (let bi = 0; bi < 4; bi++) {
      const raw = rawBands[bi]
      for (let i = 0; i < raw.length; i += step) {
        let sum = 0, cnt = 0
        for (let w = Math.max(0, i - win); w <= Math.min(raw.length - 1, i + win); w++) {
          sum += raw[w].v; cnt++
        }
        bandData[bi].push([raw[i].ts, Math.round(sum / cnt)])
      }
    }

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111116',
        borderColor: 'rgba(0,229,255,0.15)',
        textStyle: { color: '#c0c0cc', fontSize: 11 },
      },
      legend: {
        data: BANDS.map(b => b.name),
        top: 0, textStyle: { color: '#888', fontSize: 10 }, itemWidth: 12, itemHeight: 8,
      },
      grid: { left: 55, right: 20, top: 35, bottom: 30 },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#aaa', fontSize: 10, formatter: (v: number) => {
          const d = new Date(v)
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        }},
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value', name: 'Громкость',
        nameTextStyle: { color: '#888', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#888', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      series: BANDS.map((b, i) => ({
        name: b.name, type: 'line' as const, symbol: 'none', sampling: 'lttb', smooth: true,
        data: bandData[i],
        lineStyle: { width: 2, color: b.color, shadowColor: b.color + '40', shadowBlur: 6 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: b.color + '25' },
            { offset: 1, color: b.color + '03' },
          ]),
        },
      })),
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [data])

  // ── Качество записи (ECharts) ──
  useEffect(() => {
    if (!chartQualRef.current || data.length === 0) return
    const chart = echarts.getInstanceByDom(chartQualRef.current) || echarts.init(chartQualRef.current)

    const qualData = data.filter(d => d.quality != null).map(d => [d.ts, d.quality])

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111116',
        borderColor: 'rgba(0,229,255,0.15)',
        textStyle: { color: '#c0c0cc', fontSize: 11 },
      },
      grid: { left: 50, right: 20, top: 30, bottom: 25 },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#888', fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value', name: 'Качество 0-100', min: 0, max: 100,
        nameTextStyle: { color: '#555', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#888', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      series: [
        {
          name: 'Зоны', type: 'line' as const, data: [],
          markArea: {
            silent: true,
            data: [
              [{ yAxis: 70, itemStyle: { color: 'rgba(74,222,128,0.05)' }, label: { show: true, position: 'insideRight', formatter: 'Хорошо', color: '#4ade8040', fontSize: 9 } }, { yAxis: 100 }],
              [{ yAxis: 40, itemStyle: { color: 'rgba(245,158,11,0.04)' }, label: { show: true, position: 'insideRight', formatter: 'Средне', color: '#f59e0b40', fontSize: 9 } }, { yAxis: 70 }],
              [{ yAxis: 0, itemStyle: { color: 'rgba(239,68,68,0.04)' }, label: { show: true, position: 'insideRight', formatter: 'Плохо', color: '#ef444440', fontSize: 9 } }, { yAxis: 40 }],
            ] as any,
          },
        },
        {
          name: 'Качество', type: 'line' as const, symbol: 'none', sampling: 'lttb',
          data: qualData,
          lineStyle: { width: 2, color: '#22d3ee', shadowColor: 'rgba(34,211,238,0.3)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(34,211,238,0.15)' },
              { offset: 1, color: 'rgba(34,211,238,0)' },
            ]),
          },
        },
      ],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [data])

  if (data.length === 0) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">Аудио анализ</div>
        <div style={{ textAlign: 'center', padding: '40px 0', color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>
          Нет данных аудио. Подключите OBD-адаптер и начните поездку.
        </div>
      </GlassPanel>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status card */}
      <GlassPanel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 36 }}>{statusIcon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: statusColor, fontFamily: "'Rajdhani', sans-serif" }}>
              {statusTitle}
            </div>
            <div style={{ fontSize: 12, color: theme.text.muted, marginTop: 4, lineHeight: 1.5, fontFamily: "'Rajdhani', sans-serif" }}>
              {statusDesc}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: theme.text.muted }}>Качество записи</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: qualityColor(avgQual), fontFamily: "'Share Tech Mono', monospace" }}>
              {avgQual}
            </div>
            <div style={{ fontSize: 10, color: theme.text.muted }}>из 100</div>
          </div>
        </div>
      </GlassPanel>

      {/* Звук по времени */}
      <GlassPanel>
        <div className="hud-header mb-2">Звук по времени</div>
        <div ref={chartMainRef} style={{ width: '100%', height: 280 }} />
      </GlassPanel>

      {/* Качество записи + Zone bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <GlassPanel>
          <div className="hud-header mb-2">Качество записи</div>
          <div ref={chartQualRef} style={{ width: '100%', height: 200 }} />
        </GlassPanel>

        <GlassPanel>
          <div className="hud-header mb-2">Сейчас (последний замер)</div>
          <div style={{ padding: '8px 0' }}>
            {zoneBars.map(z => (
              <div key={z.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: z.color, fontWeight: 600, fontFamily: "'Rajdhani', sans-serif" }}>{z.name}</span>
                  <span style={{ fontSize: 9, color: theme.text.muted, fontFamily: "'Share Tech Mono', monospace" }}>
                    {z.freqList.sort((a, b) => a - b).join(', ')} Гц
                  </span>
                </div>
                <div style={{ height: 22, background: 'rgba(255,255,255,0.03)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', width: `${z.pct}%`,
                    background: `linear-gradient(90deg, ${z.color}50, ${z.color})`,
                    borderRadius: 6, transition: 'width 0.5s',
                    boxShadow: `0 0 10px ${z.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                  }}>
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, fontFamily: "'Share Tech Mono', monospace", textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {Math.round(z.sum)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {zoneBars.length === 0 && (
              <div style={{ color: theme.text.muted, fontSize: 12, textAlign: 'center', padding: 20 }}>Нет частотных данных</div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Объяснения зон */}
      <GlassPanel>
        <div className="hud-header mb-2">Что означают зоны</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: theme.text.muted, lineHeight: 1.5 }}>
          <div><span style={{ color: '#60a5fa', fontWeight: 600 }}>Дорога (&lt;100 Гц)</span> — шум покрытия, колёс, аэродинамики. Норма для любого авто.</div>
          <div><span style={{ color: '#4ade80', fontWeight: 600 }}>Двигатель (100–300 Гц)</span> — рабочий гул мотора. Рост = износ опор, выхлопа.</div>
          <div><span style={{ color: '#f59e0b', fontWeight: 600 }}>Навесное (300–1000 Гц)</span> — генератор, компрессор, помпа. Свист = ремень или подшипник.</div>
          <div><span style={{ color: '#ef4444', fontWeight: 600 }}>Высокочаст. шум (&gt;1000 Гц)</span> — скрежет, свист, писк. Почти всегда проблема.</div>
        </div>
      </GlassPanel>
    </div>
  )
}
