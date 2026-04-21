const cache = new Map<string, Promise<unknown>>()

export function cachedFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const existing = cache.get(url)
  if (existing) return existing as Promise<T>

  const promise = fetch(url, init)
    .then(r => {
      if (!r.ok) throw new Error(`cachedFetch ${url} → HTTP ${r.status}`)
      // Guard against nginx SPA fallback serving index.html with 200 for missing JSON.
      const ct = r.headers.get('content-type') ?? ''
      if (ct.includes('text/html')) {
        throw new Error(`cachedFetch ${url} → got HTML (SPA fallback)`)
      }
      return r.json() as Promise<T>
    })
    .catch(err => {
      cache.delete(url)
      throw err
    })

  cache.set(url, promise)
  return promise
}

export function invalidateFetchCache(url?: string) {
  if (url) cache.delete(url)
  else cache.clear()
}
