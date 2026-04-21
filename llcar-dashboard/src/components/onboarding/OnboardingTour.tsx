import { useState, useEffect } from 'react'
import robotDefault from '../../assets/robot-default.jpg'
import robotThumbsup from '../../assets/robot-thumbsup.jpg'
import robotShield from '../../assets/robot-shield.jpg'
import robotCelebrate from '../../assets/robot-celebrate.jpg'

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
    const showIfNotDone = () => {
      const done = localStorage.getItem(STORAGE_KEY)
      if (!done) {
        setStep(0)
        setVisible(true)
      }
    }
    showIfNotDone()
    // Allow "Пройти тур заново" button (MainLayout) to re-open the tour
    // without a full page reload.
    window.addEventListener('llcar-restart-tour', showIfNotDone)
    return () => window.removeEventListener('llcar-restart-tour', showIfNotDone)
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
        background: 'rgba(10,10,14,0.95)',
        border: '1px solid rgba(230,212,168,0.3)',
        borderRadius: 12,
        padding: '32px 28px 24px',
        maxWidth: 400,
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 0 40px rgba(230,212,168,0.15), 0 20px 60px rgba(0,0,0,0.6)',
        position: 'relative',
      }}>
        <img
          src={current.robot}
          alt="LLCAR Robot"
          style={{
            width: 100, height: 100,
            objectFit: 'contain',
            marginBottom: 16,
            filter: 'drop-shadow(0 4px 12px rgba(230,212,168,0.4))',
            animation: step === STEPS.length - 1 ? 'bounce 0.6s ease' : undefined,
          }}
        />

        <div style={{
          fontSize: 18, fontFamily: 'var(--f-display)', fontWeight: 700,
          color: 'var(--c-champagne)',
          letterSpacing: '0.1em',
          marginBottom: 8,
          textShadow: '0 0 14px rgba(230,212,168,0.4)',
        }}>
          {current.title}
        </div>

        <div style={{
          fontSize: 14, fontFamily: 'var(--f-body)',
          color: '#FFFFFF',
          opacity: 0.85,
          lineHeight: 1.5,
          marginBottom: 24,
        }}>
          {current.text}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? 'var(--c-champagne)' : 'rgba(230,212,168,0.25)',
              boxShadow: i === step ? '0 0 8px rgba(230,212,168,0.8)' : 'none',
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
                fontFamily: 'var(--f-body)', fontWeight: 600,
                color: '#FFFFFF', opacity: 0.7, background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
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
              fontFamily: 'var(--f-display)', fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#050505',
              background: 'linear-gradient(135deg, #F2E4C2 0%, #E6D4A8 50%, #C89446 100%)',
              border: 'none', borderRadius: 4, cursor: 'pointer',
              boxShadow: '0 0 16px rgba(230,212,168,0.5), 0 4px 14px rgba(200,148,70,0.25)',
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
              fontFamily: 'var(--f-display)',
              color: '#FFFFFF', opacity: 0.55,
              background: 'none',
              border: 'none', cursor: 'pointer',
              letterSpacing: '0.16em',
            }}
          >
            ПРОПУСТИТЬ
          </button>
        )}
      </div>
    </div>
  )
}
