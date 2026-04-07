import { useState, useEffect } from 'react'
import { theme } from '../../theme'
import robotDefault from '../../assets/robot-default.png'
import robotThumbsup from '../../assets/robot-thumbsup.png'
import robotShield from '../../assets/robot-shield.png'
import robotCelebrate from '../../assets/robot-celebrate.png'

interface OnboardingStep {
  title: string
  text: string
  robot: string
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left'
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Привет! Я LLCAR',
    text: 'Твой персональный автомеханик. Давай покажу что умею!',
    robot: robotDefault,
    position: 'center',
  },
  {
    title: 'Здоровье авто',
    text: 'Здесь общая оценка здоровья машины по 4 системам: подвеска, двигатель, электрика, аудио. 100 = идеально.',
    robot: robotThumbsup,
    position: 'top-left',
  },
  {
    title: 'Диагнозы',
    text: 'Если найду проблему — покажу что делать. Маршрут ремонта от бесплатного к дорогому. Можешь подтвердить или отклонить.',
    robot: robotDefault,
    position: 'top-left',
  },
  {
    title: 'Безопасность',
    text: 'Красный = не ехать, вызывай эвакуатор. Жёлтый = осторожно, запишись в сервис. Зелёный = всё в порядке.',
    robot: robotShield,
    position: 'center',
  },
  {
    title: 'Готово!',
    text: 'Подключи OBD адаптер по Bluetooth и поехали. Чем больше поездок — тем точнее диагностика.',
    robot: robotCelebrate,
    position: 'center',
  },
]

const STORAGE_KEY = 'llcar-onboarding-v3-done'

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setVisible(false)
    } else {
      setStep(step + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        background: 'rgba(12,18,32,0.95)',
        border: `1px solid ${theme.accent.cyan}30`,
        borderRadius: 12,
        padding: '32px 28px 24px',
        maxWidth: 400,
        width: '90%',
        textAlign: 'center',
        boxShadow: `0 0 40px ${theme.accent.cyan}15, 0 20px 60px rgba(0,0,0,0.5)`,
        position: 'relative',
      }}>
        <img
          src={current.robot}
          alt="LLCAR Robot"
          style={{
            width: 100, height: 100,
            objectFit: 'contain',
            marginBottom: 16,
            filter: 'drop-shadow(0 4px 12px rgba(0,229,255,0.3))',
            animation: step === STEPS.length - 1 ? 'bounce 0.6s ease' : undefined,
          }}
        />

        <div style={{
          fontSize: 18, fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
          color: theme.accent.cyan,
          letterSpacing: '0.1em',
          marginBottom: 8,
          textShadow: `0 0 10px ${theme.accent.cyan}40`,
        }}>
          {current.title}
        </div>

        <div style={{
          fontSize: 14, fontFamily: "'Rajdhani', sans-serif",
          color: theme.text.secondary,
          lineHeight: 1.5,
          marginBottom: 24,
        }}>
          {current.text}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? theme.accent.cyan : `${theme.accent.cyan}25`,
              boxShadow: i === step ? `0 0 6px ${theme.accent.cyan}` : 'none',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {!isFirst && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: '8px 20px', fontSize: 12,
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                color: theme.text.muted, background: 'transparent',
                border: `1px solid ${theme.text.muted}30`,
                borderRadius: 4, cursor: 'pointer',
              }}
            >
              Назад
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              padding: '8px 24px', fontSize: 12,
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              color: '#0C1220',
              background: `linear-gradient(135deg, ${theme.accent.cyan}, ${theme.accent.teal})`,
              border: 'none', borderRadius: 4, cursor: 'pointer',
              boxShadow: `0 0 12px ${theme.accent.cyan}40`,
              letterSpacing: '0.05em',
            }}
          >
            {isLast ? 'Поехали!' : 'Далее'}
          </button>
        </div>

        {!isLast && (
          <button
            onClick={handleSkip}
            style={{
              marginTop: 12, fontSize: 10,
              fontFamily: "'Orbitron', sans-serif",
              color: theme.text.muted, background: 'none',
              border: 'none', cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            ПРОПУСТИТЬ
          </button>
        )}
      </div>
    </div>
  )
}
