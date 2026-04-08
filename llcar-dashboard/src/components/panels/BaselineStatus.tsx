import { GlassPanel } from '../shared/GlassPanel'

interface BaselineStatusProps {
  ready: boolean
  totalSamples: number
  samplesNeeded: number
}

export function BaselineStatus({ ready, totalSamples, samplesNeeded }: BaselineStatusProps) {
  const targetSamples = 200
  const progress = Math.min(100, (totalSamples / targetSamples) * 100)

  return (
    <GlassPanel>
      <div className="hud-header mb-3">Калибровка</div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="health-track" style={{ height: 4 }}>
            <div
              className="health-fill"
              style={{
                width: `${progress}%`,
                background: ready
                  ? 'linear-gradient(90deg, var(--status-ok), var(--accent-teal))'
                  : 'linear-gradient(90deg, var(--status-warning), var(--accent-cyan))',
              }}
            />
          </div>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          {totalSamples}/{targetSamples}
        </span>
      </div>
      <div className="text-[10px] font-mono mt-2" style={{ color: 'var(--text-muted)' }}>
        {ready
          ? 'Калибровка завершена — диагностика точная'
          : `Нужно ещё ${samplesNeeded} замеров для точной диагностики`
        }
      </div>
    </GlassPanel>
  )
}
