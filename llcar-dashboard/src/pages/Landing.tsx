import { VehicleSelect } from '../components/landing/VehicleSelect'
import { theme } from '../theme'
import { ICONS } from '../utils/icons'

// 7 JTBD situations from CustDev2
const SITUATIONS = [
  { icon: '\u{1F527}', title: 'Подходит ТО', desc: 'Узнай что реально нужно — не переплачивай за лишнее' },
  { icon: '\u{1F6E3}', title: 'Дальняя поездка', desc: 'Проверь авто перед дорогой — допуск к старту за 3 минуты' },
  { icon: '\u26A0', title: 'Check Engine', desc: '«Можно ли ехать?» — мгновенный ответ с расшифровкой' },
  { icon: '\u{1F50D}', title: 'Странный звук или вибрация', desc: 'Микрофон + акселерометр найдут причину' },
  { icon: '\u{1F4B0}', title: 'Продажа авто', desc: 'Health Score — объективная оценка состояния для покупателя' },
  { icon: '\u{1F6E1}', title: 'Хочу спокойствие', desc: 'Зелёная галочка = с машиной всё хорошо' },
]

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

      {/* Particles */}
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
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 32px', position: 'relative', zIndex: 2,
      }}>
        <img src={`${import.meta.env.BASE_URL}llcar-logo.png`} alt="LLCAR" style={{
          height: 40, width: 40,
          filter: 'brightness(2.0) drop-shadow(0 0 10px rgba(0,229,255,0.8))',
        }} />
        <span style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.2em',
          background: `linear-gradient(135deg, ${theme.accent.cyan}, ${theme.accent.teal})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LLCAR</span>
      </header>

      {/* Main: Hero + Vehicle Select */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 32px 20px', gap: 48, position: 'relative', zIndex: 2, flexWrap: 'wrap',
      }}>
        {/* Left: Pitch */}
        <div style={{ flex: '1 1 520px', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Hero */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <img src={ICONS.scanner} alt="" style={{
              width: 110, height: 110, objectFit: 'contain', flexShrink: 0,
              filter: 'drop-shadow(0 4px 20px rgba(0,229,255,0.4))',
              animation: 'float 5s ease-in-out infinite',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h1 style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: 26, fontWeight: 700,
                letterSpacing: '0.06em', lineHeight: 1.3, color: theme.text.primary, margin: 0,
                textShadow: '0 0 20px rgba(0,229,255,0.3)',
              }}>
                Знай о машине больше,
                <br />
                <span style={{
                  background: `linear-gradient(135deg, ${theme.accent.cyan}, ${theme.accent.teal})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>чем автосервис</span>
              </h1>
              <p style={{
                fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 500,
                color: theme.text.secondary, margin: 0, lineHeight: 1.6, maxWidth: 480,
              }}>
                Подключи адаптер, заведи двигатель — LLCAR читает данные,
                слушает звуки, чувствует вибрации и ставит диагноз за минуты.
                Без поездки на СТО.
              </p>
            </div>
          </div>

          {/* Unique tech — what competitors don't have */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { icon: '\u{1F4F3}', title: 'Анализ вибраций', desc: 'Акселерометр находит износ подвески, дисбаланс колёс, подшипники — прямо на ходу', accent: '#00E5FF' },
              { icon: '\u{1F3A4}', title: 'Слышит проблемы', desc: 'Микрофон ловит стуки, свисты ремней, утечки выхлопа. Аудиоанализ в реальном времени', accent: '#FF8C00' },
              { icon: '\u{1F517}', title: '103 правила', desc: 'Перекрёстная проверка: вибрация + обороты + звук → точный диагноз, а не угадайка', accent: '#64FFDA' },
              { icon: '\u{1F4C8}', title: 'Ловит до поломки', desc: 'CUSUM-алгоритм отслеживает деградацию — предупредит за недели до проблемы', accent: '#00E676' },
            ].map(({ icon, title, desc, accent }) => (
              <div key={title} style={{
                padding: '14px 16px', borderRadius: 6,
                background: `linear-gradient(135deg, ${accent}08 0%, rgba(0,10,20,0.5) 100%)`,
                border: `1px solid ${accent}25`, borderLeft: `3px solid ${accent}`,
                boxShadow: `0 2px 12px ${accent}10, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18, filter: `drop-shadow(0 0 4px ${accent})` }}>{icon}</span>
                  <span style={{
                    fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 700,
                    color: accent, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  }}>{title}</span>
                </div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 500,
                  color: theme.text.muted, lineHeight: 1.4,
                }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* JTBD situations from CustDev */}
          <div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 700,
              letterSpacing: '0.15em', color: theme.accent.orange, marginBottom: 10,
              textTransform: 'uppercase' as const,
            }}>
              В какой ситуации поможет LLCAR?
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SITUATIONS.map(s => (
                <div key={s.title} style={{
                  padding: '8px 14px', borderRadius: 4,
                  background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.1)',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 600,
                  color: theme.text.secondary, display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s', cursor: 'default',
                }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span>{s.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats line */}
          <div style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 600,
            color: theme.text.muted, letterSpacing: '0.05em',
          }}>
            58 марок &bull; 999 моделей &bull; 36 000 кодов ошибок &bull; 333 мануала &bull; 298 отзывных кампаний
          </div>
        </div>

        {/* Right: Vehicle selection */}
        <div style={{
          flex: '0 0 360px', maxWidth: 400, padding: '32px 28px', borderRadius: 8,
          background: 'linear-gradient(180deg, rgba(0,229,255,0.04) 0%, rgba(6,15,25,0.7) 30%, rgba(6,15,25,0.8) 100%)',
          backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: '1px solid rgba(0,229,255,0.2)', borderTop: '2px solid rgba(0,229,255,0.4)',
          boxShadow: '0 0 50px rgba(0,229,255,0.08), 0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          animation: 'borderPulse 4s ease-in-out infinite',
        }}>
          <VehicleSelect />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '16px 32px', textAlign: 'center', position: 'relative', zIndex: 2,
      }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 600,
          color: theme.text.muted, letterSpacing: '0.05em',
        }}>
          LLCAR — знай о машине больше, чем автосервис
        </span>
      </footer>
    </div>
  )
}
