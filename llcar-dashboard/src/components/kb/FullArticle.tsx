import { useEffect, useMemo, useState, type JSX } from 'react'
import { theme } from '../../theme'

interface FullArticleProps {
  /** Path relative to /public/data/kb/, e.g. "_articles/hyundai_solaris_hc_01.md" */
  articlePath: string
  /** Open all sections by default (default: false — only first open) */
  expandAll?: boolean
}

interface Section {
  title: string
  body: string
}

interface Frontmatter {
  title?: string
  brand?: string
  model?: string
  generation?: string
  engine?: string
  transmission?: string
  urg?: number
  cat?: string
  length_chars?: number
}

const SECTION_ICONS: Record<string, string> = {
  'Симптомы': '\u{1F50D}',
  'Техническая причина': '\u{1F527}',
  'Последствия игнорирования': '\u26A0',
  'Диагностика': '\u{1F4CA}',
  'Ремонт': '\u{1F6E0}',
  'Профилактика': '\u{1F6E1}',
}

function parseFrontmatter(text: string): { fm: Frontmatter; body: string } {
  if (!text.startsWith('---')) return { fm: {}, body: text }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { fm: {}, body: text }
  const raw = text.slice(3, end).trim()
  const body = text.slice(end + 4).replace(/^\s+/, '')
  const fm: Frontmatter = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const [, k, v] = m
    const val = v.trim().replace(/^["']|["']$/g, '')
    if (k === 'urg' || k === 'length_chars') {
      const n = Number(val)
      if (!Number.isNaN(n)) (fm as any)[k] = n
    } else {
      ;(fm as any)[k] = val
    }
  }
  return { fm, body }
}

function parseSections(body: string): Section[] {
  const sections: Section[] = []
  const re = /^##\s+(.+)$/gm
  const matches = Array.from(body.matchAll(re))
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const title = m[1].trim()
    const start = m.index! + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length
    const sectionBody = body.slice(start, end).trim()
    sections.push({ title, body: sectionBody })
  }
  return sections
}

/** Very small inline markdown: **bold**, `code`, paragraph breaks. */
function renderInline(md: string): JSX.Element[] {
  const paragraphs = md.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  return paragraphs.map((p, idx) => {
    const parts: (string | JSX.Element)[] = []
    let remaining = p.replace(/\n/g, ' ')
    let key = 0
    const pattern = /\*\*([^*]+)\*\*|`([^`]+)`/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.slice(lastIndex, match.index))
      }
      if (match[1] !== undefined) {
        parts.push(<strong key={`b${idx}-${key++}`}>{match[1]}</strong>)
      } else if (match[2] !== undefined) {
        parts.push(
          <code
            key={`c${idx}-${key++}`}
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.92em',
              color: theme.accent.cyan,
              background: 'rgba(0,229,255,0.08)',
              padding: '1px 5px',
              borderRadius: 2,
              border: '1px solid rgba(0,229,255,0.15)',
            }}
          >
            {match[2]}
          </code>
        )
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < remaining.length) {
      parts.push(remaining.slice(lastIndex))
    }
    return (
      <p
        key={`p${idx}`}
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 13,
          color: theme.text.secondary,
          lineHeight: 1.65,
          margin: '0 0 10px 0',
        }}
      >
        {parts}
      </p>
    )
  })
}

export function FullArticle({ articlePath, expandAll = false }: FullArticleProps) {
  const [raw, setRaw] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openSet, setOpenSet] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${import.meta.env.BASE_URL}data/kb/${articlePath}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.text()
      })
      .then(text => {
        if (cancelled) return
        setRaw(text)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(String(err))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [articlePath])

  const { fm, sections } = useMemo(() => {
    if (!raw) return { fm: {} as Frontmatter, sections: [] as Section[] }
    const { fm, body } = parseFrontmatter(raw)
    return { fm, sections: parseSections(body) }
  }, [raw])

  // Initialize open state when sections load
  useEffect(() => {
    if (sections.length === 0) return
    const initial = new Set<number>()
    if (expandAll) {
      for (let i = 0; i < sections.length; i++) initial.add(i)
    } else {
      initial.add(0)
    }
    setOpenSet(initial)
  }, [sections.length, expandAll])

  const toggle = (idx: number) => {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 12,
          color: theme.accent.cyan,
          letterSpacing: '0.15em',
        }}
      >
        LOADING ARTICLE...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 13,
          color: theme.status.critical,
          border: `1px solid ${theme.status.critical}40`,
          borderRadius: 4,
          background: `${theme.status.critical}10`,
        }}
      >
        Не удалось загрузить статью: {error}
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 13,
          color: theme.text.muted,
        }}
      >
        Статья пуста.
      </div>
    )
  }

  return (
    <div>
      {/* Meta header */}
      {(fm.title || fm.engine || fm.transmission) && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.12)',
            borderRadius: 4,
            borderLeft: `3px solid ${theme.accent.cyan}`,
          }}
        >
          {fm.title && (
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: theme.text.primary,
                marginBottom: 6,
                lineHeight: 1.3,
              }}
            >
              {fm.title}
            </div>
          )}
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 10,
              color: theme.text.muted,
              letterSpacing: '0.08em',
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {fm.brand && fm.model && (
              <span>{fm.brand} {fm.model}{fm.generation ? ` · ${fm.generation}` : ''}</span>
            )}
            {fm.engine && <span>ENGINE: {fm.engine}</span>}
            {fm.transmission && <span>TRANS: {fm.transmission}</span>}
            {fm.length_chars && <span>{fm.length_chars} chars</span>}
          </div>
        </div>
      )}

      {/* Accordion sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sections.map((sec, idx) => {
          const isOpen = openSet.has(idx)
          const icon = SECTION_ICONS[sec.title] ?? '\u25B8'
          return (
            <div
              key={idx}
              style={{
                borderRadius: 4,
                background: isOpen ? 'rgba(0,229,255,0.04)' : 'rgba(0,229,255,0.015)',
                border: `1px solid ${isOpen ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.06)'}`,
                transition: 'all 0.2s',
              }}
            >
              <button
                onClick={() => toggle(idx)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: theme.text.primary,
                  textAlign: 'left',
                  letterSpacing: '0.02em',
                }}
              >
                <span aria-hidden style={{ fontSize: 16, opacity: 0.85 }}>
                  {icon}
                </span>
                <span style={{ flex: 1 }}>{sec.title}</span>
                <span
                  aria-hidden
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 11,
                    color: theme.accent.cyan,
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.15s',
                  }}
                >
                  {'\u25B8'}
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 14px 12px 14px' }}>
                  {renderInline(sec.body)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
