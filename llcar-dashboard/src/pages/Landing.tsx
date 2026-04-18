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
      {/* Background orbs — champagne/amber/void */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,212,168,0.10) 0%, transparent 60%)', filter: 'blur(80px)', animation: 'breathe1 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '0%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,148,70,0.07) 0%, transparent 60%)', filter: 'blur(70px)', animation: 'breathe2 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,190,199,0.05) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'breathe1 20s ease-in-out infinite reverse' }} />
      </div>

      {/* Particles */}
      <div className="particles-container">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 20}s`, animationDuration: `${15 + Math.random() * 20}s` }} />
        ))}
      </div>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 32px', position: 'relative', zIndex: 2 }}>
        <img
          src={`${import.meta.env.BASE_URL}llcar-logo.png`}
          alt="LLCAR"
          style={{
            height: 40,
            width: 40,
            filter: 'brightness(1.5) contrast(1.1) saturate(1.2) drop-shadow(0 0 10px rgba(255,239,180,0.55)) drop-shadow(0 0 22px rgba(232,184,110,0.4)) drop-shadow(0 0 48px rgba(200,148,70,0.2))',
          }}
        />
        <span style={{
          fontFamily: 'var(--f-display)',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--c-champagne)',
          textShadow: '0 0 18px rgba(230,212,168,0.4)',
        }}>LLCAR</span>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px 20px', gap: 48, position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>

        {/* Left: Sales pitch */}
        <div style={{ flex: '1 1 540px', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* HERO */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--f-display)',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '0.04em',
                lineHeight: 1.3,
                color: '#FFFFFF',
                margin: '0 0 12px',
                textShadow: '0 0 24px rgba(230,212,168,0.25)',
              }}>
                Твоя машина в порядке.
                <br />
                <span style={{ color: 'var(--c-champagne)', textShadow: '0 0 18px rgba(230,212,168,0.45)' }}>
                  Точно.
                </span>
              </h1>
              <p style={{
                fontFamily: 'var(--f-body)',
                fontSize: 16,
                fontWeight: 500,
                color: '#FFFFFF',
                margin: 0,
                lineHeight: 1.6,
                maxWidth: 460,
                opacity: 0.85,
              }}>
                Перестань гадать, что с машиной. Подключи телефон — и получи понятный ответ за 2 минуты.
              </p>
            </div>
          </div>

          {/* 3 PAIN BLOCKS — все champagne, monochrome aerospace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                title: 'Не понимаю, что с машиной',
                pain: 'Странный звук. Вибрация на скорости. Чек мигнул и пропал.',
                solution: 'LLCAR слушает машину, чувствует вибрации и читает датчики. Потом говорит по-русски: что не так и что делать.',
              },
              {
                title: 'Боюсь, что разводят на СТО',
                pain: '«Надо менять всё.» А знакомый мастер говорит — можно было не менять.',
                solution: 'Покажи отчёт мастеру. Пусть обоснует, если не согласен. 7 из 10 владельцев сталкивались с этим.',
              },
              {
                title: 'Просто хочу не думать об этом',
                pain: 'Не хочешь разбираться в датчиках. Хочешь сесть и поехать.',
                solution: 'Зелёный — езжай. Жёлтый — запланируй. Красный — не тяни. Три цвета вместо тысячи цифр.',
              },
            ].map(({ title, pain, solution }) => (
              <div key={title} style={{
                padding: '16px 18px',
                borderRadius: 6,
                background: 'linear-gradient(135deg, rgba(230,212,168,0.04) 0%, rgba(5,5,5,0.55) 100%)',
                border: '1px solid rgba(230,212,168,0.18)',
                borderLeft: '3px solid var(--c-champagne)',
                boxShadow: '0 2px 14px rgba(230,212,168,0.06)',
              }}>
                <div style={{
                  fontFamily: 'var(--f-display)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--c-champagne)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 6,
                }}>
                  {title}
                </div>
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize: 13,
                  color: '#FFFFFF',
                  opacity: 0.6,
                  lineHeight: 1.45,
                  marginBottom: 6,
                  fontStyle: 'italic',
                }}>
                  {pain}
                </div>
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#FFFFFF',
                  lineHeight: 1.5,
                  opacity: 0.9,
                }}>
                  {solution}
                </div>
              </div>
            ))}
          </div>

          {/* JTBD situations */}
          <div>
            <div style={{
              fontFamily: 'var(--f-display)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: 'var(--c-champagne)',
              marginBottom: 10,
              textTransform: 'uppercase' as const,
            }}>
              Когда LLCAR нужен больше всего
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {[
                { icon: '\u26A0', title: 'Check Engine', desc: '«Можно ли ехать?» — мгновенный ответ с объяснением' },
                { icon: '\u{1F6E3}', title: 'Дальняя дорога', desc: 'Допуск к старту за день до поездки. 87/100 — езжай спокойно' },
                { icon: '\u{1F527}', title: 'ТО за 45 000?', desc: 'Что реально пора менять, а что ещё походит. Экономия до 10 500 ₽' },
                { icon: '\u{1F4B0}', title: 'Продаёшь авто', desc: 'Сертификат LLCAR с QR. Прозрачность добавляет 5-10% к цене' },
              ].map(s => (
                <div key={s.title} style={{
                  padding: '12px 14px',
                  borderRadius: 4,
                  background: 'rgba(230,212,168,0.035)',
                  border: '1px solid rgba(230,212,168,0.12)',
                }}>
                  <div style={{
                    fontFamily: 'var(--f-body)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: 4,
                  }}>
                    <span style={{ marginRight: 6 }}>{s.icon}</span>{s.title}
                  </div>
                  <div style={{
                    fontFamily: 'var(--f-body)',
                    fontSize: 11,
                    color: '#FFFFFF',
                    opacity: 0.6,
                    lineHeight: 1.45,
                  }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anxiety reducer */}
          <div style={{
            padding: '14px 18px',
            borderRadius: 6,
            background: 'rgba(230,212,168,0.025)',
            border: '1px solid rgba(230,212,168,0.12)',
          }}>
            <div style={{
              fontFamily: 'var(--f-display)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--c-champagne)',
              marginBottom: 6,
              letterSpacing: '0.04em',
            }}>
              «А не сломаю машину?»
            </div>
            <div style={{
              fontFamily: 'var(--f-body)',
              fontSize: 12,
              color: '#FFFFFF',
              opacity: 0.8,
              lineHeight: 1.55,
            }}>
              Не сломаешь. LLCAR только читает данные — как градусник. Не пишет в блок управления, не меняет настройки, не трогает гарантию. Стандартный OBD-порт, который есть в каждой машине с 2001 года.
            </div>
          </div>

          {/* Stats */}
          <div style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 12,
            fontWeight: 500,
            color: '#FFFFFF',
            opacity: 0.65,
            letterSpacing: '0.04em',
          }}>
            58 марок &bull; 999 моделей &bull; 36 000 кодов &bull; 103 правила проверки
          </div>
        </div>

        {/* Right: Vehicle selection */}
        <div style={{
          flex: '0 0 360px',
          maxWidth: 400,
          padding: '32px 28px',
          borderRadius: 10,
          background: 'linear-gradient(180deg, rgba(230,212,168,0.06) 0%, rgba(10,10,12,0.72) 30%, rgba(5,5,5,0.85) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(230,212,168,0.28)',
          borderTop: '2px solid rgba(230,212,168,0.5)',
          boxShadow: '0 0 60px rgba(230,212,168,0.10), 0 18px 52px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,239,180,0.10)',
          animation: 'borderPulse 4s ease-in-out infinite',
        }}>
          <VehicleSelect />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '16px 32px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <span style={{
          fontFamily: 'var(--f-body)',
          fontSize: 12,
          fontWeight: 500,
          color: '#FFFFFF',
          opacity: 0.55,
          letterSpacing: '0.05em',
        }}>
          LLCAR — чтобы не гадать, а знать
        </span>
      </footer>
    </div>
  )
}
