import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../../stores/dashboardStore'
import { theme } from '../../theme'

interface BrandIndex { id: string; name: string; name_ru: string; country: string; models: number }
interface Generation { id: string; name: string; ys: number; ye: number }
interface Model { id: string; name: string; generations: Generation[] }
interface BrandFull { id: string; name: string; name_ru: string; models: Model[] }

const ENGINE_OPTIONS = [
  { value: 'gasoline', label: 'Бензин' },
  { value: 'diesel', label: 'Дизель' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'electric', label: 'Электро' },
  { value: 'gas', label: 'Газ (LPG)' },
]

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  color: '#ffffff',
  background: '#0f1923',
  border: '1px solid rgba(0,229,255,0.2)',
  borderRadius: 4,
  outline: 'none',
  letterSpacing: '0.03em',
  cursor: 'pointer',
}

export function VehicleSelect() {
  const navigate = useNavigate()
  const { setVehicleProfile, setMode } = useDashboardStore()

  const [brands, setBrands] = useState<BrandIndex[]>([])
  const [brandData, setBrandData] = useState<BrandFull | null>(null)
  const [brandId, setBrandId] = useState('')
  const [modelId, setModelId] = useState('')
  const [genId, setGenId] = useState('')
  const [engine, setEngine] = useState('gasoline')

  // Load brands index
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/brands-index.json`)
      .then(r => r.json())
      .then(d => setBrands(d))
      .catch(() => {})
  }, [])

  // Load brand data when brand selected
  useEffect(() => {
    if (!brandId) { setBrandData(null); return }
    fetch(`${import.meta.env.BASE_URL}data/brands/${brandId}.json`)
      .then(r => r.json())
      .then(d => setBrandData(d))
      .catch(() => setBrandData(null))
  }, [brandId])

  // Reset cascading selects
  useEffect(() => { setModelId(''); setGenId('') }, [brandId])
  useEffect(() => { setGenId('') }, [modelId])

  const selectedModel = brandData?.models.find(m => m.id === modelId)
  const selectedGen = selectedModel?.generations.find(g => g.id === genId)
  const canConfirm = brandId && modelId && genId

  const handleConfirm = useCallback(() => {
    if (!brandData || !selectedModel || !selectedGen) return
    setVehicleProfile({
      brand: brandData.name,
      brandId: brandData.id,
      model: selectedModel.name,
      year: selectedGen.ys,
      engine,
      generationId: selectedGen.id,
    })
    navigate('/vehicle')
  }, [brandData, selectedModel, selectedGen, engine, setVehicleProfile, navigate])

  const handleGeneral = useCallback(() => {
    setMode('general')
    navigate('/')
  }, [setMode, navigate])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* Title */}
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: theme.accent.cyan,
        textShadow: `0 0 10px ${theme.accent.cyan}40`,
        textTransform: 'uppercase' as const,
      }}>
        Выберите автомобиль
      </div>

      {/* Brand */}
      <div>
        <label style={{ fontSize: 11, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
          Марка ({brands.length})
        </label>
        <select style={selectStyle} value={brandId} onChange={e => setBrandId(e.target.value)}>
          <option value="">— Выберите марку —</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{b.name_ru || b.name} ({b.models})</option>
          ))}
        </select>
      </div>

      {/* Model */}
      {brandData && (
        <div>
          <label style={{ fontSize: 11, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            Модель
          </label>
          <select style={selectStyle} value={modelId} onChange={e => setModelId(e.target.value)}>
            <option value="">— Выберите модель —</option>
            {brandData.models.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.generations.length})</option>
            ))}
          </select>
        </div>
      )}

      {/* Generation */}
      {selectedModel && (
        <div>
          <label style={{ fontSize: 11, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            Поколение
          </label>
          <select style={selectStyle} value={genId} onChange={e => setGenId(e.target.value)}>
            <option value="">— Выберите поколение —</option>
            {selectedModel.generations.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.ys}–{g.ye || '...'})</option>
            ))}
          </select>
        </div>
      )}

      {/* Engine */}
      {genId && (
        <div>
          <label style={{ fontSize: 11, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            Тип двигателя
          </label>
          <select style={selectStyle} value={engine} onChange={e => setEngine(e.target.value)}>
            {ENGINE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        style={{
          padding: '12px 24px',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: canConfirm ? '#0C1220' : theme.text.muted,
          background: canConfirm
            ? `linear-gradient(135deg, ${theme.accent.cyan}, ${theme.accent.teal})`
            : 'rgba(0,229,255,0.05)',
          border: 'none',
          borderRadius: 4,
          cursor: canConfirm ? 'pointer' : 'default',
          boxShadow: canConfirm ? `0 0 20px ${theme.accent.cyan}40` : 'none',
          transition: 'all 0.3s',
          marginTop: 4,
        }}
      >
        Открыть
      </button>

      {/* General mode */}
      <button
        onClick={handleGeneral}
        style={{
          padding: '8px 16px',
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: theme.text.muted,
          background: 'transparent',
          border: `1px solid rgba(0,229,255,0.15)`,
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
      >
        Ознакомиться с продуктом
      </button>
    </div>
  )
}
