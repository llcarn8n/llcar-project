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

// PidsPayload — унифицированный shape pids от /api/data/.
// Основные OBD-поля (обязательные) + extended VIN/EV поля (optional).
// Signature `[key: string]: number | undefined` сохраняет backward-compat
// с legacy OBD-кодами (p010c/p0142/p06) которые тоже могут прилетать.
export interface PidsPayload {
  // OBD standard (flat fields from /api/data/?tab=overview)
  rpm?: number
  speed?: number
  coolant?: number
  voltage?: number
  engine_load?: number
  throttle?: number
  ltft?: number
  stft?: number

  // Extended VIN PIDs (могут быть, зависит от адаптера)
  maf?: number
  map_pressure?: number
  oil_pressure?: number
  o2_voltage?: number
  runtime?: number
  ltft_bank2?: number

  // EV / HV — заполняются P3 CAN-парсером (см. dashboard_build/diagnostic/can_parser.py)
  hv_battery_voltage?: number
  hv_battery_current?: number
  hv_battery_soc?: number
  hv_battery_temp?: number
  hv_cell_voltage_delta?: number
  inverter_temp?: number
  e_motor_temp?: number
  motor_temp?: number
  motor_power_kw?: number
  regen_brake_power?: number

  // Legacy OBD PID codes (p010c, p0142, p06 и т.п.) — fallback схема
  [key: string]: number | undefined
}

export interface LatestTelemetry {
  accel: AccelSample | null
  audio: AudioSample[] | null
  pids: PidsPayload | null
  report: DiagnosticReport | null
  audioMetrics: AudioMetrics | null
  vibrationMetrics: VibrationMetrics | null
  ts: number
}

interface ApiDataShape {
  accel?: AccelSample[]
  audio?: AudioSample[]
  pids?: PidsPayload
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
