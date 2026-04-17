import { useMemo } from 'react'
import { useApiData } from './useApiData'
import { useDiagnosticV2, type DiagnosticReport } from './useDiagnosticV2'
import { useDashboardStore } from '../stores/dashboardStore'

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
    return {
      accel: lastAccel,
      audio: data?.audio ?? null,
      pids: data?.pids ?? null,
      report: report ?? null,
      ts: Date.now(),
    }
  }, [data, report])
}
