import { theme } from '../../theme'

interface SubsystemStatus {
  name: string
  score: number
  status: 'ok' | 'warning' | 'critical' | 'offline'
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
            fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
            color, letterSpacing: '0.05em', textTransform: 'uppercase' as const,
          }}>
            {/* LED dot */}
            <span style={{
              width: 6, height: 6, borderRadius: '50%', backgroundColor: color,
              boxShadow: `0 0 6px ${color}`, display: 'inline-block',
              animation: sys.status !== 'ok' && sys.status !== 'offline' ? 'ledPulse 2s ease-in-out infinite' : 'none',
            }} />
            {sys.name}
            <span style={{ fontFamily: "Consolas, monospace", fontWeight: 'bold' }}>{sys.status === 'offline' ? '--' : sys.score}</span>
          </div>
        )
      })}
      <style>{`@keyframes ledPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </div>
  )
}
