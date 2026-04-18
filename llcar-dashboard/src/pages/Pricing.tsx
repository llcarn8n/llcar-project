import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '../components/shared/GlassPanel'
import { useDashboardStore } from '../stores/dashboardStore'
import { trackEvent } from '../utils/analytics'
import { theme } from '../theme'

const faqItems = [
  {
    q: 'Зачем платить, если есть YouTube и Drive2?',
    a: 'YouTube и Drive2 дают общие советы. LLCAR анализирует именно вашу машину: ваши коды ошибок, ваши параметры, вашу историю. Это как разница между медицинской энциклопедией и визитом к врачу.',
  },
  {
    q: 'У меня есть CarScanner. Зачем LLCAR?',
    a: 'CarScanner показывает сырые данные: коды, числа, графики. LLCAR ставит диагноз: что сломалось, почему, что делать и сколько стоит ремонт. CarScanner = данные, LLCAR = диагноз.',
  },
  {
    q: 'Безопасно для машины?',
    a: 'Абсолютно. LLCAR только читает данные через стандартный порт OBD-II. Не отправляет команд, не меняет настройки. Как градусник — только измеряет.',
  },
  {
    q: 'Почему первый отчёт бесплатный?',
    a: 'Мы уверены в качестве диагностики. Попробуйте бесплатно, убедитесь что это полезно, и решите сами — нужна ли подписка.',
  },
  {
    q: 'Могу отменить подписку?',
    a: 'Да, в любой момент. Без вопросов и скрытых условий. Отмена вступает в силу в конце оплаченного периода.',
  },
  {
    q: '349 руб. — не дорого?',
    a: 'Диагностика на СТО стоит 3 000-5 000 руб. LLCAR — в 10 раз дешевле. А ежемесячная подписка (499 руб.) даёт безлимитный доступ ко всем отчётам.',
  },
]

const tiers = [
  {
    id: 'free' as const,
    icon: '\u{1F7E2}',
    name: 'FREE',
    subtitle: 'Базовый доступ',
    price: '0 руб.',
    period: '',
    features: ['Health Score автомобиля', 'Статус основных систем', 'DTC коды без расшифровки', '1 скан в день'],
    cta: 'НАЧАТЬ БЕСПЛАТНО',
    borderColor: 'rgba(100,255,218,0.2)',
    accentColor: theme.accent.teal,
    badge: null,
    popular: false,
  },
  {
    id: 'single' as const,
    icon: '\u{1F4A1}',
    name: 'SINGLE REPORT',
    subtitle: 'Разовый полный отчёт',
    price: '349 руб.',
    period: '',
    features: ['Полная расшифровка DTC', 'Маршрутная карта ремонта', 'Стоимость запчастей и работ', 'PDF-отчёт для СТО'],
    cta: 'ПОЛУЧИТЬ ОТЧЁТ',
    borderColor: 'rgba(255,140,0,0.3)',
    accentColor: theme.accent.orange,
    badge: 'ПЕРВЫЙ ОТЧЁТ БЕСПЛАТНО',
    popular: false,
  },
  {
    id: 'monthly' as const,
    icon: '\u26A1',
    name: 'MONTHLY',
    subtitle: 'Ежемесячная подписка',
    price: '499 руб.',
    period: '/мес',
    features: ['Безлимитные полные отчёты', 'История диагностики', 'Тренды и динамика', 'Приоритетная поддержка'],
    cta: 'ОФОРМИТЬ ПОДПИСКУ',
    borderColor: 'rgba(230,212,168,0.3)',
    accentColor: theme.accent.cyan,
    badge: null,
    popular: true,
  },
  {
    id: 'annual' as const,
    icon: '\u{1F3C6}',
    name: 'ANNUAL',
    subtitle: 'Годовая подписка',
    price: '2\u202F990 руб.',
    period: '/год',
    features: ['Всё из Monthly', '2 PDF-сертификата диагностики', 'Скидка 50% от месячной цены', 'Ранний доступ к новым фичам'],
    cta: 'НА ГОД',
    borderColor: 'rgba(138,43,226,0.3)',
    accentColor: '#8A2BE2',
    badge: null,
    popular: false,
  },
]

export function Pricing() {
  const navigate = useNavigate()
  const setUserTier = useDashboardStore(s => s.setUserTier)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [emailForm, setEmailForm] = useState<{ open: boolean; tier: string; email: string; submitted: boolean }>({
    open: false,
    tier: '',
    email: '',
    submitted: false,
  })

  useEffect(() => {
    trackEvent('pricing_page_view')
  }, [])

  const handleCta = (tierId: string) => {
    trackEvent('pricing_cta_click', { tier: tierId })
    if (tierId === 'free') {
      navigate('/')
      return
    }
    setEmailForm({ open: true, tier: tierId, email: '', submitted: false })
  }

  const handleEmailSubmit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) return
    trackEvent('pricing_email_submit', { tier: emailForm.tier, email: emailForm.email })
    setEmailForm(s => ({ ...s, submitted: true }))
  }

  return (
    <div className="grid grid-cols-12 gap-3" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero */}
      <div className="col-span-12">
        <GlassPanel style={{ textAlign: 'center', padding: '48px 24px 40px' }}>
          <h1
            className="hud-header"
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 'clamp(20px, 4vw, 32px)',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: theme.accent.cyan,
              textShadow: `0 0 24px rgba(230,212,168,0.5)`,
              margin: 0,
            }}
          >
            ТАРИФЫ И ПОДПИСКА
          </h1>
          <p
            style={{
              fontFamily: "var(--f-body)",
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              fontWeight: 500,
              color: theme.text.secondary,
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            Диагностика дешевле чашки кофе
          </p>
          <p
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 13,
              color: theme.accent.teal,
              letterSpacing: '0.1em',
            }}
          >
            Первый полный отчёт — бесплатно
          </p>
        </GlassPanel>
      </div>

      {/* Anchor: STO vs LLCAR */}
      <div className="col-span-12">
        <GlassPanel style={{ padding: '32px 24px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            {/* STO price */}
            <div style={{ textAlign: 'center', flex: '1 1 200px', minWidth: 180 }}>
              <div
                style={{
                  fontFamily: "var(--f-body)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  color: theme.text.muted,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                ДИАГНОСТИКА НА СТО
              </div>
              <div
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 700,
                  color: theme.accent.orange,
                  textShadow: '0 0 16px rgba(255,140,0,0.4)',
                }}
              >
                3 000–5 000 руб.
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontSize: 'clamp(10px, 1.5vw, 14px)',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: theme.accent.cyan,
                textShadow: `0 0 12px rgba(230,212,168,0.5)`,
                padding: '8px 16px',
                border: `1px solid rgba(230,212,168,0.2)`,
                borderRadius: 6,
                background: 'rgba(230,212,168,0.05)',
              }}
            >
              В 10 РАЗ ДЕШЕВЛЕ
            </div>

            {/* LLCAR price */}
            <div style={{ textAlign: 'center', flex: '1 1 200px', minWidth: 180 }}>
              <div
                style={{
                  fontFamily: "var(--f-body)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  color: theme.text.muted,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                LLCAR
              </div>
              <div
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 700,
                  color: theme.accent.cyan,
                  textShadow: `0 0 16px rgba(230,212,168,0.4)`,
                }}
              >
                349 руб.
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Tier cards */}
      <div className="col-span-12">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {tiers.map(tier => (
            <GlassPanel
              key={tier.id}
              style={{
                padding: '28px 20px 24px',
                borderColor: tier.borderColor,
                borderWidth: tier.popular ? 2 : 1,
                borderStyle: 'solid',
                position: 'relative',
                transform: tier.popular ? 'scale(1.03)' : undefined,
                boxShadow: tier.popular ? `0 0 32px rgba(230,212,168,0.15), 0 0 60px rgba(230,212,168,0.05)` : undefined,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: "var(--f-display)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: '#0C1220',
                    background: 'linear-gradient(135deg, #00E5FF, #00E5FF)',
                    padding: '4px 16px',
                    borderRadius: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  POPULAR
                </div>
              )}

              {/* Free report badge for single */}
              {tier.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: "var(--f-display)",
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: '#0C1220',
                    background: `linear-gradient(135deg, ${theme.accent.orange}, #FFB74D)`,
                    padding: '4px 12px',
                    borderRadius: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tier.badge}
                </div>
              )}

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{tier.icon}</div>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: tier.accentColor,
                    textShadow: `0 0 8px ${tier.borderColor}`,
                    marginBottom: 4,
                  }}
                >
                  {tier.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-body)",
                    fontSize: 12,
                    color: theme.text.muted,
                  }}
                >
                  {tier.subtitle}
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {tier.id === 'annual' && (
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 14,
                      color: theme.text.muted,
                      textDecoration: 'line-through',
                      marginBottom: 4,
                    }}
                  >
                    5 988 руб.
                  </div>
                )}
                <span
                  className="stat-value"
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 28,
                    fontWeight: 700,
                    color: tier.accentColor,
                    textShadow: `0 0 12px ${tier.borderColor}`,
                  }}
                >
                  {tier.price}
                </span>
                {tier.period && (
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 14,
                      color: theme.text.muted,
                      marginLeft: 2,
                    }}
                  >
                    {tier.period}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 24px',
                  flex: 1,
                }}
              >
                {tier.features.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: "var(--f-body)",
                      fontSize: 13,
                      color: theme.text.secondary,
                      padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: tier.accentColor, fontSize: 10 }}>{'\u25C6'}</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCta(tier.id)}
                style={{
                  width: '100%',
                  fontFamily: "var(--f-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  color: tier.popular ? '#0C1220' : tier.accentColor,
                  background: tier.popular
                    ? 'linear-gradient(135deg, #00E5FF, #00E5FF)'
                    : 'rgba(255,255,255,0.03)',
                  border: tier.popular ? 'none' : `1px solid ${tier.borderColor}`,
                  borderRadius: 6,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  boxShadow: tier.popular ? '0 0 16px rgba(230,212,168,0.3)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {tier.cta}
              </button>
            </GlassPanel>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="col-span-12">
        <GlassPanel style={{ padding: '32px 24px' }}>
          <h2
            className="hud-header"
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.15em',
              color: theme.accent.cyan,
              textShadow: `0 0 12px rgba(230,212,168,0.4)`,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            ЧАСТЫЕ ВОПРОСЫ
          </h2>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {faqItems.map((item, i) => {
              const isOpen = expandedFaq === i
              return (
                <div
                  key={i}
                  style={{
                    borderBottom: '1px solid rgba(230,212,168,0.08)',
                    marginBottom: 4,
                  }}
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : i)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '14px 4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--f-body)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.text.primary,
                        flex: 1,
                      }}
                    >
                      {item.q}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: 16,
                        color: theme.accent.cyan,
                        transform: isOpen ? 'rotate(45deg)' : 'none',
                        transition: 'transform 0.3s',
                        flexShrink: 0,
                      }}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        fontFamily: "var(--f-body)",
                        fontSize: 13,
                        color: theme.text.secondary,
                        lineHeight: 1.6,
                        padding: '0 4px 16px',
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlassPanel>
      </div>

      {/* Bottom CTA */}
      <div className="col-span-12">
        <GlassPanel style={{ textAlign: 'center', padding: '40px 24px' }}>
          <h2
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 'clamp(16px, 3vw, 24px)',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: theme.accent.cyan,
              textShadow: `0 0 20px rgba(230,212,168,0.5)`,
              margin: '0 0 20px',
            }}
          >
            ГОТОВЫ ПРОВЕРИТЬ?
          </h2>
          <button
            onClick={() => navigate('/')}
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#0C1220',
              background: 'linear-gradient(135deg, #00E5FF, #00E5FF)',
              border: 'none',
              borderRadius: 8,
              padding: '14px 40px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(230,212,168,0.3)',
              transition: 'all 0.3s',
            }}
          >
            НАЧАТЬ ДИАГНОСТИКУ
          </button>
        </GlassPanel>
      </div>

      {/* Dev-only: test subscription activation */}
      {import.meta.env.DEV && (
        <div className="col-span-12" style={{ textAlign: 'center', padding: '8px 0' }}>
          <button
            onClick={() => setUserTier('monthly')}
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              color: theme.text.muted,
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 4,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            DEV: Тест — активировать подписку (monthly)
          </button>
        </div>
      )}

      {/* Email collection modal */}
      {emailForm.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: 'rgba(0,0,0,0.8)',
          }}
          onClick={() => setEmailForm(s => ({ ...s, open: false }))}
        >
          <div onClick={e => e.stopPropagation()}>
          <GlassPanel
            style={{
              maxWidth: 420,
              width: '90vw',
              padding: '32px 28px',
              textAlign: 'center',
              borderColor: 'rgba(230,212,168,0.2)',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            {emailForm.submitted ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{'\u2705'}</div>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: theme.accent.teal,
                    marginBottom: 8,
                  }}
                >
                  СПАСИБО!
                </div>
                <p
                  style={{
                    fontFamily: "var(--f-body)",
                    fontSize: 14,
                    color: theme.text.secondary,
                    marginBottom: 20,
                  }}
                >
                  Мы сообщим, когда оплата станет доступна.
                </p>
                <button
                  onClick={() => setEmailForm(s => ({ ...s, open: false }))}
                  style={{
                    fontFamily: "var(--f-body)",
                    fontSize: 13,
                    color: theme.text.secondary,
                    background: 'none',
                    border: `1px solid rgba(230,212,168,0.2)`,
                    borderRadius: 6,
                    padding: '8px 24px',
                    cursor: 'pointer',
                  }}
                >
                  Закрыть
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: theme.accent.cyan,
                    textShadow: `0 0 12px rgba(230,212,168,0.4)`,
                    marginBottom: 12,
                  }}
                >
                  СКОРО ЗАПУСК
                </div>
                <p
                  style={{
                    fontFamily: "var(--f-body)",
                    fontSize: 14,
                    color: theme.text.secondary,
                    marginBottom: 20,
                    lineHeight: 1.5,
                  }}
                >
                  Оплата скоро будет доступна. Оставьте email — сообщим первым.
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={emailForm.email}
                    onChange={e => setEmailForm(s => ({ ...s, email: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                    style={{
                      flex: 1,
                      fontFamily: "var(--f-mono)",
                      fontSize: 13,
                      color: theme.text.primary,
                      background: 'rgba(230,212,168,0.04)',
                      border: '1px solid rgba(230,212,168,0.15)',
                      borderRadius: 6,
                      padding: '10px 14px',
                      outline: 'none',
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEmailSubmit() }}
                    style={{
                      fontFamily: "var(--f-display)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: '#0C1220',
                      background: 'linear-gradient(135deg, #00E5FF, #00E5FF)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 20px',
                      cursor: 'pointer',
                      boxShadow: '0 0 16px rgba(230,212,168,0.3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ГОТОВО
                  </button>
                </div>
                <button
                  onClick={() => setEmailForm(s => ({ ...s, open: false }))}
                  style={{
                    fontFamily: "var(--f-body)",
                    fontSize: 12,
                    color: theme.text.muted,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  Не сейчас
                </button>
              </>
            )}
          </GlassPanel>
          </div>
        </div>
      )}
    </div>
  )
}
