import { useEffect, useRef, useState } from 'react'

export interface RecallCampaign {
  id: string
  brand: string
  title_ru: string
  description_ru: string
  severity: string
  system: string
  date: string
  years: string
  models: string[]
  source: string
  source_url: string
  count: number
}

export interface RecallBrand {
  slug: string
  name: string
  country: string
  count: number
}

export interface RecallsSearchResult {
  total: number
  returned: number
  offset: number
  limit: number
  campaigns: RecallCampaign[]
  brands: RecallBrand[]
}

interface UseRecallsSearchParams {
  q?: string
  brand?: string
  severity?: string
  limit?: number
  offset?: number
  debounceMs?: number
}

export function useRecallsSearch({
  q = '',
  brand = '',
  severity = '',
  limit = 50,
  offset = 0,
  debounceMs = 250,
}: UseRecallsSearchParams) {
  const [data, setData] = useState<RecallsSearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (brand) params.set('brand', brand)
      if (severity) params.set('severity', severity)
      params.set('limit', String(limit))
      params.set('offset', String(offset))

      setLoading(true)
      fetch(`/api/v2/recalls-search/?${params.toString()}`)
        .then(r => {
          if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
          return r.json()
        })
        .then((d: RecallsSearchResult) => {
          setData(d)
          setError(null)
        })
        .catch(e => setError(String(e)))
        .finally(() => setLoading(false))
    }, debounceMs)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [q, brand, severity, limit, offset, debounceMs])

  return { data, loading, error }
}
