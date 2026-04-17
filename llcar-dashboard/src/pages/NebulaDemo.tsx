import { useMemo } from 'react'

const PALETTE = {
  bgDeep:    '#05070f',
  bgIndigo:  '#0a0e2e',
  bgViolet:  '#1a1040',
  cyan:      '#6a9eff',
  lavender:  '#a878ff',
  magenta:   '#d060c0',
  starWhite: '#e8ecf5',
}

function Stars({ count = 90 }: { count?: number }) {
  const stars = useMemo(() => Array.from({ length: count }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: Math.random() * 1.4 + 0.3,
    o: Math.random() * 0.7 + 0.2,
    delay: Math.random() * 8,
  })), [count])
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} preserveAspectRatio="none" viewBox="0 0 100 100">
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r * 0.15}
          fill={PALETTE.starWhite}
          opacity={s.o}
          style={{ animation: `starTwinkle 4s ease-in-out ${s.delay}s infinite` }}
        />
      ))}
    </svg>
  )
}

function AuroraRibbon({ d, color, duration, delay = 0 }: { d: string; color: string; duration: number; delay?: number }) {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} preserveAspectRatio="none" viewBox="0 0 1600 900">
      <defs>
        <filter id={`glow-${color.slice(1)}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <linearGradient id={`grad-${color.slice(1)}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={color} stopOpacity="0" />
          <stop offset="50%"  stopColor={color} stopOpacity="0.75" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={d}
        stroke={`url(#grad-${color.slice(1)})`}
        strokeWidth="64"
        strokeLinecap="round"
        fill="none"
        filter={`url(#glow-${color.slice(1)})`}
        style={{ animation: `ribbonDrift ${duration}s ease-in-out ${delay}s infinite alternate` }}
      />
    </svg>
  )
}

export function NebulaDemo() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `radial-gradient(ellipse at 50% 30%, ${PALETTE.bgViolet} 0%, ${PALETTE.bgIndigo} 35%, ${PALETTE.bgDeep} 100%)`,
      overflow: 'hidden',
      fontFamily: 'var(--f-body), system-ui, sans-serif',
      color: PALETTE.starWhite,
    }}>
      {/* Глобальные стили — только для этой демо-страницы */}
      <style>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: var(--o, 0.4); }
          50% { opacity: 0.15; }
        }
        @keyframes ribbonDrift {
          from { transform: translate(-4%, 2%) rotate(-1deg); }
          to   { transform: translate(4%, -2%) rotate(1deg); }
        }
        @keyframes nebulaBreathe {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50%      { transform: scale(1.08); opacity: 0.75; }
        }
      `}</style>

      {/* Слой 1 — blur-эллипсы (газовые облака) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen' }}>
        <div style={{
          position: 'absolute', top: '10%', left: '8%',
          width: 640, height: 640, borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.cyan} 0%, transparent 62%)`,
          filter: 'blur(90px)', opacity: 0.55,
          animation: 'nebulaBreathe 16s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '35%', right: '6%',
          width: 720, height: 720, borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.lavender} 0%, transparent 60%)`,
          filter: 'blur(100px)', opacity: 0.60,
          animation: 'nebulaBreathe 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '3%', left: '55%',
          width: 380, height: 380, borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.magenta} 0%, transparent 58%)`,
          filter: 'blur(95px)', opacity: 0.18,
          animation: 'nebulaBreathe 20s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '60%', left: '10%',
          width: 420, height: 420, borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.cyan} 0%, transparent 60%)`,
          filter: 'blur(70px)', opacity: 0.35,
          animation: 'nebulaBreathe 26s ease-in-out infinite',
        }} />
      </div>

      {/* Слой 2 — световые ленты / aurora */}
      <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.9 }}>
        <AuroraRibbon d="M -100 420 Q 400 200 800 480 T 1700 420" color={PALETTE.lavender} duration={18} />
        <AuroraRibbon d="M -100 560 Q 500 380 1000 620 T 1700 540" color={PALETTE.cyan} duration={24} delay={3} />
        <AuroraRibbon d="M -100 300 Q 600 520 1100 320 T 1700 360" color={PALETTE.lavender} duration={28} delay={6} />
      </div>

      {/* Слой 3 — звёздное поле */}
      <Stars count={110} />

      {/* Слой 4 — образцы типографики и UI */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1200, margin: '0 auto',
        padding: '64px 48px',
        display: 'flex', flexDirection: 'column', gap: 48,
      }}>
        {/* Заголовок-пробник */}
        <div>
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: 10, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: PALETTE.lavender,
            textShadow: `0 0 12px ${PALETTE.lavender}80`,
            marginBottom: 18,
          }}>
            NEBULA / AURORA · PALETTE PROBE
          </div>
          <div style={{
            fontFamily: 'var(--f-display)', fontSize: 72, fontWeight: 300,
            letterSpacing: '0.02em', lineHeight: 1,
            background: `linear-gradient(90deg, ${PALETTE.starWhite} 0%, ${PALETTE.lavender} 50%, ${PALETTE.cyan} 100%)`,
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent',
            textShadow: `0 0 40px ${PALETTE.lavender}30`,
          }}>
            Риск перегрева
          </div>
          <div style={{
            fontFamily: 'var(--f-mono)', fontSize: 14, letterSpacing: '0.12em',
            color: `${PALETTE.starWhite}a0`, marginTop: 14,
          }}>
            Coolant 104 °C · Speed 8 km/h · Confidence 0.72
          </div>
        </div>

        {/* Ряд цветовых образцов */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
          {[
            { name: 'bgDeep',    hex: PALETTE.bgDeep,    role: 'фон (deep)' },
            { name: 'bgIndigo',  hex: PALETTE.bgIndigo,  role: 'фон (индиго)' },
            { name: 'cyan',      hex: PALETTE.cyan,      role: 'инфо / ok' },
            { name: 'lavender',  hex: PALETTE.lavender,  role: 'primary / active' },
            { name: 'magenta',   hex: PALETTE.magenta,   role: 'warn / crit' },
          ].map(c => (
            <div key={c.name} style={{
              padding: '16px 14px',
              borderRadius: 6,
              border: `1px solid ${PALETTE.lavender}30`,
              background: `${PALETTE.bgIndigo}80`,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: '100%', height: 54, borderRadius: 4, marginBottom: 12,
                background: c.hex,
                boxShadow: `0 0 30px ${c.hex}80, inset 0 0 20px ${c.hex}40`,
              }} />
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: PALETTE.starWhite, letterSpacing: '0.08em' }}>
                {c.hex.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: `${PALETTE.starWhite}70`, marginTop: 4, textTransform: 'uppercase' }}>
                {c.role}
              </div>
            </div>
          ))}
        </div>

        {/* Демо-панель: как будет выглядеть карточка диагноза */}
        <div style={{
          padding: '22px 26px',
          borderRadius: 8,
          border: `1px solid ${PALETTE.lavender}40`,
          background: `linear-gradient(135deg, ${PALETTE.bgIndigo}cc 0%, ${PALETTE.bgViolet}80 100%)`,
          backdropFilter: 'blur(12px)',
          boxShadow: `0 8px 32px ${PALETTE.bgDeep}, 0 0 40px ${PALETTE.lavender}20 inset`,
        }}>
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: 9, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: PALETTE.magenta,
            textShadow: `0 0 8px ${PALETTE.magenta}80`,
            marginBottom: 8,
          }}>
            АКТИВНАЯ ДИАГНОСТИКА · CRIT
          </div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginBottom: 6 }}>
            Риск перегрева (лето, пробки)
          </div>
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: `${PALETTE.starWhite}b0`, lineHeight: 1.5 }}>
            Температура охлаждающей жидкости выше 100 °C при низкой скорости и высокой нагрузке.
            Риск закипания → потери давления → прогара прокладки ГБЦ.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {['подтверждаю', 'не уверен', 'не согласен'].map((l, i) => (
              <button key={l} style={{
                fontFamily: 'var(--f-body)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '8px 14px', borderRadius: 4,
                border: `1px solid ${PALETTE.lavender}50`,
                background: i === 0 ? `${PALETTE.lavender}25` : 'transparent',
                color: i === 0 ? PALETTE.starWhite : `${PALETTE.starWhite}90`,
                cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em',
          color: `${PALETTE.starWhite}60`, textTransform: 'uppercase',
        }}>
          Demo: /nebula-demo · страница изолирована, основной дашборд не затронут
        </div>
      </div>
    </div>
  )
}

export default NebulaDemo
