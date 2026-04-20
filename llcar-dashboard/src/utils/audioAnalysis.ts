// Аудио-аналитика для диагностики по компонентам.
// Вычисляет энергию в полосах, ударные события, гармонические совпадения
// с скоростью/оборотами — всё на основе FFT-пиков, которые бэк шлёт
// в `audio.freqs` + `audio.amps` (либо как parallel-arrays, либо как пары).

// Robust unpack freqs/amps — backend sends one of two shapes:
// 1) parallel arrays: { freqs: number[], amps: number[] }
// 2) pairs: { freqs: [number, number][] }
// Возвращаем пары [freqHz, amp] в едином формате.
export function unpackPeaks(sample: unknown): Array<[number, number]> {
  if (!sample || typeof sample !== 'object') return []
  const s = sample as { freqs?: unknown; amps?: unknown }
  const freqs = s.freqs
  if (!Array.isArray(freqs)) return []

  // Пары [f, a]
  if (freqs.length > 0 && Array.isArray(freqs[0])) {
    const out: Array<[number, number]> = []
    for (const pair of freqs) {
      if (Array.isArray(pair) && pair.length >= 2 &&
          typeof pair[0] === 'number' && typeof pair[1] === 'number') {
        out.push([pair[0], Math.abs(pair[1])])
      }
    }
    return out
  }

  // Parallel arrays
  const amps = Array.isArray(s.amps) ? s.amps : []
  const out: Array<[number, number]> = []
  for (let i = 0; i < freqs.length; i++) {
    const f = freqs[i]
    const a = amps[i]
    if (typeof f === 'number' && typeof a === 'number') {
      out.push([f, Math.abs(a)])
    }
  }
  return out
}

// Сумма амплитуд в частотной полосе (loHz, hiHz] включительно по нижнему краю.
export function sumAmpsInBand(sample: unknown, loHz: number, hiHz: number): number {
  const peaks = unpackPeaks(sample)
  let sum = 0
  for (const [f, a] of peaks) {
    if (f >= loHz && f <= hiHz) sum += a
  }
  return sum
}

// Count peaks above threshold in band.
export function peakCountInBand(sample: unknown, loHz: number, hiHz: number, threshold = 0): number {
  const peaks = unpackPeaks(sample)
  let count = 0
  for (const [f, a] of peaks) {
    if (f >= loHz && f <= hiHz && a > threshold) count++
  }
  return count
}

// ── Именованные band-вычисления ──

// 120-180 Hz — износ сайлентблоков / bushings (literature: 0-200Hz low-freq suspension)
export function energyBand120_180(sample: unknown): number {
  return sumAmpsInBand(sample, 120, 180)
}

// 5000-8000 Hz — перкуссивные высокочастотные события (свист тормоза, скрип ремня)
export function percussiveEnergy5k8k(sample: unknown): number {
  return sumAmpsInBand(sample, 5000, 8000)
}

// Peak-count в 5k-8k (не суммарная энергия, а число событий — отличает стабильный свист от случайных шумов)
export function percussivePeakCount5k8k(sample: unknown, threshold = 0.05): number {
  return peakCountInBand(sample, 5000, 8000, threshold)
}

// ── Гармонические совпадения со скоростью (BPFO подшипников) ──
// BPFO ≈ (n/2) * rps * (1 - (d/D)cosθ) ≈ 3.5-4.5 * rps для typical ball bearing.
// Для эвристики: rps = speed_kmh / (3.6 * 2πR), R≈0.33м → rps ≈ speed / 7.47.
// BPFO harmonic ≈ 4 * rps. Ищем пики в ±10% от BPFO и его 2-й, 3-й гармоник.
export function bpfoHarmonicMatches(sample: unknown, speedKmh: number): number {
  if (!speedKmh || speedKmh < 5) return 0
  const rps = speedKmh / (3.6 * 2 * Math.PI * 0.33) // оборотов колеса в секунду
  const bpfoBase = 4 * rps // типичная эвристика
  const peaks = unpackPeaks(sample)
  let matches = 0
  for (let harmonic = 1; harmonic <= 3; harmonic++) {
    const target = bpfoBase * harmonic
    const tol = target * 0.1 // ±10%
    for (const [f, a] of peaks) {
      if (Math.abs(f - target) <= tol && a > 0.02) {
        matches++
        break // один match на гармонику достаточно
      }
    }
  }
  return matches
}

// ── Audio-speed ratio ──
// Если шум растёт быстрее чем скорость — подшипник/шина деградируют.
// Возвращает dominant_amp / max(speedKmh, 1). Значения >0.01 — подозрение.
export function audioSpeedRatio(sample: unknown, speedKmh: number): number {
  const peaks = unpackPeaks(sample)
  if (peaks.length === 0) return 0
  let maxAmp = 0
  for (const [, a] of peaks) if (a > maxAmp) maxAmp = a
  const denom = Math.max(speedKmh || 0, 1)
  return maxAmp / denom
}

// ── RPM harmonic matches ──
// Вибрации двигателя на 1-й, 2-й, 4-й гармонике от rpm/60 (Hz).
// Пики на этих частотах = signature проблемы двигателя (misfire, imbalance).
export function rpmHarmonicMatches(sample: unknown, rpm: number): number {
  if (!rpm || rpm < 500) return 0
  const baseHz = rpm / 60
  const peaks = unpackPeaks(sample)
  let matches = 0
  for (const mult of [1, 2, 4]) {
    const target = baseHz * mult
    const tol = target * 0.05
    for (const [f, a] of peaks) {
      if (Math.abs(f - target) <= tol && a > 0.03) {
        matches++
        break
      }
    }
  }
  return matches
}

// ── Aggregate ──

export interface AudioMetrics {
  energyBand120_180: number
  percussiveEnergy5k8k: number
  percussivePeakCount5k8k: number
  bpfoHarmonicMatches: number
  audioSpeedRatio: number
  rpmHarmonicMatches: number
}

export function computeAudioMetrics(
  sample: unknown,
  opts: { speedKmh?: number | null; rpm?: number | null } = {},
): AudioMetrics | null {
  if (!sample) return null
  return {
    energyBand120_180: energyBand120_180(sample),
    percussiveEnergy5k8k: percussiveEnergy5k8k(sample),
    percussivePeakCount5k8k: percussivePeakCount5k8k(sample),
    bpfoHarmonicMatches: bpfoHarmonicMatches(sample, opts.speedKmh ?? 0),
    audioSpeedRatio: audioSpeedRatio(sample, opts.speedKmh ?? 0),
    rpmHarmonicMatches: rpmHarmonicMatches(sample, opts.rpm ?? 0),
  }
}
