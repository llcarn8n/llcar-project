import { useState, useRef, useEffect } from 'react'
import { theme } from '../../theme'
import type { DiagnosticReport } from '../../hooks/useDiagnosticV2'
import { exportReport } from '../../utils/exportReport'

interface ShareButtonProps {
  report: DiagnosticReport
  clientHash: string
}

const CAN_DRIVE_LABELS: Record<string, string> = {
  safe: 'Да',
  caution: 'Осторожно',
  stop: 'Нет',
}

function buildShareText(report: DiagnosticReport): string {
  const lines: string[] = []

  lines.push(`Health Score: ${report.health_scores.overall}/100`)

  const topDiag = report.diagnoses
    .filter(d => d.status === 'likely' || d.status === 'possible')
    .sort((a, b) => b.confidence - a.confidence)[0]
  if (topDiag) {
    lines.push(`${topDiag.display} — ${topDiag.confidence}%`)
  } else {
    lines.push('Проблем не обнаружено')
  }

  const driveLabel = CAN_DRIVE_LABELS[report.can_drive] ?? report.can_drive
  lines.push(`Можно ехать: ${driveLabel}`)

  lines.push('')
  lines.push('Диагностика от LLCAR')
  lines.push('https://llcar.ru')

  return lines.join('\n')
}

export function ShareButton({ report, clientHash }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const shareText = buildShareText(report)

  async function handleNativeShare() {
    try {
      await navigator.share({
        title: 'LLCAR Диагностика',
        text: shareText,
        url: window.location.href,
      })
    } catch {
      // User cancelled or API unavailable — ignore
    }
    setOpen(false)
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    setOpen(false)
  }

  function handleTelegram() {
    const text = encodeURIComponent(shareText)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener')
    setOpen(false)
  }

  function handlePdf() {
    exportReport(report, clientHash)
    setOpen(false)
  }

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  const menuItems = [
    ...(hasNativeShare
      ? [{ label: 'Поделиться...', icon: '\u2197', action: handleNativeShare }]
      : []),
    { label: copied ? 'Скопировано!' : 'Скопировать ссылку', icon: '\uD83D\uDD17', action: handleCopyLink },
    { label: 'Telegram', icon: '\u2708', action: handleTelegram },
    { label: 'Сохранить PDF', icon: '\uD83D\uDCC4', action: handlePdf },
  ]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev) }}
        style={{
          padding: '3px 8px',
          fontSize: 9,
          fontFamily: "'Orbitron', sans-serif",
          color: theme.text.muted,
          background: 'transparent',
          border: `1px solid ${theme.text.muted}30`,
          borderRadius: 2,
          cursor: 'pointer',
          letterSpacing: '0.1em',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
        title="Поделиться отчётом"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 180,
            padding: '4px 0',
            borderRadius: 4,
            background: 'rgba(10, 15, 20, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid rgba(0, 229, 255, 0.15)`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            animation: 'shareMenuIn 0.15s ease-out',
          }}
        >
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); item.action() }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: theme.text.secondary,
                fontSize: 12,
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                letterSpacing: '0.02em',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 229, 255, 0.08)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Dropdown animation keyframes */}
      <style>{`
        @keyframes shareMenuIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
