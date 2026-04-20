import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface UseApiDataOptions {
  endpoint: string
  params?: Record<string, string | number>
  refreshInterval?: number // ms, 0 = no refresh
}

export function useApiData<T = any>({ endpoint, params, refreshInterval = 0 }: UseApiDataOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable key so callback only rebuilds when param values actually change.
  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params])

  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const url = new URL(endpoint, window.location.origin)
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
      }
      const res = await fetch(url.toString(), { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!ctrl.signal.aborted) {
        setData(json)
        setError(null)
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      if (!ctrl.signal.aborted) setError(e?.message ?? 'fetch error')
    } finally {
      if (!ctrl.signal.aborted) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params captured via paramsKey
  }, [endpoint, paramsKey])

  useEffect(() => {
    fetchData()
    if (refreshInterval <= 0) {
      return () => {
        if (abortRef.current) abortRef.current.abort()
      }
    }

    let timer: number | null = null
    const start = () => {
      if (timer !== null) return
      timer = window.setInterval(fetchData, refreshInterval)
    }
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop()
      } else {
        // Tab re-focused: refetch once + resume polling.
        fetchData()
        start()
      }
    }

    if (document.visibilityState !== 'hidden') start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}
