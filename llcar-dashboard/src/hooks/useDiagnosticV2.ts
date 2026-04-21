import { useState, useEffect, useCallback, useRef } from 'react'

export interface DiagnosticReport {
  can_drive: 'safe' | 'caution' | 'stop'
  health_scores: {
    overall: number
    suspension: number
    engine: number
    electrical: number
    audio: number
  }
  health_trends: Record<string, string>
  diagnoses: Diagnosis[]
  fuel_loss: { monthly_rub: number; yearly_rub: number } | null
  escalations: Escalation[]
  recalls: Recall[]
  next_steps: string[]
  confidence: number
  baseline_status: { ready: boolean; total_samples: number; samples_needed: number }
  rule_version: string
  data_source?: {
    has_obd: boolean
    has_accel: boolean
    has_audio: boolean
    minutes_searched: number
    obd_packets?: number
  }
}

export interface FreezeFrame {
  rpm?: number
  speed?: number
  coolant_temp?: number
  engine_load?: number
  throttle?: number
  voltage?: number
  ltft?: number
  stft?: number
  outdoor_temp?: number
  weather?: string
  timestamp?: string
}

export interface Diagnosis {
  rule_name: string
  display: string
  status: 'likely' | 'possible' | 'unlikely' | 'clear'
  confidence: number
  explanation: string
  evidence: string[]
  repair_roadmap: string[]
  common_mistakes: string
  can_drive: string
  price_range: string
  situation_id: string | null
  freeze_frame?: FreezeFrame
}

export interface Escalation {
  rule_name: string
  display: string
  first_seen: string
  days_active: number
  level: number
  level_name: string
  consecutive_count: number
  was_dismissed: boolean
  max_confidence: number
}

export interface Recall {
  id: string
  brand: string
  title_ru: string
  description_ru: string
  severity: string
  system: string
  date: string
  models: string[]
  source: string
  count: number
}

export interface HistoryEntry {
  time: string
  overall_score: number
  suspension_score: number
  engine_score: number
  electrical_score: number
  audio_score: number
  confidence: number
  top_diagnostic: string | null
  top_diagnostic_confidence: number
}

const LATEST_INTERVAL_MS = 30_000
const HISTORY_INTERVAL_MS = 60_000

export function useDiagnosticV2(clientHash: string, timeRange: number = 10080) {
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const latestAbortRef = useRef<AbortController | null>(null)
  const historyAbortRef = useRef<AbortController | null>(null)

  const fetchLatest = useCallback(async () => {
    latestAbortRef.current?.abort()
    const controller = new AbortController()
    latestAbortRef.current = controller
    try {
      setLoading(true)
      const res = await fetch(
        `/api/v2/diagnose-latest/?client_hash=${clientHash}&minutes=${timeRange}`,
        { signal: controller.signal },
      )
      if (!res.ok) {
        setError(`HTTP ${res.status}`)
        return
      }
      const data = await res.json()
      if (data && !data.error) {
        setReport(data as DiagnosticReport)
        setError(null)
      } else {
        setError(data?.message || 'No data')
      }
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === 'AbortError') return
      setError((e as Error)?.message ?? 'network error')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [clientHash, timeRange])

  const fetchHistory = useCallback(async (period = '7d') => {
    historyAbortRef.current?.abort()
    const controller = new AbortController()
    historyAbortRef.current = controller
    try {
      const days = period === '1h' || period === '24h' ? 1 : period === '30d' ? 30 : 7
      const res = await fetch(
        `/api/v2/history/?client_hash=${clientHash}&days=${days}`,
        { signal: controller.signal },
      )
      if (!res.ok) return
      const data = await res.json()
      setHistory(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === 'AbortError') return
      // silent fail — history is secondary
    }
  }, [clientHash])

  // Auto-fetch on mount + periodic refresh. Paused when the document is hidden
  // to avoid draining the battery and piling up requests on mobile background tabs.
  useEffect(() => {
    const period = timeRange <= 60 ? '1h' : timeRange <= 1440 ? '24h' : timeRange <= 10080 ? '7d' : '30d'
    let latestTimer: ReturnType<typeof setInterval> | null = null
    let historyTimer: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (latestTimer == null) latestTimer = setInterval(fetchLatest, LATEST_INTERVAL_MS)
      if (historyTimer == null) historyTimer = setInterval(() => fetchHistory(period), HISTORY_INTERVAL_MS)
    }
    const stop = () => {
      if (latestTimer != null) { clearInterval(latestTimer); latestTimer = null }
      if (historyTimer != null) { clearInterval(historyTimer); historyTimer = null }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop()
      } else {
        fetchLatest()
        fetchHistory(period)
        start()
      }
    }

    fetchLatest()
    fetchHistory(period)
    if (document.visibilityState !== 'hidden') start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      latestAbortRef.current?.abort()
      historyAbortRef.current?.abort()
    }
  }, [fetchLatest, fetchHistory, timeRange])

  const sendFeedback = useCallback(async (ruleName: string, action: 'confirmed' | 'dismissed') => {
    try {
      await fetch('/api/v2/feedback/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_hash: clientHash,
          rule_name: ruleName,
          action,
        }),
      })
      return true
    } catch {
      return false
    }
  }, [clientHash])

  return { report, history, loading, error, sendFeedback, fetchHistory, fetchLatest, setReport }
}
