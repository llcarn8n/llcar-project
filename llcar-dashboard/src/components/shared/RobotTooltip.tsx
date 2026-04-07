import { useState } from 'react'
import { theme } from '../../theme'
import robotImg from '../../assets/robot-default.png'

interface RobotTooltipProps {
  text: string
  children: React.ReactNode
}

export function RobotTooltip({ text, children }: RobotTooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          animation: 'fadeIn 0.2s ease',
        }}>
          <img src={robotImg} alt="" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{
            background: 'rgba(12,18,32,0.95)',
            border: `1px solid ${theme.accent.cyan}25`,
            borderRadius: 8,
            padding: '8px 12px',
            maxWidth: 220,
            fontSize: 11,
            fontFamily: "'Rajdhani', sans-serif",
            color: theme.text.secondary,
            lineHeight: 1.4,
            boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 12px ${theme.accent.cyan}10`,
            whiteSpace: 'normal' as const,
          }}>
            {text}
            <div style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              width: 10,
              height: 10,
              background: 'rgba(12,18,32,0.95)',
              border: `1px solid ${theme.accent.cyan}25`,
              borderTop: 'none',
              borderLeft: 'none',
              transform: 'translateX(-50%) rotate(45deg)',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
