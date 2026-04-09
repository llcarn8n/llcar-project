export interface UTMParams {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  source: string | null
}

const UTM_STORAGE_KEY = 'llcar-utm'

function sanitize(val: string | null): string | null {
  if (!val) return null
  return val.slice(0, 200).replace(/[<>"']/g, '')
}

export function parseAndStoreUTM(): UTMParams {
  const params = new URLSearchParams(window.location.search)
  const utm: UTMParams = {
    utm_source: sanitize(params.get('utm_source')),
    utm_medium: sanitize(params.get('utm_medium')),
    utm_campaign: sanitize(params.get('utm_campaign')),
    utm_content: sanitize(params.get('utm_content')),
    utm_term: sanitize(params.get('utm_term')),
    source: sanitize(params.get('source')),
  }
  const hasAny = Object.values(utm).some(v => v !== null)
  if (hasAny) {
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm))
    } catch { /* ignore */ }
  }
  return utm
}

export function getStoredUTM(): UTMParams | null {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UTMParams
  } catch {
    return null
  }
}

declare global {
  interface Window {
    ym?: (id: number, action: string, target: string, params?: Record<string, string | number>) => void
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, string | number>) {
  try {
    if (typeof window.ym === 'function') {
      window.ym(0, 'reachGoal', name, params)
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params)
    }
  } catch { /* analytics should never break the app */ }
}
