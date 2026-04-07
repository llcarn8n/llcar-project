import { useState, useEffect, useCallback } from 'react'

interface UseApiDataOptions {
  endpoint: string
  params?: Record<string, string | number>
  refreshInterval?: number // ms, 0 = no refresh
}

export function useApiData<T = any>({ endpoint, params, refreshInterval = 0 }: UseApiDataOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const url = new URL(endpoint, window.location.origin)
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
      }
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [endpoint, JSON.stringify(params)])

  useEffect(() => {
    fetchData()
    if (refreshInterval > 0) {
      const timer = setInterval(fetchData, refreshInterval)
      return () => clearInterval(timer)
    }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}
