const cache = new Map<string, Promise<any>>()

export function cachedFetch<T = any>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url)!
  const promise = fetch(url).then(r => r.json())
  cache.set(url, promise)
  return promise
}
