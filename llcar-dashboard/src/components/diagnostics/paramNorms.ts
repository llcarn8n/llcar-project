import { theme } from '../../theme'

export const PARAM_LABELS: Record<string, string> = {
  'az_std': 'Вибрация (верт.)',
  'total_vibration': 'Общая вибрация',
  'coolant_temp': 'Температура ОЖ',
  'voltage': 'Напряжение',
  'ltft': 'Долгоср. коррекция',
  'stft': 'Краткоср. коррекция',
  'rpm': 'Обороты',
  'speed': 'Скорость',
  'dominant_freq': 'Частота шума',
  'dominant_amp': 'Амплитуда шума',
  'engine_load': 'Нагрузка двигателя',
  'throttle': 'Дроссель',
}

export const PARAM_NORMS: Record<string, { min: number; max: number; unit: string }> = {
  'az_std': { min: 0, max: 5, unit: 'м/с²' },
  'total_vibration': { min: 0, max: 10, unit: 'м/с²' },
  'coolant_temp': { min: 80, max: 105, unit: '°C' },
  'voltage': { min: 13.2, max: 14.8, unit: 'В' },
  'ltft': { min: -10, max: 10, unit: '%' },
  'stft': { min: -10, max: 10, unit: '%' },
  'rpm': { min: 600, max: 6500, unit: 'об/мин' },
  'speed': { min: 0, max: 180, unit: 'км/ч' },
  'dominant_freq': { min: 0, max: 5000, unit: 'Гц' },
  'dominant_amp': { min: 0, max: 20000, unit: '' },
  'engine_load': { min: 0, max: 100, unit: '%' },
  'throttle': { min: 0, max: 100, unit: '%' },
}

export function parseEvidence(ev: string): { param: string; value: number } | null {
  if (typeof ev !== 'string') return null
  const m = ev.match(/^(\w+)\s*[><=!]+\s*([\d.]+)/)
  if (!m) return null
  return { param: m[1], value: parseFloat(m[2]) }
}

export function zoneColor(value: number, norm: { min: number; max: number }): string {
  const range = norm.max - norm.min
  const margin = range * 0.2
  if (value >= norm.min && value <= norm.max) return theme.status.ok
  if (value >= norm.min - margin && value <= norm.max + margin) return theme.status.warning
  return theme.status.critical
}
