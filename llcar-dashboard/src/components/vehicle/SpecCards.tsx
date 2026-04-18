import { GlassPanel } from '../shared/GlassPanel'

interface Dimensions {
  length_mm?: number
  width_mm?: number
  height_mm?: number
  wheelbase_mm?: number
  ground_clearance_mm?: number
  trunk_volume_l?: number
  curb_weight_kg?: number
  doors?: number
  seats?: number
}

interface Trim {
  name: string
  engine?: { type?: string; displacement_cc?: number; power_hp?: number; torque_nm?: number }
  transmission?: { type?: string; gears?: number }
  drivetrain?: string
  performance?: { acceleration_0_100_s?: number; top_speed_kmh?: number; fuel_urban_l?: number; fuel_highway_l?: number; fuel_combined_l?: number }
}

interface SpecCardsProps {
  dimensions?: Dimensions
  trims?: Trim[]
  generationName: string
}

function SpecCard({ label, value, unit, icon }: { label: string; value: string | number | undefined; unit?: string; icon: string }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 14px 16px',
      borderRadius: 6,
      background: 'linear-gradient(135deg, rgba(230,212,168,0.06) 0%, rgba(10,10,12,0.82) 100%)',
      border: '1px solid rgba(230,212,168,0.22)',
      gap: 8,
      minWidth: 110,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,239,180,0.08), 0 0 18px rgba(230,212,168,0.05)',
      transition: 'all 0.3s',
    }}>
      {/* Top glow line — champagne */}
      <div style={{
        position: 'absolute',
        top: 0, left: '20%', right: '20%',
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(230,212,168,0.55), transparent)',
      }} />
      <span style={{
        fontSize: 22,
        filter: 'drop-shadow(0 0 6px rgba(230,212,168,0.45))',
      }}>{icon}</span>
      <div style={{
        fontFamily: 'var(--f-mono)',
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--c-champagne)',
        textShadow: '0 0 10px rgba(230,212,168,0.55), 0 0 22px rgba(232,184,110,0.3), 0 0 40px rgba(200,148,70,0.18)',
        letterSpacing: '0.06em',
        lineHeight: 1,
      }}>
        {value}
        {unit && (
          <span style={{
            fontSize: 10,
            opacity: 0.55,
            marginLeft: 3,
            fontFamily: 'var(--f-body)',
            color: '#FFFFFF',
          }}>{unit}</span>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--f-body)',
        fontSize: 11,
        fontWeight: 600,
        color: '#FFFFFF',
        opacity: 0.6,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        {label}
      </div>
    </div>
  )
}

export function SpecCards({ dimensions, trims }: SpecCardsProps) {
  const bestTrim = trims?.[0]
  const perf = bestTrim?.performance

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Dimensions */}
      {dimensions && (
        <GlassPanel>
          <div className="hud-header mb-3">Размеры и масса</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 10,
          }}>
            <SpecCard icon="&#x2194;" label="Длина" value={dimensions.length_mm} unit="мм" />
            <SpecCard icon="&#x2195;" label="Ширина" value={dimensions.width_mm} unit="мм" />
            <SpecCard icon="&#x21D5;" label="Высота" value={dimensions.height_mm} unit="мм" />
            <SpecCard icon="&#x21AD;" label="Колёсная база" value={dimensions.wheelbase_mm} unit="мм" />
            <SpecCard icon="&#x25B3;" label="Клиренс" value={dimensions.ground_clearance_mm} unit="мм" />
            <SpecCard icon="&#x1F4E6;" label="Багажник" value={dimensions.trunk_volume_l} unit="л" />
            <SpecCard icon="&#x2696;" label="Масса" value={dimensions.curb_weight_kg} unit="кг" />
            <SpecCard icon="&#x1F6AA;" label="Двери" value={dimensions.doors} />
            <SpecCard icon="&#x1FA91;" label="Мест" value={dimensions.seats} />
          </div>
        </GlassPanel>
      )}

      {/* Performance from best trim */}
      {perf && (
        <GlassPanel>
          <div className="hud-header mb-3">Динамика</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 10,
          }}>
            <SpecCard icon="&#x1F3CE;" label="0–100 км/ч" value={perf.acceleration_0_100_s} unit="с" />
            <SpecCard icon="&#x1F6A9;" label="Макс. скорость" value={perf.top_speed_kmh} unit="км/ч" />
            <SpecCard icon="&#x26FD;" label="Расход (город)" value={perf.fuel_urban_l} unit="л/100" />
            <SpecCard icon="&#x1F6E3;" label="Расход (трасса)" value={perf.fuel_highway_l} unit="л/100" />
            <SpecCard icon="&#x1F504;" label="Расход (смеш.)" value={perf.fuel_combined_l} unit="л/100" />
          </div>
        </GlassPanel>
      )}

      {/* Trims table */}
      {trims && trims.length > 0 && (
        <GlassPanel>
          <div className="hud-header mb-3">Комплектации ({trims.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0 3px',
              fontFamily: 'var(--f-body)',
              fontSize: 12,
            }}>
              <thead>
                <tr>
                  {['Комплектация', 'Мощность', 'Крутящий', 'КПП', 'Привод', '0-100', 'Расход'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      color: 'var(--c-champagne)',
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      borderBottom: '2px solid rgba(230,212,168,0.22)',
                      background: 'linear-gradient(90deg, rgba(230,212,168,0.06) 0%, transparent 100%)',
                      fontFamily: 'var(--f-display)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trims.map((t, i) => (
                  <tr key={i} className="trim-row" style={{
                    background: i % 2 === 0 ? 'rgba(10,10,12,0.55)' : 'rgba(230,212,168,0.03)',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    position: 'relative',
                  }}>
                    <td style={{ padding: '8px 10px', color: '#FFFFFF', fontWeight: 600 }}>{t.name}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--c-champagne)', fontWeight: 600 }}>
                      {t.engine?.power_hp ? `${t.engine.power_hp} л.с.` : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#FFFFFF' }}>{t.engine?.torque_nm ? `${t.engine.torque_nm} Нм` : '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#FFFFFF' }}>
                      {t.transmission ? `${t.transmission.type === 'automatic' ? 'АКПП' : t.transmission.type === 'manual' ? 'МКПП' : t.transmission.type === 'cvt' ? 'CVT' : t.transmission.type === 'robot' ? 'Робот' : t.transmission.type} ${t.transmission.gears || ''}` : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#FFFFFF' }}>
                      {t.drivetrain === 'fwd' ? 'Передний' : t.drivetrain === 'rwd' ? 'Задний' : t.drivetrain === 'awd' ? 'Полный' : t.drivetrain || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#FFFFFF' }}>{t.performance?.acceleration_0_100_s ? `${t.performance.acceleration_0_100_s}с` : '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#FFFFFF' }}>{t.performance?.fuel_combined_l ? `${t.performance.fuel_combined_l}л` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
