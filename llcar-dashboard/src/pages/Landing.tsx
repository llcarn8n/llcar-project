import { VehicleSelect } from '../components/landing/VehicleSelect'
import { theme } from '../theme'

// Robot assistant images (compressed WebP in public/)
const ROBOT_IMAGES = [
  'Error_Codes_Caricature_2QMgiRXQ',
  'Error_Codes_Caricature_VgN6CxZS',
  'Error_Codes_Caricature_TX7IgJ34',
]

// Comic images (compressed WebP in public/)
const COMICS = [
  { file: '1', caption: 'LLCAR — профессиональная диагностика в твоём телефоне' },
  { file: 'Error_Codes_Caricature_KX1ypbUf', caption: 'Проблема? LLCAR подскажет решение!' },
  { file: 'Error_Codes_Caricature_DCC19Kio__1_', caption: 'Не откладывай — диагностируй сразу' },
]

export function Landing() {
  const robotSrc = `${import.meta.env.BASE_URL}images/robot/${ROBOT_IMAGES[0]}.webp`

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
          position: 'absolute', top: '15%', left: '10%', width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.accent.cyan}20 0%, transparent 70%)`,
          filter: 'blur(80px)', animation: 'breathe1 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '5%', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,23,68,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'breathe2 18s ease-in-out infinite',
        }} />
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
        {/* Left: Pitch + Robot + Comics */}
        <div style={{ flex: '1 1 500px', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Hero text + robot */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Holographic glow behind robot */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 160, height: 160,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,229,255,0.25) 0%, transparent 70%)',
                filter: 'blur(25px)',
                animation: 'breathe1 4s ease-in-out infinite',
              }} />
              {/* Pulse ring */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 130, height: 130,
                borderRadius: '50%',
                border: '1px solid rgba(0,229,255,0.15)',
                animation: 'pulse-glow 3s ease-out infinite',
              }} />
              <img
                src={robotSrc}
                alt="LLCAR помощник"
                style={{
                  width: 130,
                  height: 130,
                  objectFit: 'contain',
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 8px 30px rgba(0,229,255,0.5)) drop-shadow(0 0 10px rgba(0,229,255,0.3))',
                  animation: 'float 5s ease-in-out infinite',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h1 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 26,
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
                fontSize: 15,
                fontWeight: 500,
                color: theme.text.secondary,
                margin: 0,
                lineHeight: 1.5,
                letterSpacing: '0.02em',
              }}>
                Находи. Понимай. Чини сам. База знаний по 58 маркам,
                36 000 кодов ошибок, сервисные мануалы и живая диагностика.
              </p>
            </div>
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
                transition: 'all 0.3s',
              }}>
                <span style={{ fontSize: 18, filter: `drop-shadow(0 0 6px ${accent})` }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>

          {/* Comics grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {COMICS.map(({ file, caption }) => (
              <div key={file} style={{
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid rgba(0,229,255,0.1)',
                background: 'rgba(0,229,255,0.02)',
                transition: 'all 0.3s',
              }}>
                <img
                  src={`${import.meta.env.BASE_URL}images/comics/${file}.webp`}
                  alt={caption}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
                <div style={{
                  padding: '8px 10px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: theme.text.muted,
                  letterSpacing: '0.02em',
                  lineHeight: 1.3,
                }}>
                  {caption}
                </div>
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
