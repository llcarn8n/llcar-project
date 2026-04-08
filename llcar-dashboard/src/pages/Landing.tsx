import { VehicleSelect } from '../components/landing/VehicleSelect'
import { theme } from '../theme'

export function Landing() {
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg.void,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '10%', left: '5%', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 60%)',
          filter: 'blur(80px)', animation: 'breathe1 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '0%', right: '0%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.08) 0%, transparent 60%)',
          filter: 'blur(70px)', animation: 'breathe2 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 60%)',
          filter: 'blur(60px)', animation: 'breathe1 20s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Floating particles */}
      <div className="particles-container">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 20}s`,
          }} />
        ))}
      </div>

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '20px 32px',
        position: 'relative',
        zIndex: 2,
      }}>
        <img
          src={`${import.meta.env.BASE_URL}llcar-logo.png`}
          alt="LLCAR"
          style={{
            height: 40, width: 40,
            filter: 'brightness(2.0) drop-shadow(0 0 10px rgba(0,229,255,0.8))',
          }}
        />
        <span style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.2em',
          background: `linear-gradient(135deg, ${theme.accent.cyan}, ${theme.accent.teal})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          LLCAR
        </span>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 12,
          color: theme.text.muted,
          letterSpacing: '0.1em',
          marginLeft: 4,
        }}>
          LONG LIFE CAR
        </span>
      </header>

      {/* Main content: two columns */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px 40px',
        gap: 48,
        position: 'relative',
        zIndex: 2,
        flexWrap: 'wrap',
      }}>
        {/* Left: Pitch */}
        <div style={{ flex: '1 1 500px', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Hero text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h1 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.08em',
              lineHeight: 1.3,
              color: theme.text.primary,
              margin: 0,
              textShadow: '0 0 20px rgba(0,229,255,0.3), 0 0 40px rgba(0,229,255,0.15)',
              filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))',
            }}>
              Профессиональная
              <br />
              <span style={{
                background: `linear-gradient(135deg, ${theme.accent.cyan}, ${theme.accent.teal})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                диагностика
              </span>
              {' '}в твоём телефоне
            </h1>
            <p style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 16,
              fontWeight: 500,
              color: theme.text.secondary,
              margin: 0,
              lineHeight: 1.6,
              letterSpacing: '0.02em',
              maxWidth: 520,
            }}>
              Находи. Понимай. Чини сам. База знаний по 58 маркам,
              36 000 кодов ошибок, сервисные мануалы и живая диагностика.
            </p>
          </div>

          {/* Feature badges */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { icon: '\u26A1', text: 'Мгновенная диагностика', accent: '#00E5FF' },
              { icon: '\u{1F4DA}', text: '999 моделей в базе', accent: '#64FFDA' },
              { icon: '\u{1F50D}', text: '36 000 кодов ошибок', accent: '#FF8C00' },
              { icon: '\u{1F6E0}', text: 'Пошаговый ремонт', accent: '#00E676' },
            ].map(({ icon, text, accent }) => (
              <div key={text} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderRadius: 6,
                background: `linear-gradient(135deg, ${accent}10 0%, ${accent}04 100%)`,
                border: `1px solid ${accent}30`,
                borderLeft: `3px solid ${accent}`,
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: accent,
                letterSpacing: '0.04em',
                boxShadow: `0 2px 12px ${accent}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}>
                <span style={{ fontSize: 18, filter: `drop-shadow(0 0 6px ${accent})` }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Vehicle selection */}
        <div style={{
          flex: '0 0 360px',
          maxWidth: 400,
          padding: '32px 28px',
          borderRadius: 8,
          background: 'linear-gradient(180deg, rgba(0,229,255,0.04) 0%, rgba(6,15,25,0.7) 30%, rgba(6,15,25,0.8) 100%)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: '1px solid rgba(0,229,255,0.2)',
          borderTop: '2px solid rgba(0,229,255,0.4)',
          boxShadow: '0 0 50px rgba(0,229,255,0.08), 0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 40px rgba(0,229,255,0.03)',
          animation: 'borderPulse 4s ease-in-out infinite',
        }}>
          <VehicleSelect />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '16px 32px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 11,
          color: theme.text.muted,
          letterSpacing: '0.05em',
        }}>
          LLCAR &copy; 2026 &mdash; 58 марок &bull; 999 моделей &bull; 36 000 DTC кодов
        </span>
      </footer>
    </div>
  )
}
