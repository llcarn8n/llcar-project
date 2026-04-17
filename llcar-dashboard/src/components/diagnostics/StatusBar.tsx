import { useNavigate } from 'react-router-dom'
import { GhostButton } from '../ui/GhostButton'
import { theme } from '../../theme'

const TIME_PILLS = [
  { label: '1ч',  val: 60 },
  { label: '24ч', val: 1440 },
  { label: '7д',  val: 10080 },
  { label: '30д', val: 43200 },
]

export type CanDriveState = 'safe' | 'caution' | 'stop' | null | undefined

interface VehicleLabel {
  brand: string
  model: string
}

export interface StatusBarProps {
  timeRange: number
  setTimeRange: (v: number) => void
  canDrive: CanDriveState
  vehicleProfile: VehicleLabel | null | undefined
  onResetVehicle: () => void
  isOnline: boolean
}

export function StatusBar({
  timeRange,
  setTimeRange,
  canDrive,
  vehicleProfile,
  onResetVehicle,
  isOnline,
}: StatusBarProps) {
  const navigate = useNavigate()

  const driveMap = {
    safe: { label: 'МОЖНО ЕХАТЬ', color: '#6BE08F' },
    caution: { label: 'ОСТОРОЖНО', color: '#E0B46B' },
    stop: { label: 'СТОП', color: '#E06B6B' },
  } as const

  return (
    <div
      className="lumen-time-strip"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        borderBottom: '1px solid var(--c-spectral-divider)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto', flexWrap: 'nowrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
          {TIME_PILLS.map(p => (
            <GhostButton
              key={p.val}
              active={timeRange === p.val}
              onClick={() => setTimeRange(p.val)}
              variant="pill"
              size="sm"
              style={{ padding: '3px 10px', fontSize: 10, flex: '0 0 auto' }}
            >
              {p.label}
            </GhostButton>
          ))}
        </div>

        {canDrive && (() => {
          const drive = driveMap[canDrive]
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--f-body)', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: drive.color,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: drive.color,
                boxShadow: `0 0 6px ${drive.color}`,
                animation: canDrive === 'stop' ? 'canDrivePulse 1.4s ease-in-out infinite' : 'none',
              }} />
              {drive.label}
            </span>
          )
        })()}
        <style>{`
          @keyframes canDrivePulse {
            0%, 100% { box-shadow: 0 0 6px currentColor; opacity: 1; }
            50% { box-shadow: 0 0 12px currentColor; opacity: 0.7; }
          }
        `}</style>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
        {vehicleProfile && (
          <button
            onClick={() => { onResetVehicle(); navigate('/') }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'var(--f-mono)',
              fontWeight: 600,
              color: 'var(--c-spectral)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
            title="Сменить автомобиль"
          >
            {vehicleProfile.brand} {vehicleProfile.model} <span style={{ color: 'var(--c-spectral-faint)', marginLeft: 4 }}>✕</span>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: isOnline ? theme.status.ok : theme.text.muted,
            boxShadow: isOnline ? `0 0 6px ${theme.status.ok}` : 'none',
            animation: isOnline ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontSize: 9, fontFamily: 'var(--f-body)',
            color: 'var(--c-spectral-faint)',
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>{isOnline ? 'Онлайн' : 'Офлайн'}</span>
        </div>

        <div style={{
          fontSize: 9, fontFamily: 'var(--f-mono)',
          color: 'var(--c-spectral-faint)', letterSpacing: '0.12em',
        }}>
          {(() => {
            const now = new Date()
            const from = new Date(now.getTime() - timeRange * 60 * 1000)
            const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
            return `${fmt(from)} — ${fmt(now)}`
          })()}
        </div>
      </div>
    </div>
  )
}

export default StatusBar
