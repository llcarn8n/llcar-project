import { useState, useCallback } from 'react'
import robotDefault from '../../assets/robot-default.jpg'
import obdGuideImg from '../../assets/obd-guide.jpg'

// ── Types ──

interface ConnectionWizardProps {
  /** When true, shows as a modal overlay (for re-opening from sidebar) */
  asModal?: boolean
  /** Called when wizard is completed or skipped */
  onComplete?: () => void
}

const CONNECTION_STORAGE_KEY = 'llcar-connection-done'

// ── Steps Data ──

interface WizardStep {
  icon: string
  title: string
  description: string
  details?: string[]
  warning?: string
  image?: string
}

const STEPS: WizardStep[] = [
  {
    icon: '\u{1F50D}', // magnifying glass
    title: 'Найдите разъём OBD-II',
    description: 'Стандартный 16-пиновый трапецевидный разъём расположен в салоне автомобиля.',
    details: [
      'Под рулевой колонкой слева',
      'Под рулевой колонкой справа',
      'В бардачке',
      'Рядом с переключателем АКПП',
      'В подлокотнике',
      'Под панелью со стороны пассажира',
    ],
    image: obdGuideImg,
  },
  {
    icon: '\u{1F6D1}', // stop sign
    title: 'Заглушите двигатель',
    description: 'Перед подключением сканера выключите двигатель автомобиля.',
    warning: 'Не подключайте адаптер при работающем двигателе.',
  },
  {
    icon: '\u{1F50C}', // plug
    title: 'Подключите сканер',
    description: 'Вставьте компактный BT-адаптер в разъём OBD-II до характерного щелчка.',
    warning: 'Вставляйте плотно, не раскачивайте адаптер.',
    image: obdGuideImg,
  },
  {
    icon: '\u{1F511}', // key
    title: 'Включите зажигание',
    description: 'В некоторых автомобилях OBD-II работает без включения зажигания.',
    details: [
      'Если сканер не определяется — поверните ключ в положение ON',
      'Не заводите двигатель',
    ],
  },
  {
    icon: '\u{1F4F2}', // mobile phone with arrow
    title: 'Откройте приложение LLCAR',
    description: 'Запустите приложение LLCAR на смартфоне — оно автоматически найдёт адаптер через Bluetooth.',
    details: [
      'Если адаптер не найден — проверьте что Bluetooth включён',
      'Стандартный пароль адаптера: 1234 или 0000',
      'Название устройства: OBD-II, ELM327 или OBDII',
    ],
  },
]

// ── Helpers ──

export function isConnectionDone(): boolean {
  try {
    return localStorage.getItem(CONNECTION_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function saveConnectionDone() {
  localStorage.setItem(CONNECTION_STORAGE_KEY, 'true')
}

// ── Inline styles ──

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9998,
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'fadeIn 0.4s ease',
}

const cardStyle: React.CSSProperties = {
  display: 'flex',
  maxWidth: 660,
  width: '92%',
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative',
}

const robotPanelStyle: React.CSSProperties = {
  width: 180,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 16px',
  background: 'linear-gradient(180deg, rgba(0,229,255,0.06) 0%, rgba(0,229,255,0.02) 100%)',
  borderRight: '1px solid rgba(0,229,255,0.1)',
  flexShrink: 0,
}

const formPanelStyle: React.CSSProperties = {
  flex: 1,
  padding: '32px 28px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  overflowY: 'auto',
  maxHeight: '80vh',
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 28px',
  fontSize: 13,
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700,
  color: '#0C1220',
  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-teal))',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  transition: 'all 0.3s',
  boxShadow: '0 0 16px rgba(0,229,255,0.3)',
}

const btnSecondaryStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: 12,
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
  color: 'var(--text-muted)',
  background: 'transparent',
  border: '1px solid var(--border-glow)',
  borderRadius: 4,
  cursor: 'pointer',
  letterSpacing: '0.05em',
  transition: 'all 0.3s',
}

// ── Progress Indicator ──

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <span style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 10,
        letterSpacing: '0.15em',
        color: 'var(--accent-cyan)',
        textShadow: '0 0 8px rgba(0,229,255,0.4)',
        whiteSpace: 'nowrap',
      }}>
        {current}/{total}
      </span>
      <div style={{
        flex: 1,
        height: 3,
        background: 'var(--health-track-bg)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${(current / total) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-teal))',
          borderRadius: 2,
          transition: 'width 0.4s ease',
          boxShadow: '0 0 8px rgba(0,229,255,0.5)',
        }} />
      </div>
    </div>
  )
}

// ── OBD Connector SVG Icon ──

// ── Step Content ──

function StepContent({ step, stepIndex, totalSteps }: {
  step: WizardStep
  stepIndex: number
  totalSteps: number
}) {
  return (
    <div
      key={`step-${stepIndex}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'wizardStepIn 0.35s ease both',
      }}
    >
      <ProgressBar current={stepIndex + 1} total={totalSteps} />

      {/* Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          background: 'rgba(0,229,255,0.06)',
          border: '1px solid rgba(0,229,255,0.15)',
          flexShrink: 0,
        }}>
          {step.icon}
        </div>
        <div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.1em',
            textShadow: '0 0 10px rgba(0,229,255,0.4)',
            lineHeight: 1.3,
          }}>
            {step.title}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 14,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        letterSpacing: '0.02em',
        lineHeight: 1.6,
      }}>
        {step.description}
      </div>

      {/* Show OBD guide image on step 1 */}
      {step.image && (
        <img
          src={step.image}
          alt="OBD-II Connection Guide"
          style={{
            width: '100%',
            maxHeight: 320,
            objectFit: 'contain',
            borderRadius: 6,
            border: '1px solid var(--border-glow)',
          }}
        />
      )}

      {/* Details list */}
      {step.details && step.details.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '10px 14px',
          borderRadius: 4,
          background: 'rgba(0,229,255,0.03)',
          border: '1px solid rgba(0,229,255,0.08)',
        }}>
          {step.details.map((detail, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <span style={{
                color: 'var(--accent-cyan)',
                fontSize: 8,
                marginTop: 5,
                flexShrink: 0,
                opacity: 0.7,
              }}>
                {'\u25C6'}
              </span>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 13,
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
                lineHeight: 1.4,
              }}>
                {detail}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Warning */}
      {step.warning && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 4,
          background: 'rgba(255,179,0,0.05)',
          border: '1px solid rgba(255,179,0,0.15)',
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
            {'\u26A0'}
          </span>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--status-warning, #FFB300)',
            letterSpacing: '0.02em',
            lineHeight: 1.4,
          }}>
            {step.warning}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main Component ──

export function ConnectionWizard({ asModal = false, onComplete }: ConnectionWizardProps) {
  const [step, setStep] = useState(0)
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward')

  const isLastStep = step === STEPS.length - 1

  const handleNext = useCallback(() => {
    setAnimDir('forward')
    if (isLastStep) {
      saveConnectionDone()
      onComplete?.()
    } else {
      setStep(s => s + 1)
    }
  }, [isLastStep, onComplete])

  const handleBack = useCallback(() => {
    if (step > 0) {
      setAnimDir('back')
      setStep(s => s - 1)
    }
  }, [step])

  const handleSkip = useCallback(() => {
    saveConnectionDone()
    onComplete?.()
  }, [onComplete])

  const slideTransform = animDir === 'forward' ? 'translateX(20px)' : 'translateX(-20px)'

  const innerContent = (
    <div className="glass-panel" style={cardStyle}>
      {/* Inline animation keyframes */}
      <style>{`
        @keyframes wizardStepIn {
          from { opacity: 0; transform: ${slideTransform}; }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Left: Robot panel */}
      <div style={robotPanelStyle} className="connection-wizard-robot">
        <img
          src={robotDefault}
          alt="LLCAR"
          style={{
            width: 100,
            height: 100,
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 16px rgba(0,229,255,0.35))',
            marginBottom: 16,
            animation: isLastStep ? 'bounce 0.6s ease' : undefined,
          }}
        />
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-teal))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
        }}>
          LLCAR
        </div>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 10,
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: 4,
          letterSpacing: '0.05em',
          lineHeight: 1.4,
        }}>
          {'Подключение'}
          <br />
          {'OBD-II'}
        </div>
      </div>

      {/* Right: Step content */}
      <div style={formPanelStyle}>
        <StepContent
          step={STEPS[step]}
          stepIndex={step}
          totalSteps={STEPS.length}
        />

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleSkip}
            style={{
              ...btnSecondaryStyle,
              opacity: 0.6,
              fontSize: 11,
              padding: '8px 14px',
            }}
          >
            {'Пропустить'}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button onClick={handleBack} style={btnSecondaryStyle}>
                {'Назад'}
              </button>
            )}
            <button onClick={handleNext} style={btnPrimaryStyle}>
              {isLastStep ? 'Готово' : 'Далее'}
            </button>
          </div>
        </div>
      </div>

      {/* Close button for modal mode */}
      {asModal && (
        <button
          onClick={onComplete}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--border-glow)',
            borderRadius: 4,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: "'Rajdhani', sans-serif",
            transition: 'all 0.3s',
          }}
          aria-label="Close"
        >
          {'\u2715'}
        </button>
      )}
    </div>
  )

  return (
    <>
      <style>{`
        @media (max-width: 520px) {
          .connection-wizard-robot { display: none !important; }
        }
      `}</style>
      <div style={overlayStyle}>
        {innerContent}
      </div>
    </>
  )
}
