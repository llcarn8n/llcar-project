const HASH_WEBP = /^images\/([0-9a-f]{64})\.webp$/i

export function resolveManualImage(markdownSrc: string): string | null {
  const m = markdownSrc.match(HASH_WEBP)
  if (!m) return null
  return `/api/kb-image/${m[1].toLowerCase()}.webp`
}

export function extractImageSrc(markdownImage: string): string | null {
  const m = markdownImage.match(/!\[[^\]]*\]\(([^)]+)\)/)
  return m ? m[1] : null
}
