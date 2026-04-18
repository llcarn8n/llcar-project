import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface NextStepsProps {
  steps: string[]
}

export function NextSteps({ steps }: NextStepsProps) {
  if (!steps || steps.length === 0) return null

  return (
    <GlassPanel>
      <div className="hud-header mb-3">РЕКОМЕНДАЦИИ</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
            borderBottom: i < steps.length - 1 ? '1px solid rgba(0,229,255,0.06)' : 'none',
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontFamily: "var(--f-display)", fontWeight: 600,
              color: theme.accent.cyan, border: `1px solid ${theme.accent.cyan}30`,
              background: `${theme.accent.cyan}08`,
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 12, fontFamily: "var(--f-body)", color: theme.text.secondary, lineHeight: 1.4 }}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}
