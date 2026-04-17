import { MiniSparkline } from '../ui/MiniSparkline'

export type SystemKey = 'suspension' | 'engine' | 'electrical' | 'audio'

const SYSTEMS: { key: SystemKey; short: string }[] = [
  { key: 'suspension', short: 'ПОДВЕСКА'  },
  { key: 'engine',     short: 'ДВИГАТЕЛЬ' },
  { key: 'electrical', short: 'ЭЛЕКТРИКА' },
  { key: 'audio',      short: 'АУДИО'     },
]

export interface ExtraTab {
  key: string
  label: string
  value: number | null
  onClick: () => void
  active?: boolean
}

export interface SystemScoreCardsProps {
  overallScore: number | null
  getScore: (key: SystemKey) => number | null
  sparklines: Record<SystemKey | 'overall', number[]>
  activeSystem: SystemKey | null
  setActiveSystem: (k: SystemKey | null) => void
  extraTabs?: ExtraTab[]
}

export function SystemScoreCards({
  overallScore,
  getScore,
  sparklines,
  activeSystem,
  setActiveSystem,
  extraTabs = [],
}: SystemScoreCardsProps) {
  void overallScore
  const tabs: { key: SystemKey | null; label: string; value: number | null; series: number[] }[] =
    SYSTEMS.map(s => ({
      key: s.key as SystemKey | null,
      label: s.short,
      value: getScore(s.key),
      series: sparklines[s.key],
    }))

  return (
    <div
      className="lumen-system-tabs"
      style={{
        position: 'absolute',
        top: 44,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        background: 'transparent',
      }}
    >
      {tabs.map((t, i) => {
        const active = activeSystem === t.key
        return (
          <button
            key={t.label}
            onClick={() => setActiveSystem(t.key)}
            style={{
              position: 'relative',
              minWidth: 140,
              padding: '10px 18px 12px',
              border: 'none',
              borderLeft: i === 0 ? 'none' : '1px solid rgba(200,180,142,0.22)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 5,
              background: active ? 'rgba(200,180,142,0.10)' : 'transparent',
              boxShadow: active
                ? 'inset 0 -2px 0 0 #E6D4A8, 0 0 22px rgba(200,180,142,0.18)'
                : 'none',
              transition: 'background 160ms var(--ease-hud), box-shadow 160ms var(--ease-hud)',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(200,180,142,0.05)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--f-body)',
              fontWeight: 700,
              color: active ? '#F8ECC8' : '#E6D4A8',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textShadow: active
                ? '0 0 12px rgba(230,212,168,0.7), 0 0 4px rgba(230,212,168,0.4)'
                : '0 0 6px rgba(230,212,168,0.35)',
            }}>{t.label}</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{
                fontSize: 16,
                fontFamily: 'var(--f-mono)',
                fontWeight: 400,
                color: t.value == null ? 'var(--c-spectral-muted)' : (active ? '#FFFFFF' : '#EFF2F7'),
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                textShadow: active ? '0 0 10px rgba(239,242,247,0.45)' : '0 0 4px rgba(239,242,247,0.20)',
              }}>{t.value == null ? '—' : t.value}</span>
              <MiniSparkline data={t.series} width={44} height={12} />
            </div>
          </button>
        )
      })}
      {extraTabs.map((t, j) => {
        const active = !!t.active
        const i = tabs.length + j
        return (
          <button
            key={t.key}
            onClick={t.onClick}
            style={{
              position: 'relative',
              minWidth: 160,
              padding: '10px 18px 12px',
              border: 'none',
              borderLeft: i === 0 ? 'none' : '1px solid rgba(200,180,142,0.22)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 5,
              background: active ? 'rgba(200,180,142,0.10)' : 'transparent',
              boxShadow: active
                ? 'inset 0 -2px 0 0 #E6D4A8, 0 0 22px rgba(200,180,142,0.18)'
                : 'none',
              transition: 'background 160ms var(--ease-hud), box-shadow 160ms var(--ease-hud)',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(200,180,142,0.05)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--f-body)',
              fontWeight: 700,
              color: active ? '#F8ECC8' : '#E6D4A8',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textShadow: active
                ? '0 0 12px rgba(230,212,168,0.7), 0 0 4px rgba(230,212,168,0.4)'
                : '0 0 6px rgba(230,212,168,0.35)',
            }}>{t.label}</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{
                fontSize: 16,
                fontFamily: 'var(--f-mono)',
                fontWeight: 400,
                color: t.value == null ? 'var(--c-spectral-muted)' : (active ? '#FFFFFF' : '#EFF2F7'),
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                textShadow: active ? '0 0 10px rgba(239,242,247,0.45)' : '0 0 4px rgba(239,242,247,0.20)',
              }}>{t.value == null ? '—' : t.value}</span>
              <span style={{
                fontSize: 10,
                color: '#D4A54A',
                marginBottom: 1,
                transition: 'transform 160ms var(--ease-hud)',
                transform: active ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>{'\u25BE'}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default SystemScoreCards
