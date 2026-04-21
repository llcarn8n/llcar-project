import { lazy, type ComponentType } from 'react'

const CHUNK_RETRY_KEY = 'llcar-chunk-retry'
const CHUNK_ERROR_NAMES = ['ChunkLoadError']
const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Loading chunk [\d]+ failed/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
]

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false
  const e = err as { name?: string; message?: string }
  if (e.name && CHUNK_ERROR_NAMES.includes(e.name)) return true
  const msg = e.message ?? String(err)
  return CHUNK_ERROR_PATTERNS.some(p => p.test(msg))
}

// Wraps React.lazy with a one-shot retry-on-ChunkLoadError. When a previous deploy
// left the user's cached index.html pointing at now-404 chunk hashes, we reload the
// page once (sessionStorage-guarded to prevent an infinite loop).
// `ComponentType<any>` is intentional: lazy factories return components with arbitrary
// prop shapes, and a narrower constraint breaks inference on typed components.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy<T>(() =>
    factory().catch((err: unknown) => {
      if (!isChunkLoadError(err)) throw err
      let retried = false
      try {
        retried = sessionStorage.getItem(CHUNK_RETRY_KEY) === '1'
      } catch {}
      if (retried) throw err
      try {
        sessionStorage.setItem(CHUNK_RETRY_KEY, '1')
      } catch {}
      window.location.reload()
      return new Promise<{ default: T }>(() => {})
    }),
  )
}

export function clearChunkRetryFlag() {
  try {
    sessionStorage.removeItem(CHUNK_RETRY_KEY)
  } catch {}
}
