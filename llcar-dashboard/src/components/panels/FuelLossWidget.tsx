import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface FuelLossProps {
  fuelLoss: { monthly_rub: number; yearly_rub: number } | null
}

export function FuelLossWidget({ fuelLoss }: FuelLossProps) {
  if (!fuelLoss) return null

  return (
    <GlassPanel>
      <div className="hud-header mb-3">ПОТЕРИ ТОПЛИВА</div>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          fontSize: 28, fontFamily: "Consolas, monospace", fontWeight: 'bold',
          color: theme.status.warning,
          textShadow: `0 0 12px ${theme.status.warning}40`,
          marginBottom: 2,
        }}>
          {fuelLoss.monthly_rub.toLocaleString('ru-RU')} ₽
        </div>
        <div style={{ fontSize: 11, fontFamily: "var(--f-body)", color: theme.text.muted, letterSpacing: '0.05em' }}>
          в месяц
        </div>
        <div style={{
          marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(0,229,255,0.08)',
          display: 'flex', justifyContent: 'center', gap: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontFamily: "Consolas, monospace", fontWeight: 'bold', color: theme.status.critical }}>
              {fuelLoss.yearly_rub.toLocaleString('ru-RU')} ₽
            </div>
            <div style={{ fontSize: 9, fontFamily: "var(--f-display)", color: theme.text.muted, letterSpacing: '0.1em' }}>
              В ГОД
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
