// Vibration-аналитика на клиенте поверх истории `accel[]` сэмплов.
// Правила используют az_peak_abs, az_range, crest_factor_z, wheel_hop_peak_freq,
// wheel_hop_peak_shifted — всё вычислимо из последнего окна accel-истории.

export interface AccelHistorySample {
  az_std?: number
  ay_std?: number
  ax_std?: number
  total_vibration?: number
  speed?: number
  ts?: number | string
}

function nums<T extends AccelHistorySample>(samples: T[], key: keyof T): number[] {
  const out: number[] = []
  for (const s of samples) {
    const v = s[key]
    if (typeof v === 'number' && Number.isFinite(v)) out.push(v)
  }
  return out
}

// Пиковое абсолютное значение вертикального ускорения за окно.
export function azPeakAbs(samples: AccelHistorySample[]): number {
  const xs = nums(samples, 'az_std')
  if (xs.length === 0) return 0
  let max = 0
  for (const v of xs) {
    const a = Math.abs(v)
    if (a > max) max = a
  }
  return max
}

// Размах az за окно (max - min).
export function azRange(samples: AccelHistorySample[]): number {
  const xs = nums(samples, 'az_std')
  if (xs.length === 0) return 0
  let lo = xs[0]
  let hi = xs[0]
  for (const v of xs) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return hi - lo
}

// Crest factor = peak / RMS. Индикатор ударности vs равномерной вибрации.
// Высокий crest (>5) — перкуссивные события (яма, стук).
// Низкий (<2) — равномерное дрожание (disc runout, tire imbalance).
export function crestFactorZ(samples: AccelHistorySample[]): number {
  const xs = nums(samples, 'az_std')
  if (xs.length === 0) return 0
  let peak = 0
  let sumSq = 0
  for (const v of xs) {
    const a = Math.abs(v)
    if (a > peak) peak = a
    sumSq += v * v
  }
  const rms = Math.sqrt(sumSq / xs.length)
  if (rms < 1e-6) return 0
  return peak / rms
}

// Оценка доминантной частоты через zero-crossing rate.
// Для accel-серии (az_std — уже std-агрегат, не мгновенное значение) это
// очень грубое приближение, но достаточно для wheel-hop в диапазоне 10-20 Hz
// когда сэмплы приходят с фиксированной частотой (≥ 40 Hz sampling достаточно).
// Если ts недоступен / нестабилен — возвращаем 0.
export function dominantFreqZeroCross(samples: AccelHistorySample[]): number {
  if (samples.length < 4) return 0
  const xs = nums(samples, 'az_std')
  if (xs.length < 4) return 0
  // Demean
  let sum = 0
  for (const v of xs) sum += v
  const mean = sum / xs.length

  let crosses = 0
  for (let i = 1; i < xs.length; i++) {
    const a = xs[i - 1] - mean
    const b = xs[i] - mean
    if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) crosses++
  }

  // Оценка длительности окна в секундах
  const first = samples[0].ts
  const last = samples[samples.length - 1].ts
  const firstN = typeof first === 'number' ? first : (typeof first === 'string' ? Date.parse(first) : NaN)
  const lastN = typeof last === 'number' ? last : (typeof last === 'string' ? Date.parse(last) : NaN)
  if (!Number.isFinite(firstN) || !Number.isFinite(lastN) || lastN <= firstN) return 0
  const durSec = (lastN - firstN) / 1000
  if (durSec < 0.1) return 0
  // crosses per full cycle = 2, поэтому freq = crosses / (2 * durSec)
  return crosses / (2 * durSec)
}

// Wheel hop peak freq — доминантная частота, ограниченная «подозрительным» диапазоном.
// Wheel hop typical 10-20 Hz. Возвращаем 0 если вне диапазона — правила
// проверяют на конкретный диапазон, а не «любая частота».
export function wheelHopPeakFreq(samples: AccelHistorySample[]): number {
  const f = dominantFreqZeroCross(samples)
  if (f < 6 || f > 30) return 0
  return f
}

// Peak-freq, сдвинутая относительно speed. Идея:
// wheel_imbalance имеет частоту ≈ rps = speed_kmh / (3.6 * 2πR).
// Если доминирующая частота близка к rps — imbalance колеса.
// Возвращаем difference в Гц (|f - rps|). Малое значение (<2) = подозрительно.
export function wheelHopPeakShifted(samples: AccelHistorySample[], speedKmh: number | null | undefined): number {
  const f = dominantFreqZeroCross(samples)
  if (!f) return 0
  if (!speedKmh || speedKmh < 5) return f
  const rps = speedKmh / (3.6 * 2 * Math.PI * 0.33)
  return Math.abs(f - rps)
}

// ── Aggregate ──

export interface VibrationMetrics {
  azPeakAbs: number
  azRange: number
  crestFactorZ: number
  wheelHopPeakFreq: number
  wheelHopPeakShifted: number
}

// Вычисление всех метрик на окне последних N сэмплов.
// При пустой/маленькой истории возвращает null — UI показывает «нет данных».
export function computeVibrationMetrics(
  accelHistory: AccelHistorySample[],
  opts: { windowSize?: number; speedKmh?: number | null } = {},
): VibrationMetrics | null {
  if (!Array.isArray(accelHistory) || accelHistory.length === 0) return null
  const window = opts.windowSize ?? 50
  const slice = accelHistory.length > window ? accelHistory.slice(-window) : accelHistory
  return {
    azPeakAbs: azPeakAbs(slice),
    azRange: azRange(slice),
    crestFactorZ: crestFactorZ(slice),
    wheelHopPeakFreq: wheelHopPeakFreq(slice),
    wheelHopPeakShifted: wheelHopPeakShifted(slice, opts.speedKmh ?? null),
  }
}
