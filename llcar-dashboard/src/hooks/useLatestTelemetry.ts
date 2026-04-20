import { useMemo } from 'react'
import { useApiData } from './useApiData'
import { useDiagnosticV2, type DiagnosticReport } from './useDiagnosticV2'
import { useDashboardStore } from '../stores/dashboardStore'
import { computeAudioMetrics, type AudioMetrics } from '../utils/audioAnalysis'
import { computeVibrationMetrics, type VibrationMetrics } from '../utils/vibrationAnalysis'

export interface AccelSample {
  az_std?: number
  ay_std?: number
  ax_std?: number
  total_vibration?: number
  speed?: number
  ts?: number
}

export interface AudioSample {
  dominant_freq?: number
  dominant_amp?: number
  freqs?: number[]
  amps?: number[]
  ts?: number
}

export interface LatestTelemetry {
  accel: AccelSample | null
  audio: AudioSample[] | null
  pids: Record<string, number> | null
  report: DiagnosticReport | null
  audioMetrics: AudioMetrics | null
  vibrationMetrics: VibrationMetrics | null
  ts: number
}

interface ApiDataShape {
  accel?: AccelSample[]
  audio?: AudioSample[]
  pids?: Record<string, number>
}

export function useLatestTelemetry(): LatestTelemetry {
  const clientHash = useDashboardStore((s) => s.clientHash)
  const timeRange = useDashboardStore((s) => s.timeRange)

  const { data } = useApiData<ApiDataShape>({
    endpoint: '/api/data/',
    params: { client_hash: clientHash, minutes: timeRange },
    refreshInterval: 30000,
  })
  const { report } = useDiagnosticV2(clientHash, timeRange)

  return useMemo<LatestTelemetry>(() => {
    const accelSeries = data?.accel ?? []
    const lastAccel = accelSeries.length > 0 ? accelSeries[accelSeries.length - 1] : null
    const audio = data?.audio ?? null
    const pids = data?.pids ?? null
    const lastAudio = audio && audio.length > 0 ? audio[audio.length - 1] : null
    const speedKmh = typeof pids?.speed === 'number'
      ? pids.speed
      : (typeof lastAccel?.speed === 'number' ? lastAccel.speed : null)
    const rpm = typeof pids?.rpm === 'number' ? pids.rpm : null
    const audioMetrics = lastAudio ? computeAudioMetrics(lastAudio, { speedKmh, rpm }) : null
    const vibrationMetrics = computeVibrationMetrics(accelSeries, { speedKmh })
    return {
      accel: lastAccel,
      audio,
      pids,
      report: report ?? null,
      audioMetrics,
      vibrationMetrics,
      ts: Date.now(),
    }
  }, [data, report])
}
