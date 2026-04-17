import type { CSSProperties } from 'react'

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  fill?: boolean
  style?: CSSProperties
}

export function MiniSparkline({
  data,
  width = 120,
  height = 28,
  strokeWidth = 1,
  fill = true,
  style,
}: MiniSparklineProps) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} style={style} />
  }

  const pad = 1
  const w = width - pad * 2
  const h = height - pad * 2

  let min = data[0]
  let max = data[0]
  for (const v of data) {
    if (v < min) min = v
    if (v > max) max = v
  }
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
              <stop offset="0%" stopColor="rgba(239,242,247,0.22)" />
              <stop offset="100%" stopColor="rgba(239,242,247,0)" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        </>
      )}
      <path d={linePath} fill="none" stroke="var(--c-spectral)" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
