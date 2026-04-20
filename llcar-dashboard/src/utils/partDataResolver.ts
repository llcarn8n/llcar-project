import type { LatestTelemetry } from '../hooks/useLatestTelemetry'

// Resolves a live value for a parameter `key` referenced in PartSpec.params.
// Returns null when the key is not available from current telemetry —
// UI must handle null gracefully ("—" placeholder).

export function resolvePartValue(
  key: string,
  telemetry: LatestTelemetry,
): number | string | null {
  const { accel, audio, pids, report } = telemetry

  // Tire pressure is not emitted by current backend; placeholder.
  if (/^pressure_(fl|fr|rl|rr)$/.test(key)) return null

  // Per-corner az_std currently falls back to global az_std (no corner split).
  if (/^az_std_(fl|fr|rl|rr)$/.test(key)) {
    return accel && typeof accel.az_std === 'number' ? accel.az_std : null
  }

  // Brake pad wear / EUSAM currently not surfaced by API.
  if (/^brake_pad_wear_(fl|fr|rl|rr)$/.test(key)) return null
  if (/^eusam_W_E_(fl|fr|rl|rr)$/.test(key)) return null

  // Audio 1-4 kHz band energy from last audio window's FFT peaks.
  if (key === 'audio_1_4khz') {
    if (!audio || audio.length === 0) return null
    const last = audio[audio.length - 1]
    if (!last || !Array.isArray(last.freqs) || !Array.isArray(last.amps)) return null
    let sum = 0
    for (let i = 0; i < last.freqs.length; i++) {
      const f = last.freqs[i]
      if (typeof f !== 'number') continue
      if (f >= 1000 && f <= 4000) sum += last.amps[i] ?? 0
    }
    return sum
  }

  if (key === 'dominant_freq') {
    if (!audio || audio.length === 0) return null
    const last = audio[audio.length - 1]
    return last && typeof last.dominant_freq === 'number' ? last.dominant_freq : null
  }
  if (key === 'dominant_amp') {
    if (!audio || audio.length === 0) return null
    const last = audio[audio.length - 1]
    return last && typeof last.dominant_amp === 'number' ? last.dominant_amp : null
  }

  // OBD PIDs exposed by /api/data/
  // Backend currently returns flat field names (rpm/coolant/voltage/engine_load/throttle/ltft/stft)
  // on the overview-tab response; legacy OBD-codes (p010c/p0142/p06) are kept as fallback for
  // older endpoints.
  const pidRpm = pids?.rpm ?? pids?.p010c
  const pidCoolant = pids?.coolant ?? pids?.p0142
  const pidLtft = pids?.ltft ?? pids?.p06
  const pidStft = pids?.stft
  // Voltage в сыром виде бэк шлёт в миливольтах (e.g. 13804 mV); normalize когда >50.
  const rawV = pids?.voltage ?? pids?.p0142_v
  const pidVoltage = typeof rawV === 'number' ? (rawV > 50 ? rawV / 1000 : rawV) : undefined
  const pidEngineLoad = pids?.engine_load
  const pidThrottle = pids?.throttle

  if (key === 'rpm') return pidRpm ?? null
  if (key === 'coolant_temp') return pidCoolant ?? null
  if (key === 'ltft_bank1') return pidLtft ?? null
  if (key === 'voltage_12v') return pidVoltage ?? null
  if (key === 'engine_load') return pidEngineLoad ?? null
  if (key === 'throttle_pos' || key === 'throttle') return pidThrottle ?? null
  if (key === 'stft_bank1') return pidStft ?? null
  if (key === 'ltft_abs') return typeof pidLtft === 'number' ? Math.abs(pidLtft) : null
  if (key === 'fuel_trim_delta') {
    return (typeof pidLtft === 'number' && typeof pidStft === 'number') ? pidLtft - pidStft : null
  }
  // Поля, которые бэк может слать по VIN / extended PIDs — пробуем напрямую, null если нет.
  if (key === 'maf') return (pids as any)?.maf ?? null
  if (key === 'map_pressure') return (pids as any)?.map_pressure ?? (pids as any)?.map ?? null
  if (key === 'oil_pressure') return (pids as any)?.oil_pressure ?? null
  if (key === 'o2_voltage') return (pids as any)?.o2_voltage ?? null
  if (key === 'runtime') return (pids as any)?.runtime ?? null
  if (key === 'ltft_bank2') return (pids as any)?.ltft_bank2 ?? null

  // Freeze-frame fallback — берём snapshot из последнего диагноза, если он есть,
  // когда live PIDs недоступны. Это даёт tooltip «что было на момент срабатывания».
  if (key === 'freeze_rpm' || key === 'freeze_speed' || key === 'freeze_coolant' ||
      key === 'freeze_engine_load' || key === 'freeze_throttle' || key === 'freeze_voltage' ||
      key === 'freeze_ltft' || key === 'freeze_stft' || key === 'freeze_outdoor_temp' ||
      key === 'freeze_weather') {
    if (!report || !Array.isArray(report.diagnoses)) return null
    for (const d of report.diagnoses) {
      const f = (d as { freeze_frame?: Record<string, unknown> }).freeze_frame
      if (!f) continue
      const sub = key.replace(/^freeze_/, '')
      const val = (f as any)[sub]
      if (typeof val === 'number' || typeof val === 'string') return val
    }
    return null
  }

  // Not yet surfaced by this frontend — null keeps tooltip clean.
  // (Большинство — требуют P3: per-corner IMU, HV CAN-парсер, extended VIN PIDs.)
  if (key === 'motor_temp') return null
  if (key === 'motor_power_kw') return null
  if (key === 'hv_voltage') return null
  if (key === 'soc_percent') return null
  if (key === 'cell_delta') return null
  if (key === 'ride_height') return null
  if (key === 'inverter_overtemp_conf') return null
  if (key === 'stabilizer_link_worn_conf') return null
  if (key === 'ball_joint_early_wear_conf') return null
  if (key === 'cv_joint_click_amp') return null
  if (/^shock_absorber_worn_conf_/.test(key)) return null

  if (key === 'ay_std') {
    return accel && typeof accel.ay_std === 'number' ? accel.ay_std : null
  }
  if (key === 'ax_std') {
    return accel && typeof accel.ax_std === 'number' ? accel.ax_std : null
  }
  if (key === 'total_vibration') {
    return accel && typeof accel.total_vibration === 'number'
      ? accel.total_vibration
      : null
  }
  if (key === 'speed') {
    return accel && typeof accel.speed === 'number' ? accel.speed : null
  }

  // DTC metadata derived from the v2 report.
  if (key === 'active_dtc_count') {
    if (!report) return null
    const diagnoses = report.diagnoses
    if (!Array.isArray(diagnoses)) return 0
    let count = 0
    for (const d of diagnoses) {
      if ((d as { freeze_frame?: unknown }).freeze_frame) count++
    }
    return count
  }
  if (key === 'last_dtc_code') {
    if (!report || !Array.isArray(report.diagnoses)) return null
    for (let i = report.diagnoses.length - 1; i >= 0; i--) {
      const d = report.diagnoses[i]
      const codes = (d as { related_dtcs?: string[] }).related_dtcs
      if (Array.isArray(codes) && codes.length > 0) return codes[codes.length - 1]
    }
    return null
  }

  // Unknown key — let caller decide.
  return null
}
