import { useState } from 'react'
import { theme } from '../../theme'

interface FeedbackButtonsProps {
  ruleName: string
  onFeedback: (action: 'confirmed' | 'dismissed') => Promise<boolean>
}

export function FeedbackButtons({ ruleName: _ruleName, onFeedback }: FeedbackButtonsProps) {
  const [sent, setSent] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const handleClick = async (action: 'confirmed' | 'dismissed') => {
    setSending(true)
    const ok = await onFeedback(action)
    if (ok) setSent(action)
    setSending(false)
  }

  if (sent) {
    return (
      <div style={{
        fontSize: 10, fontFamily: "var(--f-body)", color: theme.accent.cyan,
        padding: '4px 8px', textAlign: 'center',
        background: `${theme.accent.cyan}08`, border: `1px solid ${theme.accent.cyan}20`, borderRadius: 2,
      }}>
        {sent === 'confirmed' ? 'Подтверждено' : 'Отклонено'} — спасибо!
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={() => handleClick('confirmed')}
        disabled={sending}
        style={{
          flex: 1, padding: '4px 8px', fontSize: 10, fontFamily: "var(--f-body)",
          fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer',
          color: theme.status.ok, background: `${theme.status.ok}10`,
          border: `1px solid ${theme.status.ok}30`, borderRadius: 2,
          opacity: sending ? 0.5 : 1, transition: 'all 0.2s',
        }}
      >
        ✓ Подтверждаю
      </button>
      <button
        onClick={() => handleClick('dismissed')}
        disabled={sending}
        style={{
          flex: 1, padding: '4px 8px', fontSize: 10, fontFamily: "var(--f-body)",
          fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer',
          color: theme.status.warning, background: `${theme.status.warning}10`,
          border: `1px solid ${theme.status.warning}30`, borderRadius: 2,
          opacity: sending ? 0.5 : 1, transition: 'all 0.2s',
        }}
      >
        ✗ Не так
      </button>
    </div>
  )
}
