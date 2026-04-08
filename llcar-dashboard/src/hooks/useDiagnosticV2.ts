import { useState, useEffect, useCallback } from 'react'

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

export function useDiagnosticV2(clientHash: string) {
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch latest diagnosis from server
  const fetchLatest = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/v2/diagnose-latest/?client_hash=${clientHash}&minutes=10080`)
      if (res.ok) {
        const data = await res.json()
        if (!data.error) {
          setReport(data as DiagnosticReport)
          setError(null)
        } else {
          setError(data.message || 'No data')
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clientHash])

  // Fetch history
  const fetchHistory = useCallback(async (period = '7d') => {
    try {
      const res = await fetch(`/api/v2/history/?client_hash=${clientHash}&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch {
      // silent fail
    }
  }, [clientHash])

  // Auto-fetch on mount + periodic refresh
  useEffect(() => {
    fetchLatest()
    fetchHistory()
    const timer1 = setInterval(fetchLatest, 30000)
    const timer2 = setInterval(() => fetchHistory(), 60000)
    return () => { clearInterval(timer1); clearInterval(timer2) }
  }, [fetchLatest, fetchHistory])

  // Send feedback
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
