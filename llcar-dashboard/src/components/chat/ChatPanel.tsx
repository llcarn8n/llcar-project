import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

const ROBOT_IMG = `${import.meta.env.BASE_URL}images/robot/Error_Codes_Caricature_FoBufK7g.webp`

export function ChatPanel() {
  return (
    <GlassPanel>
      <div className="hud-header mb-3">Чат с диагностом</div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '24px 16px',
      }}>
        <img
          src={ROBOT_IMG}
          alt="LLCAR помощник"
          style={{
            width: 80,
            height: 80,
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 16px rgba(0,229,255,0.25))',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: theme.text.secondary,
          }}>
            Скоро здесь появится умный помощник
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 12,
            color: theme.text.muted,
            lineHeight: 1.5,
          }}>
            Задавайте вопросы по диагностике, кодам ошибок и ремонту —
            ИИ-помощник ответит на основе базы знаний по вашей модели.
            764 ситуации, 36 000 DTC, сервисные мануалы.
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 4,
            background: `${theme.accent.cyan}08`,
            border: `1px solid ${theme.accent.cyan}20`,
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: theme.accent.cyan,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            alignSelf: 'flex-start',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: theme.accent.teal,
              boxShadow: `0 0 6px ${theme.accent.teal}`,
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            В разработке
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
