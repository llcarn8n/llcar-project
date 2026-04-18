import { useNavigate } from 'react-router-dom'
import { theme } from '../../theme'

const TIME_PILLS = [
  { label: '1Ч',  val: 60 },
  { label: '24Ч', val: 1440 },
  { label: '7Д',  val: 10080 },
  { label: '30Д', val: 43200 },
]

interface TimePillProps {
  label: string
  active: boolean
  onClick: () => void
}

function TimePill({ label, active, onClick }: TimePillProps) {
  return (
    <button
      onClick={onClick}
      data-active={active ? 'true' : 'false'}
      style={{
        padding: '4px 8px',
        background: 'transparent',
        border: 'none',
        color: active ? 'rgba(239,242,247,0.95)' : 'rgba(239,242,247,0.45)',
        fontFamily: 'var(--f-display)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.16em',
        lineHeight: 1,
        cursor: 'pointer',
        textShadow: 'none',
        transition: 'color 160ms var(--ease-hud), text-shadow 160ms var(--ease-hud)',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = 'rgba(239,242,247,0.95)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = 'rgba(239,242,247,0.45)'
        }
      }}
    >
      {label}
    </button>
  )
}

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

interface StatusSegmentProps {
  label: string
  withDivider?: boolean
  children: React.ReactNode
}

function StatusSegment({ label, withDivider, children }: StatusSegmentProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 4,
      padding: '0 10px',
      borderLeft: withDivider ? 'none' : 'none',
    }}>
      <span style={{
        fontSize: 10,
        fontFamily: 'var(--f-display)',
        fontWeight: 700,
        color: 'var(--c-champagne)',
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
        {children}
      </div>
    </div>
  )
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
    safe: { label: 'МОЖНО ЕХАТЬ', color: '#6BE08F', hint: 'Ехать безопасно' },
    caution: { label: 'ОСТОРОЖНО', color: '#E0B46B', hint: 'Есть замечания — ехать можно, но следить' },
    stop: { label: 'СТОП', color: '#E06B6B', hint: 'Обнаружены критичные диагнозы — ехать не рекомендуется' },
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
            <TimePill
              key={p.val}
              label={p.label}
              active={timeRange === p.val}
              onClick={() => setTimeRange(p.val)}
            />
          ))}
        </div>

        {canDrive && (() => {
          const drive = driveMap[canDrive]
          return (
            <span
              title={drive.hint}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--f-body)', fontSize: 9, fontWeight: 600,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: drive.color,
                cursor: 'help',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: drive.color,
                boxShadow: `0 0 6px ${drive.color}`,
                animation: canDrive === 'stop' ? 'canDrivePulse 1.4s ease-in-out infinite' : 'none',
              }} />
              {drive.label}
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: '#FFFFFF',
                textTransform: 'none',
                letterSpacing: '0.02em',
                marginLeft: 6,
              }}>
                — {drive.hint.toLowerCase()}
              </span>
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

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          pointerEvents: 'auto',
        }}
      >
        {vehicleProfile && (
          <StatusSegment label="АВТО">
            <button
              onClick={() => { onResetVehicle(); navigate('/') }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: 'var(--f-mono)',
                fontWeight: 500,
                color: '#FFFFFF',
                letterSpacing: '0.08em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                opacity: 0.9,
              }}
              title="Сменить автомобиль"
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-champagne)'; e.currentTarget.style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.opacity = '0.9' }}
            >
              {vehicleProfile.brand} {vehicleProfile.model}
              <span style={{
                fontSize: 8,
                color: 'var(--c-spectral-faint)',
                lineHeight: 1,
              }}>{'\u2715'}</span>
            </button>
          </StatusSegment>
        )}

        <StatusSegment label="СТАТУС" withDivider={!!vehicleProfile}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, lineHeight: 1 }}>
            <span style={{
              width: 4, height: 4, borderRadius: '50%',
              backgroundColor: isOnline ? theme.status.ok : theme.text.muted,
              boxShadow: isOnline ? `0 0 4px ${theme.status.ok}` : 'none',
              animation: isOnline ? 'pulse-dot 2s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--f-mono)',
              fontWeight: 500,
              color: '#FFFFFF',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>{isOnline ? 'Онлайн' : 'Офлайн'}</span>
          </div>
        </StatusSegment>

        <StatusSegment label="ПЕРИОД" withDivider>
          <span style={{
            fontSize: 9,
            fontFamily: 'var(--f-mono)',
            fontWeight: 400,
            color: '#FFFFFF',
            letterSpacing: '0.06em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {(() => {
              const now = new Date()
              const from = new Date(now.getTime() - timeRange * 60 * 1000)
              const pad = (n: number) => n.toString().padStart(2, '0')
              const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
              const fmtDate = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`
              const fmt = timeRange <= 1440 ? fmtTime : fmtDate
              return `${fmt(from)} — ${fmt(now)}`
            })()}
          </span>
        </StatusSegment>
      </div>
    </div>
  )
}

export default StatusBar
