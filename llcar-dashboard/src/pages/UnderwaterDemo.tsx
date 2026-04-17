import { useMemo } from 'react'

const PALETTE = {
  deepBlue:   '#021528',
  cobalt:     '#0a4a6e',
  azure:      '#1a5a8a',
  surface:    '#6ab5ff',
  cyan:       '#6a9eff',
  white:      '#eef4fb',
  warmCoral:  '#e8a878',
  warnAmber:  '#f2c480',
}

function Bubbles({ count = 28 }: { count?: number }) {
  const bubbles = useMemo(() => Array.from({ length: count }).map(() => ({
    x: Math.random() * 100,
    size: Math.random() * 5 + 2,
    delay: Math.random() * 12,
    duration: Math.random() * 10 + 14,
    opacity: Math.random() * 0.4 + 0.2,
  })), [count])
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${b.x}%`,
          bottom: -20,
          width: b.size,
          height: b.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.white}, transparent 70%)`,
          opacity: b.opacity,
          boxShadow: `0 0 ${b.size * 2}px ${PALETTE.surface}80`,
          animation: `bubbleRise ${b.duration}s linear ${b.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

export function UnderwaterDemo() {
  const BG_URL = `${import.meta.env.BASE_URL}luma-refs/nebula-underwater-v1-a.jpg`
  return (
    <div style={{
      position: 'fixed', inset: 0,
      overflow: 'hidden',
      fontFamily: 'var(--f-body), system-ui, sans-serif',
      color: PALETTE.white,
      backgroundColor: PALETTE.deepBlue,
    }}>
      <style>{`
        @keyframes bubbleRise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: var(--o, 0.4); }
          100% { transform: translateY(-110vh) translateX(40px); opacity: 0; }
        }
        @keyframes causticShift {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50%      { opacity: 0.55; transform: translateY(-8px); }
        }
      `}</style>

      {/* Слой 1 — фото-фон (океанский собор + god rays) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'saturate(1.1) brightness(0.92)',
      }} />

      {/* Слой 2 — vignette gradient для читаемости UI */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(2,21,40,0.35) 70%, rgba(2,21,40,0.8) 100%),
          linear-gradient(180deg, rgba(2,21,40,0.1) 0%, rgba(2,21,40,0.0) 35%, rgba(2,21,40,0.4) 85%, rgba(2,21,40,0.75) 100%)
        `,
      }} />

      {/* Слой 3 — лёгкие caustics (движение света) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${PALETTE.surface}25 0%, transparent 55%)`,
        mixBlendMode: 'screen',
        animation: 'causticShift 9s ease-in-out infinite',
      }} />

      {/* Слой 4 — пузырьки */}
      <Bubbles count={32} />

      {/* Слой 5 — контент */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1200, margin: '0 auto',
        padding: '64px 48px',
        display: 'flex', flexDirection: 'column', gap: 40,
        maxHeight: '100vh', overflowY: 'auto',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: 10, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: PALETTE.surface,
            textShadow: `0 0 14px ${PALETTE.surface}80`,
            marginBottom: 18,
          }}>
            UNDERWATER · COBALT PROBE
          </div>
          <div style={{
            fontFamily: 'var(--f-display)', fontSize: 72, fontWeight: 300,
            letterSpacing: '0.02em', lineHeight: 1,
            background: `linear-gradient(180deg, ${PALETTE.white} 0%, ${PALETTE.surface} 100%)`,
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent',
            textShadow: `0 2px 24px ${PALETTE.deepBlue}`,
          }}>
            Риск перегрева
          </div>
          <div style={{
            fontFamily: 'var(--f-mono)', fontSize: 14, letterSpacing: '0.12em',
            color: `${PALETTE.white}c0`, marginTop: 14,
          }}>
            Coolant 104 °C · Speed 8 km/h · Confidence 0.72
          </div>
        </div>

        {/* Цветовой ряд */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {[
            { hex: PALETTE.deepBlue,  role: 'фон (deep)' },
            { hex: PALETTE.cobalt,    role: 'кобальт' },
            { hex: PALETTE.surface,   role: 'поверхность / info' },
            { hex: PALETTE.white,     role: 'текст' },
            { hex: PALETTE.warmCoral, role: 'warn / contrast' },
          ].map(c => (
            <div key={c.hex} style={{
              padding: '14px 12px',
              borderRadius: 6,
              border: `1px solid rgba(255,255,255,0.14)`,
              background: 'rgba(2,21,40,0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}>
              <div style={{
                width: '100%', height: 42, borderRadius: 3, marginBottom: 10,
                background: c.hex,
                boxShadow: `0 4px 18px ${c.hex}70, inset 0 0 14px ${c.hex}40`,
              }} />
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: PALETTE.white, letterSpacing: '0.08em' }}>
                {c.hex.toUpperCase()}
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', color: `${PALETTE.white}80`, marginTop: 4, textTransform: 'uppercase' }}>
                {c.role}
              </div>
            </div>
          ))}
        </div>

        {/* Стеклянная панель диагноза */}
        <div style={{
          padding: '22px 26px',
          borderRadius: 10,
          border: `1px solid rgba(255,255,255,0.18)`,
          background: 'rgba(10,40,70,0.35)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          boxShadow: `0 12px 48px rgba(2,21,40,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}>
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: 9, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: PALETTE.warmCoral,
            textShadow: `0 0 10px ${PALETTE.warmCoral}80`,
            marginBottom: 8,
          }}>
            АКТИВНАЯ ДИАГНОСТИКА · CRIT
          </div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginBottom: 6, color: PALETTE.white }}>
            Риск перегрева (лето, пробки)
          </div>
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: `${PALETTE.white}c0`, lineHeight: 1.5 }}>
            Температура охлаждающей жидкости выше 100 °C при низкой скорости и высокой нагрузке.
            Риск закипания → потери давления → прогара прокладки ГБЦ.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {['подтверждаю', 'не уверен', 'не согласен'].map((l, i) => (
              <button key={l} style={{
                fontFamily: 'var(--f-body)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '8px 14px', borderRadius: 4,
                border: `1px solid ${i === 0 ? PALETTE.surface : 'rgba(255,255,255,0.25)'}`,
                background: i === 0 ? `${PALETTE.surface}25` : 'transparent',
                color: i === 0 ? PALETTE.white : `${PALETTE.white}a0`,
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em',
          color: `${PALETTE.white}70`, textTransform: 'uppercase',
        }}>
          Demo: /underwater-demo · фон: nebula-underwater-v1-a
        </div>
      </div>
    </div>
  )
}

export default UnderwaterDemo
