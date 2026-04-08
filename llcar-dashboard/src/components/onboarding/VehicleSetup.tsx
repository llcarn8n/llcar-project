import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDashboardStore } from '../../stores/dashboardStore'
import robotDefault from '../../assets/robot-default.jpg'
import vehiclesData from '../../data/vehicles.json'

// ── Types ──

export interface VehicleProfile {
  brand: string
  model: string
  year: number
  engine: string
}

interface VehicleBrand {
  id: string
  name: string
  models: { id: string; name: string; generations: { name: string; ys: number; ye: number }[] }[]
}

const STORAGE_KEY = 'llcar-vehicle-profile'

const ENGINE_OPTIONS = [
  { value: 'gasoline', label: 'Бензин' },
  { value: 'diesel', label: 'Дизель' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'electric', label: 'Электро' },
  { value: 'gas', label: 'Газ (LPG/CNG)' },
]

const STEPS = [
  { field: 'brand' as const, title: 'Марка', subtitle: 'Выберите марку автомобиля' },
  { field: 'model' as const, title: 'Модель', subtitle: 'Выберите модель' },
  { field: 'year' as const, title: 'Поколение / год', subtitle: 'Выберите поколение или год выпуска' },
  { field: 'engine' as const, title: 'Тип двигателя', subtitle: 'Выберите тип силовой установки' },
]

const brands = vehiclesData as VehicleBrand[]

// ── Helpers ──

function loadProfile(): VehicleProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.brand && parsed.model && parsed.year && parsed.engine) {
      return parsed as VehicleProfile
    }
    return null
  } catch {
    return null
  }
}

function saveProfile(profile: VehicleProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
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
  maxWidth: 640,
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
  gap: 20,
}

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0',
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: 16,
  fontWeight: 500,
  color: 'var(--text-primary)',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid var(--border-glow)',
  outline: 'none',
  letterSpacing: '0.03em',
  transition: 'border-color 0.3s',
}

const selectStyle: React.CSSProperties = {
  ...inputBaseStyle,
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300E5FF' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 4px center',
  paddingRight: 24,
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

// ── Summary Card ──

function SummaryCard({ profile, onConfirm, onEdit }: {
  profile: VehicleProfile
  onConfirm: () => void
  onEdit: () => void
}) {
  const engineLabel = ENGINE_OPTIONS.find(e => e.value === profile.engine)?.label || profile.engine

  const rows = [
    { label: '\u041C\u0430\u0440\u043A\u0430', value: profile.brand },
    { label: '\u041C\u043E\u0434\u0435\u043B\u044C', value: profile.model },
    { label: '\u0413\u043E\u0434', value: String(profile.year) },
    { label: '\u0414\u0432\u0438\u0433\u0430\u0442\u0435\u043B\u044C', value: engineLabel },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--accent-cyan)',
        letterSpacing: '0.12em',
        textShadow: '0 0 10px rgba(0,229,255,0.4)',
      }}>
        {'\u0412\u0410\u0428 \u0410\u0412\u0422\u041E\u041C\u041E\u0411\u0418\u041B\u042C'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r) => (
          <div key={r.label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-glow)',
          }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {r.label}
            </span>
            <span className="metric-value" style={{ fontSize: 16 }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <button onClick={onEdit} style={btnSecondaryStyle}>
          {'\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C'}
        </button>
        <button onClick={onConfirm} style={btnPrimaryStyle}>
          {'\u041D\u0430\u0447\u0430\u0442\u044C \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0443'}
        </button>
      </div>
    </div>
  )
}

// ── Main Component ──

interface VehicleSetupProps {
  /** When true, shows as a modal overlay (for re-editing from sidebar) */
  asModal?: boolean
  /** Called when setup is completed or modal is closed */
  onComplete?: () => void
}

export function VehicleSetup({ asModal = false, onComplete }: VehicleSetupProps) {
  const setVehicleProfile = useDashboardStore((s) => s.setVehicleProfile)

  const [step, setStep] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward')

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<number | ''>('')
  const [engine, setEngine] = useState('')

  // Cascading selects: brand → models, model → generations
  const selectedBrand = useMemo(() => brands.find(b => b.name === brand), [brand])
  const modelOptions = useMemo(() => selectedBrand?.models.map(m => m.name) || [], [selectedBrand])
  const selectedModel = useMemo(() => selectedBrand?.models.find(m => m.name === model), [selectedBrand, model])
  const generationOptions = useMemo(() => {
    if (!selectedModel) return []
    return selectedModel.generations.map(g => ({ label: g.name, ys: g.ys, ye: g.ye }))
  }, [selectedModel])

  // Pre-fill from existing profile when opened as modal
  useEffect(() => {
    if (asModal) {
      const existing = loadProfile()
      if (existing) {
        setBrand(existing.brand)
        setModel(existing.model)
        setYear(existing.year)
        setEngine(existing.engine)
      }
    }
  }, [asModal])

  // Reset dependent fields when parent changes
  useEffect(() => { if (!modelOptions.includes(model)) setModel('') }, [brand])
  useEffect(() => { setYear('') }, [model])

  const isStepValid = (): boolean => {
    switch (step) {
      case 0: return brand.length > 0
      case 1: return model.length > 0
      case 2: return typeof year === 'number' && year >= 1990 && year <= 2026
      case 3: return engine.length > 0
      default: return false
    }
  }

  const handleNext = useCallback(() => {
    if (!isStepValid()) return
    setAnimDir('forward')
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setShowSummary(true)
    }
  }, [step, brand, model, year, engine])

  const handleBack = useCallback(() => {
    if (showSummary) {
      setShowSummary(false)
      return
    }
    setAnimDir('back')
    if (step > 0) {
      setStep(step - 1)
    }
  }, [step, showSummary])

  const handleConfirm = useCallback(() => {
    if (typeof year !== 'number') return
    const profile: VehicleProfile = {
      brand: brand.trim(),
      model: model.trim(),
      year,
      engine,
    }
    saveProfile(profile)
    setVehicleProfile(profile)
    onComplete?.()
  }, [brand, model, year, engine, setVehicleProfile, onComplete])

  const handleEdit = useCallback(() => {
    setShowSummary(false)
    setStep(0)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isStepValid()) {
      handleNext()
    }
  }, [handleNext, step, brand, model, year, engine])

  // ── Step animation key ──
  const animKey = showSummary ? 'summary' : `step-${step}`
  const slideTransform = animDir === 'forward' ? 'translateX(20px)' : 'translateX(-20px)'

  // ── Render step input ──
  const renderStepInput = () => {
    const s = STEPS[step]

    return (
      <div
        key={animKey}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'vehicleStepIn 0.35s ease both',
        }}
      >
        <ProgressBar current={step + 1} total={STEPS.length} />

        <div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.12em',
            marginBottom: 4,
            textShadow: '0 0 10px rgba(0,229,255,0.4)',
          }}>
            {s.title}
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 12,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
          }}>
            {s.subtitle}
          </div>
        </div>

        {/* Input — all selects from vehicle database */}
        {step === 0 ? (
          <select value={brand} onChange={(e) => setBrand(e.target.value)} autoFocus
            style={{ ...selectStyle, borderBottomColor: brand ? 'var(--accent-cyan)' : undefined }}>
            <option value="" disabled style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Выберите марку...</option>
            {brands.map(b => (
              <option key={b.id} value={b.name} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{b.name}</option>
            ))}
          </select>
        ) : step === 1 ? (
          <select value={model} onChange={(e) => setModel(e.target.value)} autoFocus
            style={{ ...selectStyle, borderBottomColor: model ? 'var(--accent-cyan)' : undefined }}>
            <option value="" disabled style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Выберите модель...</option>
            {modelOptions.map(m => (
              <option key={m} value={m} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{m}</option>
            ))}
          </select>
        ) : step === 2 ? (
          generationOptions.length > 0 ? (
            <select value={year === '' ? '' : String(year)} onChange={(e) => setYear(Number(e.target.value))} autoFocus
              style={{ ...selectStyle, borderBottomColor: year ? 'var(--accent-cyan)' : undefined }}>
              <option value="" disabled style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Выберите поколение...</option>
              {generationOptions.map(g => (
                <option key={g.label} value={g.ys} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {g.label} ({g.ys}–{g.ye})
                </option>
              ))}
            </select>
          ) : (
            <input type="number" min={1990} max={2026} value={year}
              onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              onKeyDown={handleKeyDown} placeholder="2024" autoFocus
              style={{ ...inputBaseStyle, borderBottomColor: year ? 'var(--accent-cyan)' : undefined, MozAppearance: 'textfield' }} />
          )
        ) : (
          <select value={engine} onChange={(e) => setEngine(e.target.value)} autoFocus
            style={{ ...selectStyle, borderBottomColor: engine ? 'var(--accent-cyan)' : undefined }}>
            <option value="" disabled style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Выберите тип...</option>
            {ENGINE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          {step > 0 && (
            <button onClick={handleBack} style={btnSecondaryStyle}>
              {'\u041D\u0430\u0437\u0430\u0434'}
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            style={{
              ...btnPrimaryStyle,
              opacity: isStepValid() ? 1 : 0.35,
              cursor: isStepValid() ? 'pointer' : 'not-allowed',
            }}
          >
            {step === STEPS.length - 1 ? '\u0413\u043E\u0442\u043E\u0432\u043E' : '\u0414\u0430\u043B\u0435\u0435'}
          </button>
        </div>
      </div>
    )
  }

  // ── Inner card content ──
  const innerContent = (
    <div className="glass-panel" style={cardStyle}>
      {/* Inline animation keyframes */}
      <style>{`
        @keyframes vehicleStepIn {
          from { opacity: 0; transform: ${slideTransform}; }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Left: Robot panel (hidden on narrow screens) */}
      <div style={robotPanelStyle} className="vehicle-setup-robot">
        <img
          src={robotDefault}
          alt="LLCAR"
          style={{
            width: 100,
            height: 100,
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 16px rgba(0,229,255,0.35))',
            marginBottom: 16,
            animation: showSummary ? 'bounce 0.6s ease' : undefined,
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
          {'\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430'}
          <br />
          {'\u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044F'}
        </div>
      </div>

      {/* Right: Form panel */}
      <div style={formPanelStyle}>
        {showSummary ? (
          <div key="summary" style={{ animation: 'vehicleStepIn 0.35s ease both' }}>
            <SummaryCard
              profile={{ brand: brand.trim(), model: model.trim(), year: year as number, engine }}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
            />
          </div>
        ) : (
          renderStepInput()
        )}
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

  // Full-screen overlay
  return (
    <>
      {/* Responsive style for hiding robot on mobile */}
      <style>{`
        @media (max-width: 520px) {
          .vehicle-setup-robot { display: none !important; }
        }
        /* Remove number input spinners */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        /* Select option background for dark theme */
        .glass-panel select option {
          background: var(--bg-primary);
        }
      `}</style>
      <div style={overlayStyle}>
        {innerContent}
      </div>
    </>
  )
}

/** Check if a vehicle profile exists in localStorage */
export function hasVehicleProfile(): boolean {
  return loadProfile() !== null
}
