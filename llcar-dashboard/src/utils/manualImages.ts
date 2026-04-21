const HASH_WEBP = /^images\/([0-9a-f]{64})\.webp$/i
const UNSAFE_SCHEME = /^(javascript|data|vbscript|file):/i

/**
 * Resolve a markdown image reference to the backend's safe kb-image endpoint.
 * Returns null for anything that isn't a verified `images/<sha256>.webp` path,
 * and explicitly rejects unsafe URL schemes (javascript:, data:, vbscript:, file:)
 * as defence-in-depth in case a KB markdown file is ever tampered with.
 */
export function resolveManualImage(markdownSrc: string): string | null {
  if (!markdownSrc) return null
  const trimmed = markdownSrc.trim()
  if (UNSAFE_SCHEME.test(trimmed)) return null
  const m = trimmed.match(HASH_WEBP)
  if (!m) return null
  return `/api/kb-image/${m[1].toLowerCase()}.webp`
}

export function extractImageSrc(markdownImage: string): string | null {
  const m = markdownImage.match(/!\[[^\]]*\]\(([^)]+)\)/)
  return m ? m[1] : null
}
