import { useState, useEffect, useMemo, useCallback, useRef, type JSX } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'
import { extractImageSrc, resolveManualImage } from '../../utils/manualImages'
import { getKBStats } from '../../utils/kbStats'

const KB_STATS = getKBStats()

// ── DITA JSON types ──────────────────────────────────────────────

interface Topic {
  id: string
  title: { ru: string; en?: string }
  words?: number
  images?: number
  content?: { ru?: string }
}

interface Section {
  id: string
  title: { ru: string; en?: string }
  icon: string
  topics: Topic[]
}

interface Manual {
  model: string
  label: { ru: string }
  sections: Section[]
}

interface ManualData {
  model: string
  manuals: Manual[]
}

// ── Markdown parsed types ────────────────────────────────────────

interface MdSection {
  id: string
  level: number
  title: string
  content: string
  wordCount: number
}

// ── Props ────────────────────────────────────────────────────────

interface ManualViewerProps {
  brandId: string | null
  modelName: string | null
  kbGenPath?: string  // e.g. "li_auto/l7/2023_max" → fetches kb/li_auto/l7/2023_max/manual.md
}

// ── Search highlight helpers ─────────────────────────────────────

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text: string, query: string): JSX.Element | string {
  const q = query.trim()
  if (!q) return text
  const splitter = new RegExp(`(${escapeRegExp(q)})`, 'gi')
  const ql = q.toLowerCase()
  const parts = text.split(splitter)
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === ql
          ? <mark key={i} style={{
              background: 'rgba(255,220,120,0.35)',
              color: 'inherit',
              padding: '0 2px',
              borderRadius: 2,
              boxShadow: '0 0 6px rgba(255,220,120,0.25)',
            }}>{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

// ── Markdown parser ──────────────────────────────────────────────

function parseMarkdownSections(md: string): MdSection[] {
  const lines = md.split('\n')
  const sections: MdSection[] = []
  let current: MdSection | null = null
  let contentLines: string[] = []
  let sectionIdx = 0

  const flush = () => {
    if (current) {
      const content = contentLines.join('\n').trim()
      current.content = content
      current.wordCount = content.split(/\s+/).filter(Boolean).length
      sections.push(current)
    }
  }

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headerMatch) {
      flush()
      sectionIdx++
      current = {
        id: `md-sec-${sectionIdx}`,
        level: headerMatch[1].length,
        title: headerMatch[2].trim(),
        content: '',
        wordCount: 0,
      }
      contentLines = []
    } else {
      contentLines.push(line)
    }
  }
  flush()

  // If no headers found, treat entire content as one section
  if (sections.length === 0 && md.trim().length > 0) {
    const wordCount = md.split(/\s+/).filter(Boolean).length
    sections.push({
      id: 'md-sec-all',
      level: 1,
      title: 'Содержание',
      content: md.trim(),
      wordCount,
    })
  }

  return sections
}

// ── Inline markdown renderer ─────────────────────────────────────

function renderInlineText(text: string): (string | JSX.Element)[] {
  const result: (string | JSX.Element)[] = []
  // Pattern: **bold**, *italic*, `code`, ![alt](src)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|!\[([^\]]*)\]\([^)]+\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      result.push(
        <strong key={`b-${key++}`} style={{ fontWeight: 700, color: theme.text.primary }}>
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // *italic*
      result.push(
        <em key={`i-${key++}`} style={{ fontStyle: 'italic', color: theme.text.secondary }}>
          {match[3]}
        </em>
      )
    } else if (match[4]) {
      // `code`
      result.push(
        <code key={`c-${key++}`} style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          padding: '1px 5px',
          borderRadius: 3,
          background: 'rgba(0,229,255,0.08)',
          color: theme.accent.cyan,
        }}>
          {match[4]}
        </code>
      )
    } else if (match[0].startsWith('![')) {
      const rawSrc = extractImageSrc(match[0])
      const resolved = rawSrc ? resolveManualImage(rawSrc) : null
      if (resolved) {
        result.push(
          <img
            key={`img-${key++}`}
            src={resolved}
            loading="lazy"
            decoding="async"
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: 320,
              margin: '10px 0',
              borderRadius: 4,
              background: 'rgba(0,229,255,0.03)',
              border: '1px solid rgba(0,229,255,0.1)',
            }}
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
              const ph = target.nextElementSibling as HTMLElement | null
              if (ph) ph.style.display = 'inline-flex'
            }}
          />,
          <span key={`img-ph-${key++}`} style={{
            display: 'none',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 3,
            background: 'rgba(0,229,255,0.04)',
            border: '1px dashed rgba(0,229,255,0.15)',
            color: theme.text.muted,
            fontSize: 11,
          }}>
            <span style={{ fontSize: 12, opacity: 0.5 }}>&#x1F4F7;</span>
            [Изображение недоступно]
          </span>
        )
      } else {
        result.push(
          <span key={`img-${key++}`} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 3,
            background: 'rgba(0,229,255,0.04)',
            border: '1px dashed rgba(0,229,255,0.15)',
            color: theme.text.muted,
            fontSize: 11,
          }}>
            <span style={{ fontSize: 12, opacity: 0.5 }}>&#x1F4F7;</span>
            [Изображение]
          </span>
        )
      }
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex))
  }

  return result.length > 0 ? result : [text]
}

// ── Block-level markdown renderer ────────────────────────────────

function renderMarkdownContent(content: string): JSX.Element {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let inCodeBlock = false
  let codeLines: string[] = []
  let codeKey = 0
  let lineIdx = 0

  const flushCode = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={`code-${codeKey++}`} style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          lineHeight: 1.5,
          padding: '10px 12px',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,229,255,0.1)',
          color: theme.text.secondary,
          overflowX: 'auto',
          margin: '6px 0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {codeLines.join('\n')}
        </pre>
      )
      codeLines = []
    }
  }

  for (const line of lines) {
    lineIdx++

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode()
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    const trimmed = line.trim()

    // Empty line → spacer
    if (!trimmed) {
      elements.push(<div key={`sp-${lineIdx}`} style={{ height: 6 }} />)
      continue
    }

    // Bullet list (- or * or •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/)
    if (bulletMatch) {
      elements.push(
        <div key={`ul-${lineIdx}`} style={{
          display: 'flex',
          gap: 8,
          padding: '2px 0',
          paddingLeft: 8,
        }}>
          <span style={{
            color: theme.accent.cyan,
            fontSize: 8,
            marginTop: 4,
            flexShrink: 0,
            opacity: 0.7,
          }}>&#x25CF;</span>
          <span style={{
            fontFamily: 'var(--f-body), sans-serif',
            fontSize: 13,
            color: theme.text.secondary,
            lineHeight: 1.5,
          }}>
            {renderInlineText(bulletMatch[1])}
          </span>
        </div>
      )
      continue
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/)
    if (numMatch) {
      elements.push(
        <div key={`ol-${lineIdx}`} style={{
          display: 'flex',
          gap: 8,
          padding: '2px 0',
          paddingLeft: 8,
        }}>
          <span style={{
            fontFamily: 'var(--f-display), sans-serif',
            fontSize: 9,
            color: theme.accent.cyan,
            minWidth: 16,
            textAlign: 'right',
            marginTop: 3,
            flexShrink: 0,
            opacity: 0.7,
          }}>
            {numMatch[1]}.
          </span>
          <span style={{
            fontFamily: 'var(--f-body), sans-serif',
            fontSize: 13,
            color: theme.text.secondary,
            lineHeight: 1.5,
          }}>
            {renderInlineText(numMatch[2])}
          </span>
        </div>
      )
      continue
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${lineIdx}`} style={{
          border: 'none',
          borderTop: '1px solid rgba(0,229,255,0.1)',
          margin: '8px 0',
        }} />
      )
      continue
    }

    // Regular paragraph
    elements.push(
      <div key={`p-${lineIdx}`} style={{
        fontFamily: 'var(--f-body), sans-serif',
        fontSize: 13,
        color: theme.text.secondary,
        lineHeight: 1.6,
        padding: '1px 0',
      }}>
        {renderInlineText(trimmed)}
      </div>
    )
  }

  // Flush any remaining code block
  if (inCodeBlock) flushCode()

  return <>{elements}</>
}

// ── Main component ───────────────────────────────────────────────

type ViewMode = 'dita' | 'md'

export function ManualViewer({ brandId, modelName, kbGenPath }: ManualViewerProps) {
  // DITA JSON state
  const [data, setData] = useState<ManualData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)

  // Markdown state
  const [mdRaw, setMdRaw] = useState<string | null>(null)
  const [mdLoading, setMdLoading] = useState(false)
  const [mdSections, setMdSections] = useState<MdSection[]>([])
  const [expandedMdSection, setExpandedMdSection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Manual variants state — fallback chain + optional user selection
  const [manualVariant, setManualVariant] = useState<'main' | 'variant' | 'variant2'>('main')
  const [availableVariants, setAvailableVariants] = useState<Array<'main' | 'variant' | 'variant2'>>([])

  // View mode
  const hasDita = !!(data && data.manuals && data.manuals.length > 0)
  const hasMd = mdRaw !== null
  const [viewMode, setViewMode] = useState<ViewMode>('md')

  // Debounce user input for search (150ms — Fuse benchmarks, feels instant)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 150)
    return () => clearTimeout(t)
  }, [searchQuery])

  // ── Fetch DITA JSON ──────────────────────────────────────────
  useEffect(() => {
    if (!brandId || !modelName) return
    const modelId = modelName.toLowerCase().replace(/\s+/g, '_')
    setLoading(true)
    fetch(`${import.meta.env.BASE_URL}data/manuals/${brandId}_${modelId}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData(null); setLoading(false) })
  }, [brandId, modelName])

  // ── Fetch generation Markdown ────────────────────────────────
  // Fallback цепочка: manual.md → manual_variant.md → manual_variant2.md
  // Variant-файлы появляются когда при ingest было 2+ источника на одну gen-папку
  // и фикс коллизий (S27 H3.9c) сохранил альтернативные версии.
  useEffect(() => {
    if (!kbGenPath) {
      setMdRaw(null)
      setMdSections([])
      setAvailableVariants([])
      setManualVariant('main')
      return
    }
    setMdLoading(true)
    const controller = new AbortController()

    const filename = manualVariant === 'main' ? 'manual.md' :
                     manualVariant === 'variant' ? 'manual_variant.md' :
                     'manual_variant2.md'

    // Сначала probe'аем variants один раз при новом kbGenPath (только если manualVariant === 'main')
    const probeVariants = async () => {
      if (manualVariant !== 'main') return
      const variants: Array<'main' | 'variant' | 'variant2'> = ['main']
      try {
        const r1 = await fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/manual_variant.md`, {
          signal: controller.signal, method: 'HEAD',
        })
        if (r1.ok) variants.push('variant')
      } catch { /* ignore */ }
      try {
        const r2 = await fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/manual_variant2.md`, {
          signal: controller.signal, method: 'HEAD',
        })
        if (r2.ok) variants.push('variant2')
      } catch { /* ignore */ }
      if (!controller.signal.aborted) setAvailableVariants(variants)
    }
    probeVariants()

    const fetchWithFallback = async (name: string, fallbackChain: string[]): Promise<{ body: string; via: string } | null> => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/${name}`, { signal: controller.signal })
        if (r.ok) {
          const text = await r.text()
          // Sanity check: кэш SPA возвращает HTML 3365B для несуществующих путей — отсеиваем
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            throw new Error('HTML fallback')
          }
          return { body: text, via: name }
        }
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return null
      }
      if (fallbackChain.length > 0) {
        return fetchWithFallback(fallbackChain[0], fallbackChain.slice(1))
      }
      return null
    }

    // При активном variant — fetch именно его, без fallback (user выбрал явно).
    // При main — fallback на variant/variant2 если main 404.
    const chain = manualVariant === 'main' ? ['manual_variant.md', 'manual_variant2.md'] : []
    fetchWithFallback(filename, chain).then(result => {
      if (controller.signal.aborted) return
      if (!result) {
        setMdRaw(null)
        setMdSections([])
        setMdLoading(false)
        return
      }
      // Strip YAML frontmatter (--- ... ---) added by S27 normalizer
      const body = result.body.startsWith('---\n')
        ? result.body.replace(/^---\n[\s\S]*?\n---\n+/, '')
        : result.body
      setMdRaw(body)
      setMdSections(parseMarkdownSections(body))
      setMdLoading(false)
    })

    return () => controller.abort()
  }, [kbGenPath, manualVariant])

  // Auto-select best available view
  useEffect(() => {
    if (hasMd) setViewMode('md')
    else if (hasDita) setViewMode('dita')
  }, [hasMd, hasDita])

  // ── Search-filtered MD sections + match counts ──────────────
  // Используем debouncedQuery чтобы не пересчитывать regex на каждую нажатую клавишу.
  // Cap на 300 чтобы не freeze'ить браузер на мануалах с 2k+ OCR-микро-секций.
  // TODO(s29): заменить на react-window virtualization или grouping через manual-sections.json.
  const MAX_RENDERED_SECTIONS = 300
  const allFilteredMdSections = useMemo(() => {
    if (!debouncedQuery.trim()) return mdSections
    const q = debouncedQuery.toLowerCase()
    return mdSections.filter(
      s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    )
  }, [mdSections, debouncedQuery])
  const filteredMdSections = useMemo(
    () => allFilteredMdSections.slice(0, MAX_RENDERED_SECTIONS),
    [allFilteredMdSections]
  )
  const isTruncated = allFilteredMdSections.length > MAX_RENDERED_SECTIONS

  // Плоский список всех совпадений (по секциям) — для prev/next navigation.
  // matchList[i] = {sectionId, offsetInSection} — даёт возможность переключать активное совпадение.
  const matchList = useMemo<Array<{ sectionId: string; idxInSection: number }>>(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (q.length < 2) return []
    const out: Array<{ sectionId: string; idxInSection: number }> = []
    const re = new RegExp(escapeRegExp(q), 'gi')
    for (const s of filteredMdSections) {
      let localIdx = 0
      // Title matches (если title содержит query — учитываем)
      if (s.title.toLowerCase().includes(q)) {
        out.push({ sectionId: s.id, idxInSection: localIdx++ })
      }
      // Content matches
      const content = s.content.toLowerCase()
      re.lastIndex = 0
      while (re.exec(content) !== null) {
        out.push({ sectionId: s.id, idxInSection: localIdx++ })
        if (re.lastIndex === 0) break  // avoid infinite loop on zero-length matches
      }
    }
    return out
  }, [filteredMdSections, debouncedQuery])

  const totalMatches = matchList.length

  // Сбрасываем активный match при смене query
  useEffect(() => {
    setActiveMatchIndex(0)
  }, [debouncedQuery])

  // Scroll-into-view: при смене activeMatchIndex находим нужную секцию и скроллим к ней.
  // block:'center' — секция оказывается по центру viewport'а.
  useEffect(() => {
    if (matchList.length === 0) return
    const active = matchList[activeMatchIndex]
    if (!active) return
    const el = sectionRefs.current[active.sectionId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeMatchIndex, matchList])

  const goPrevMatch = useCallback(() => {
    if (matchList.length === 0) return
    setActiveMatchIndex(i => (i - 1 + matchList.length) % matchList.length)
  }, [matchList.length])

  const goNextMatch = useCallback(() => {
    if (matchList.length === 0) return
    setActiveMatchIndex(i => (i + 1) % matchList.length)
  }, [matchList.length])

  const totalMdWords = useMemo(
    () => mdSections.reduce((sum, s) => sum + s.wordCount, 0),
    [mdSections]
  )

  const toggleMdSection = useCallback((id: string) => {
    setExpandedMdSection(prev => prev === id ? null : id)
  }, [])

  // ── Loading state ────────────────────────────────────────────
  if (loading || mdLoading) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">Руководство</div>
        <div style={{
          textAlign: 'center',
          padding: 24,
          fontFamily: 'var(--f-display), sans-serif',
          fontSize: 12,
          color: theme.accent.cyan,
          letterSpacing: '0.15em',
        }}>
          LOADING MANUAL...
        </div>
      </GlassPanel>
    )
  }

  // ── No data at all ───────────────────────────────────────────
  if (!hasDita && !hasMd) {
    return (
      <GlassPanel>
        <div className="hud-header mb-3">Руководства</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 8px' }}>
          <span style={{ fontSize: 32, opacity: 0.3 }}>&#x1F4D6;</span>
          <div style={{
            fontFamily: 'var(--f-body), sans-serif',
            fontSize: 12,
            color: theme.text.muted,
            lineHeight: 1.4,
          }}>
            {brandId && modelName
              ? `Мануал для ${modelName} загружается — скоро будет доступен.`
              : `${KB_STATS.generations} полных мануалов в базе — выберите авто или воспользуйтесь поиском выше.`}
          </div>
        </div>
      </GlassPanel>
    )
  }

  // ── DITA view ────────────────────────────────────────────────
  const manual = data?.manuals?.[0]

  const renderDitaView = () => {
    if (!manual) return null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '60vh', overflowY: 'auto' }}>
        {manual.sections.map(section => {
          const isExpanded = expandedSection === section.id
          const topicCount = section.topics.length

          return (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: isExpanded ? 'rgba(0,229,255,0.06)' : 'rgba(0,229,255,0.02)',
                  border: `1px solid ${isExpanded ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.06)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}>
                <span style={{ fontSize: 18 }}>{section.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--f-body), sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: theme.text.secondary,
                  }}>
                    {section.title.ru}
                  </div>
                  <div style={{
                    fontFamily: 'var(--f-body), sans-serif',
                    fontSize: 10,
                    color: theme.text.muted,
                  }}>
                    {topicCount} тем
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  color: theme.accent.cyan,
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>&#x25B6;</span>
              </button>

              {/* Topics */}
              {isExpanded && (
                <div style={{
                  paddingLeft: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  marginTop: 4,
                  marginBottom: 8,
                }}>
                  {section.topics.map(topic => {
                    const isTopicExpanded = expandedTopic === topic.id
                    return (
                      <div key={topic.id}>
                        <button
                          onClick={() => setExpandedTopic(isTopicExpanded ? null : topic.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 3,
                            background: isTopicExpanded ? 'rgba(0,229,255,0.04)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.2s',
                          }}>
                          <span style={{
                            width: 4, height: 4, borderRadius: '50%',
                            background: isTopicExpanded ? theme.accent.cyan : 'rgba(0,229,255,0.3)',
                            flexShrink: 0,
                            boxShadow: isTopicExpanded ? `0 0 6px ${theme.accent.cyan}` : 'none',
                          }} />
                          <span style={{
                            fontFamily: 'var(--f-body), sans-serif',
                            fontSize: 12,
                            fontWeight: 500,
                            color: isTopicExpanded ? theme.text.primary : theme.text.secondary,
                            flex: 1,
                          }}>
                            {topic.title.ru || topic.title.en}
                          </span>
                          {topic.words && (
                            <span style={{ fontFamily: 'monospace', fontSize: 9, color: theme.text.muted }}>
                              {topic.words}w
                            </span>
                          )}
                        </button>

                        {isTopicExpanded && topic.content?.ru && (
                          <div style={{
                            marginLeft: 22,
                            padding: '8px 12px',
                            borderLeft: '2px solid rgba(0,229,255,0.15)',
                            fontFamily: 'var(--f-body), sans-serif',
                            fontSize: 12,
                            color: theme.text.muted,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                          }}>
                            {topic.content.ru}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Markdown view ────────────────────────────────────────────
  const renderMdView = () => {
    if (!hasMd) return null

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Search bar — with variant selector + prev/next nav */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (e.shiftKey) goPrevMatch(); else goNextMatch()
                } else if (e.key === 'Escape') {
                  setSearchQuery('')
                }
              }}
              placeholder="Поиск по руководству… (Enter — далее, Shift+Enter — назад)"
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: 4,
                border: '1px solid rgba(0,229,255,0.15)',
                background: 'rgba(0,0,0,0.2)',
                color: theme.text.primary,
                fontFamily: 'var(--f-body), sans-serif',
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.4)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,229,255,0.15)' }}
            />
            <span style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 13,
              opacity: 0.4,
            }}>&#x1F50D;</span>
          </div>

          {/* Prev/next nav — показываем когда есть совпадения */}
          {debouncedQuery.trim().length >= 2 && totalMatches > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={goPrevMatch}
                title="Предыдущее совпадение (Shift+Enter)"
                style={{
                  width: 28, height: 28, border: '1px solid rgba(0,229,255,0.2)',
                  background: 'rgba(0,229,255,0.04)', color: theme.accent.cyan,
                  borderRadius: 3, cursor: 'pointer', fontSize: 12, padding: 0,
                }}
              >&#9650;</button>
              <span style={{
                fontFamily: 'var(--f-display), sans-serif', fontSize: 11,
                color: 'var(--c-champagne)', minWidth: 56, textAlign: 'center',
                padding: '4px 6px', border: '1px solid rgba(230,212,168,0.2)',
                borderRadius: 3, letterSpacing: '0.05em',
              }}>
                {activeMatchIndex + 1}/{totalMatches}
              </span>
              <button
                type="button"
                onClick={goNextMatch}
                title="Следующее совпадение (Enter)"
                style={{
                  width: 28, height: 28, border: '1px solid rgba(0,229,255,0.2)',
                  background: 'rgba(0,229,255,0.04)', color: theme.accent.cyan,
                  borderRadius: 3, cursor: 'pointer', fontSize: 12, padding: 0,
                }}
              >&#9660;</button>
            </div>
          )}

          {/* Variant selector — только если variants > 1 */}
          {availableVariants.length > 1 && (
            <select
              value={manualVariant}
              onChange={e => setManualVariant(e.target.value as 'main' | 'variant' | 'variant2')}
              title="Версия руководства"
              style={{
                padding: '6px 10px', fontFamily: 'var(--f-body)', fontSize: 12,
                background: 'rgba(12,18,32,0.6)', color: theme.text.primary,
                border: '1px solid rgba(0,229,255,0.2)', borderRadius: 3,
                outline: 'none', cursor: 'pointer',
              }}
            >
              {availableVariants.includes('main') && <option value="main">Основная</option>}
              {availableVariants.includes('variant') && <option value="variant">Вариант 1</option>}
              {availableVariants.includes('variant2') && <option value="variant2">Вариант 2</option>}
            </select>
          )}
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 4px',
        }}>
          <span style={{
            fontFamily: 'var(--f-body), sans-serif',
            fontSize: 11,
            color: theme.text.muted,
          }}>
            {isTruncated
              ? `${filteredMdSections.length} из ${allFilteredMdSections.length} секций`
              : `${filteredMdSections.length} из ${mdSections.length} секций`
            }
            {debouncedQuery.trim().length >= 2 && totalMatches > 0 && (
              <span style={{ marginLeft: 10, color: 'rgba(255,220,120,0.9)' }}>
                · {totalMatches} совпадений
              </span>
            )}
          </span>
          <span style={{
            fontFamily: 'var(--f-display), sans-serif',
            fontSize: 10,
            color: theme.accent.cyan,
            opacity: 0.6,
          }}>
            {totalMdWords.toLocaleString()} слов
          </span>
        </div>

        {/* Truncation warning — для мануалов с 2k+ OCR-микро-секций */}
        {isTruncated && (
          <div style={{
            fontSize: 11,
            fontFamily: 'var(--f-body), sans-serif',
            color: 'rgba(230,212,168,0.9)',
            padding: '6px 10px',
            background: 'rgba(230,212,168,0.06)',
            border: '1px solid rgba(230,212,168,0.2)',
            borderRadius: 4,
            lineHeight: 1.4,
          }}>
            Показаны первые {MAX_RENDERED_SECTIONS} секций из {allFilteredMdSections.length}. Используйте поиск чтобы сузить выборку.
          </div>
        )}

        {/* Sections */}
        <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {filteredMdSections.length === 0 && debouncedQuery.trim().length >= 2 && (
            <div style={{
              textAlign: 'center',
              padding: 20,
              fontFamily: 'var(--f-body), sans-serif',
              fontSize: 12,
              color: theme.text.muted,
            }}>
              Ничего не найдено по запросу &laquo;{debouncedQuery}&raquo;
            </div>
          )}

          {filteredMdSections.map(section => {
            // During active search, keep all matched sections open so user
            // sees all occurrences at once. Otherwise use the regular toggle state.
            const isSearching = debouncedQuery.trim().length >= 2
            const isExpanded = isSearching ? true : expandedMdSection === section.id
            const activeMatch = matchList[activeMatchIndex]
            const isActiveSection = activeMatch?.sectionId === section.id

            return (
              <div
                key={section.id}
                ref={el => { sectionRefs.current[section.id] = el }}
                style={{
                  // Подсветка активной секции оранжевой линией слева
                  borderLeft: isActiveSection && isSearching ? '3px solid var(--c-champagne, #ffc071)' : '3px solid transparent',
                  paddingLeft: isActiveSection && isSearching ? 4 : 0,
                  transition: 'border-color 0.3s',
                }}
              >
                <button
                  onClick={() => toggleMdSection(section.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: section.level === 1 ? '10px 12px' : '7px 12px',
                    paddingLeft: section.level > 1 ? 12 + (section.level - 1) * 14 : 12,
                    borderRadius: 4,
                    background: isExpanded ? 'rgba(0,229,255,0.06)' : 'rgba(0,229,255,0.02)',
                    border: `1px solid ${isExpanded ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.06)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: 10,
                    color: theme.accent.cyan,
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                  }}>&#x25B6;</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--f-body), sans-serif',
                      fontSize: section.level === 1 ? 14 : section.level === 2 ? 13 : 12,
                      fontWeight: section.level === 1 ? 700 : 600,
                      color: section.level === 1 ? theme.text.primary : theme.text.secondary,
                    }}>
                      {isSearching ? highlightText(section.title, debouncedQuery) : section.title}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 9,
                    color: theme.text.muted,
                    flexShrink: 0,
                  }}>
                    {section.wordCount}w
                  </span>
                </button>

                {isExpanded && (
                  <div style={{
                    padding: '10px 14px',
                    marginLeft: section.level > 1 ? (section.level - 1) * 14 : 0,
                    borderLeft: `2px solid rgba(0,229,255,0.15)`,
                    marginTop: 2,
                    marginBottom: 6,
                  }}>
                    {isSearching && (() => {
                      const q = debouncedQuery.trim().toLowerCase()
                      const cl = section.content.toLowerCase()
                      const idx = cl.indexOf(q)
                      if (idx < 0) return null
                      const start = Math.max(0, idx - 80)
                      const end = Math.min(section.content.length, idx + q.length + 160)
                      const snippet = (start > 0 ? '…' : '') + section.content.slice(start, end) + (end < section.content.length ? '…' : '')
                      return (
                        <div style={{
                          fontSize: 12,
                          fontFamily: 'var(--f-body), sans-serif',
                          color: theme.text.secondary,
                          padding: '6px 10px',
                          marginBottom: 8,
                          background: isActiveSection ? 'rgba(255,180,80,0.1)' : 'rgba(255,220,120,0.05)',
                          border: isActiveSection ? '1px solid rgba(255,180,80,0.4)' : '1px solid rgba(255,220,120,0.15)',
                          borderRadius: 4,
                          lineHeight: 1.5,
                        }}>
                          {highlightText(snippet, debouncedQuery)}
                        </div>
                      )
                    })()}
                    {renderMarkdownContent(section.content)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────

  const headerTitle = viewMode === 'md'
    ? 'Руководство (.md)'
    : (manual?.label.ru || 'Руководство')

  return (
    <GlassPanel>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div className="hud-header" style={{ margin: 0 }}>{headerTitle}</div>

        {/* Format toggle — only when both formats available */}
        {hasDita && hasMd && (
          <div style={{
            display: 'flex',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(0,229,255,0.15)',
          }}>
            <button
              onClick={() => setViewMode('dita')}
              style={{
                padding: '4px 10px',
                fontFamily: 'var(--f-display), sans-serif',
                fontSize: 9,
                letterSpacing: '0.05em',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'dita' ? 'rgba(0,229,255,0.15)' : 'transparent',
                color: viewMode === 'dita' ? theme.accent.cyan : theme.text.muted,
              }}
            >
              DITA
            </button>
            <button
              onClick={() => setViewMode('md')}
              style={{
                padding: '4px 10px',
                fontFamily: 'var(--f-display), sans-serif',
                fontSize: 9,
                letterSpacing: '0.05em',
                border: 'none',
                borderLeft: '1px solid rgba(0,229,255,0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'md' ? 'rgba(0,229,255,0.15)' : 'transparent',
                color: viewMode === 'md' ? theme.accent.cyan : theme.text.muted,
              }}
            >
              .MD
            </button>
          </div>
        )}
      </div>

      {viewMode === 'dita' && renderDitaView()}
      {viewMode === 'md' && renderMdView()}
    </GlassPanel>
  )
}
