import { theme } from '../../theme'

interface SubsystemStatus {
  name: string
  score: number
  status: 'ok' | 'warning' | 'critical' | 'offline'
}

function ledAnimation(status: SubsystemStatus['status']): string {
  switch (status) {
    case 'ok': return 'ledPulseGreen 2s ease-in-out infinite'
    case 'critical': return 'ledPulseCritical 1.5s ease-in-out infinite'
    case 'warning': return 'ledPulseWarning 3s ease-in-out infinite'
    case 'offline':
    default: return 'none'
  }
}

export function StatusPills({ systems }: { systems: SubsystemStatus[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
      {systems.map(sys => {
        const color = sys.status === 'offline' ? theme.text.muted : sys.status === 'ok' ? theme.status.ok : sys.status === 'warning' ? theme.status.warning : theme.status.critical
        return (
          <div key={sys.name} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: `${color}12`, border: `1px solid ${color}33`,
            fontSize: 10, fontFamily: 'var(--f-body), sans-serif', fontWeight: 600,
            color, letterSpacing: '0.05em', textTransform: 'uppercase' as const,
          }}>
            {/* LED dot */}
            <span style={{
              width: 6, height: 6, borderRadius: '50%', backgroundColor: color,
              boxShadow: `0 0 6px ${color}`, display: 'inline-block',
              animation: ledAnimation(sys.status),
            }} />
            {sys.name}
            <span style={{ fontFamily: "Consolas, monospace", fontWeight: 'bold' }}>{sys.status === 'offline' ? '--' : sys.score}</span>
          </div>
        )
      })}
      <style>{`
        @keyframes ledPulseGreen {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px ${theme.status.ok}; }
          50% { opacity: 0.7; box-shadow: 0 0 12px ${theme.status.ok}, 0 0 20px ${theme.status.ok}60; }
        }
        @keyframes ledPulseCritical {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px ${theme.status.critical}; }
          50% { opacity: 0.5; box-shadow: 0 0 14px ${theme.status.critical}, 0 0 24px ${theme.status.critical}80; }
        }
        @keyframes ledPulseWarning {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px ${theme.status.warning}; }
          50% { opacity: 0.6; box-shadow: 0 0 10px ${theme.status.warning}, 0 0 18px ${theme.status.warning}50; }
        }
      `}</style>
    </div>
  )
}
