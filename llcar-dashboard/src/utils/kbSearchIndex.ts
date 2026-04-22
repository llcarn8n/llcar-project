import Fuse, { type FuseResult } from 'fuse.js'
import rawIndex from '../data/kb-search-index.json'

export interface KBSearchEntry {
  bid: string      // kb brand slug (e.g. "bmw", "mercedes") — for direct kb/ paths
  vid: string      // vehicles.json / brands/<id>.json id (e.g. "mercedes_benz") — for setVehicleProfile
  bn: string       // brand name ("BMW")
  bnru: string     // brand name ru ("БМВ")
  mslug: string    // model slug ("x5")
  mn: string       // model name ("X5")
  gslug: string    // generation slug ("e70_2007")
  gn: string       // generation name ("X5 E70 2007-2013")
  gid: string | null  // brands/<id>.json generation id (used by KnowledgeBase fetchers)
  ys: number | null
  ye: number | null
  path: string     // "bmw/x5/e70_2007" — relative path в kb/
  label: string    // "BMW X5 E70 2007-2013" — for display/search
}

const ENTRIES: KBSearchEntry[] = rawIndex as KBSearchEntry[]

const FUSE = new Fuse(ENTRIES, {
  keys: [
    { name: 'label', weight: 2 },
    { name: 'bn', weight: 1.5 },
    { name: 'bnru', weight: 1.5 },
    { name: 'mn', weight: 1.2 },
    { name: 'gn', weight: 1 },
    { name: 'mslug', weight: 0.5 },
    { name: 'gslug', weight: 0.5 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
})

export function searchKB(query: string, limit = 10): KBSearchEntry[] {
  const q = query.trim()
  if (q.length < 2) return []
  return FUSE.search(q, { limit }).map((r: FuseResult<KBSearchEntry>) => r.item)
}

export function getAllKBEntries(): readonly KBSearchEntry[] {
  return ENTRIES
}

/** Highlight matched chars in a string (case-insensitive). Returns an array of
 *  segments for React to render with <mark> around matches. */
export function highlightSegments(text: string, query: string): Array<{ text: string; match: boolean }> {
  const q = query.trim()
  if (!q) return [{ text, match: false }]
  const parts: Array<{ text: string; match: boolean }> = []
  const lc = text.toLowerCase()
  const lq = q.toLowerCase()
  let i = 0
  while (i < text.length) {
    const idx = lc.indexOf(lq, i)
    if (idx < 0) {
      parts.push({ text: text.slice(i), match: false })
      break
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), match: false })
    parts.push({ text: text.slice(idx, idx + lq.length), match: true })
    i = idx + lq.length
  }
  return parts
}
