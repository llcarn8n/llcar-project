import type { CSSProperties } from 'react'

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  fill?: boolean
  dots?: boolean
  axis?: boolean
  bars?: boolean
  barGap?: number
  seed?: number
  style?: CSSProperties
}

export function MiniSparkline({
  data,
  width = 120,
  height = 28,
  strokeWidth = 1.5,
  fill = true,
  dots = false,
  axis = false,
  bars = false,
  barGap = 2,
  seed = 0,
  style,
}: MiniSparklineProps) {
  if (bars && data && data.length > 0) {
    // Local range with padding so bars always show variation
    let lo = data[0]
    let hi = data[0]
    for (const v of data) {
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
    const natural = hi - lo
    const padY = natural < 8 ? (8 - natural) / 2 : Math.max(1, natural * 0.08)
    const mn = Math.max(0, lo - padY)
    const mx = hi + padY
    const rng = mx - mn || 1
    const n = data.length
    const barW = Math.max(2, (width - barGap * (n - 1)) / n)
    const barGradId = `bar-grad-${Math.random().toString(36).slice(2, 8)}`
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
        <defs>
          <linearGradient id={barGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(168,130,88,0.72)" />
            <stop offset="100%" stopColor="rgba(120,90,60,0.40)" />
          </linearGradient>
        </defs>
        {data.map((v, i) => {
          const h = Math.max(2, ((v - mn) / rng) * (height - 2))
          const x = i * (barW + barGap)
          const y = height - h
          return (
            <rect
              key={i} x={x} y={y} width={barW} height={h}
              rx={0.6} ry={0.6}
              fill={`url(#${barGradId})`}
              stroke="#E6D4A8"
              strokeWidth={0.6}
            />
          )
        })}
      </svg>
    )
  }
  // Art-mountain: if no data OR all values equal — draw decorative silhouette
  // so the block doesn't look empty when backend returns flat history.
  const isFlat = !data || data.length < 2 || new Set(data).size === 1
  if (isFlat) {
    const N = 28
    const pad = 1
    const w = width - pad * 2
    const h = height - pad * 2
    // Smooth mountain curve — unique per seed
    const s = (seed || 0) * 1.37 + 0.5
    const f1 = 1.8 + (seed % 3) * 0.6
    const f2 = 4.3 + (seed % 4) * 0.7
    const f3 = 8.1 + (seed % 5) * 0.5
    const pts: [number, number][] = []
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const v =
        0.45 +
        0.28 * Math.sin(t * Math.PI * f1 + s) +
        0.16 * Math.sin(t * Math.PI * f2 + s * 1.7) +
        0.08 * Math.sin(t * Math.PI * f3 + s * 2.3)
      const clamped = Math.max(0.05, Math.min(0.95, v))
      pts.push([pad + t * w, pad + h - clamped * h])
    }
    const artLine = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
    const artArea = artLine + ` L${pts[pts.length - 1][0].toFixed(2)},${height - pad} L${pts[0][0].toFixed(2)},${height - pad} Z`
    const artGradId = `art-${Math.random().toString(36).slice(2, 8)}`
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
        <defs>
          <linearGradient id={artGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(184,190,199,0.32)" />
            <stop offset="55%" stopColor="rgba(184,190,199,0.14)" />
            <stop offset="100%" stopColor="rgba(184,190,199,0)" />
          </linearGradient>
        </defs>
        <path d={artArea} fill={`url(#${artGradId})`} stroke="none" />
        <path
          d={artLine}
          fill="none"
          stroke="rgba(184,190,199,0.65)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  const pad = 1
  const w = width - pad * 2
  const h = height - pad * 2

  // Local min/max — даёт видимую волну даже при узком диапазоне значений.
  // Если range < 8, искусственно расширяем чтобы колебания были видны.
  let lo = data[0]
  let hi = data[0]
  for (const v of data) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const natural = hi - lo
  const paddingY = natural < 8 ? (8 - natural) / 2 : Math.max(1, natural * 0.08)
  const min = lo - paddingY
  const max = hi + paddingY
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w
    const y = pad + h - ((v - min) / range) * h
    return [x, y] as const
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const areaPath =
    linePath +
    ` L${points[points.length - 1][0].toFixed(2)},${height - pad} L${points[0][0].toFixed(2)},${height - pad} Z`

  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(184,190,199,0.18)" />
              <stop offset="100%" stopColor="rgba(184,190,199,0)" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        </>
      )}
      {axis && (
        <line
          x1={pad} y1={height - pad} x2={width - pad} y2={height - pad}
          stroke="var(--c-spectral-divider, rgba(184,190,199,0.18))"
          strokeWidth={0.7} strokeDasharray="2 3"
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke="rgba(184,190,199,0.75)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {dots && points.map(([x, y], i) => (
        <circle
          key={i} cx={x} cy={y} r={strokeWidth + 0.4}
          fill="var(--c-champagne-hi, #F2E4C2)"
          stroke="var(--c-void, #07080F)"
          strokeWidth={0.6}
        />
      ))}
    </svg>
  )
}
