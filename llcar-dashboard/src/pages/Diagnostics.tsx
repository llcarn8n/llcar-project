import { Suspense, lazy, useState } from 'react'
import { SmartSphere } from '../components/three/SmartSphere'
import { AudioSpectrum } from '../components/panels/AudioSpectrum'
import { DiagnosisCard } from '../components/panels/DiagnosisCard'
import { AnomalyTimeline } from '../components/panels/AnomalyTimeline'
import { TimelineScrubber } from '../components/panels/TimelineScrubber'
import { GlassPanel } from '../components/shared/GlassPanel'
import { HealthBar } from '../components/shared/HealthBar'
import { StatusBadge } from '../components/shared/StatusBadge'
import { useApiData } from '../hooks/useApiData'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'
import { useDiagnosticV2 } from '../hooks/useDiagnosticV2'
import { DiagnosisCardV2 } from '../components/diagnostics/DiagnosisCardV2'
import { HealthTrends } from '../components/panels/HealthTrends'
import { RecallsPanel } from '../components/panels/RecallsPanel'
import { EscalationTimeline } from '../components/panels/EscalationTimeline'
import { NextSteps } from '../components/panels/NextSteps'
import { FuelLossWidget } from '../components/panels/FuelLossWidget'
import { CorrelationPanel } from '../components/panels/CorrelationPanel'
import { OnboardingTour } from '../components/onboarding/OnboardingTour'

const CoherenceMap = lazy(() => import('../components/panels/CoherenceMap').then(m => ({ default: m.CoherenceMap })))
const CUSUMChart = lazy(() => import('../components/panels/CUSUMChart').then(m => ({ default: m.CUSUMChart })))

export function Diagnostics() {
  const { clientHash, timeRange, expertMode, toggleExpert, useV2Api, toggleV2Api } = useDashboardStore()
  const { report: v2Report, history: v2History, loading: v2Loading, error: _v2Error, sendFeedback } = useDiagnosticV2(clientHash)

  const { data: anomaly } = useApiData<any>({
    endpoint: '/api/anomaly/',
    params: { client: clientHash, minutes: timeRange },
    refreshInterval: 30000,
  })

  const { data: apiData } = useApiData<any>({
    endpoint: '/api/data/',
    params: { client: clientHash, minutes: timeRange, tab: 'overview', limit: 500 },
    refreshInterval: 30000,
  })

  const { data: historyData } = useApiData<any>({
    endpoint: '/api/anomaly/history/',
    params: { client: clientHash, days: 7 },
    refreshInterval: 60000,
  })

  const overall = anomaly?.overall ?? -1
  const regime = anomaly?.regime ?? 'unknown'
  const hasData = (apiData?.accel?.length ?? 0) > 0 || (apiData?.audio?.length ?? 0) > 0
  const isOffline = !hasData && overall <= 0 && regime === 'unknown'
  const systems = anomaly?.systems ?? {}
  const diagnostics = anomaly?.diagnostics ?? []
  const degradation = anomaly?.degradation

  const accelData = apiData?.accel ?? []
  const audioData = apiData?.audio ?? []

  // L2: Panel expand state
  const [expanded, setExpanded] = useState<string | null>(null)
  const toggle = (panel: string) => setExpanded(expanded === panel ? null : panel)

  return (
    <div className="relative">
      <OnboardingTour />
      {/* V2 API toggle */}
      <button
        onClick={toggleV2Api}
        className="nav-btn absolute top-0 right-24 z-20 font-mono text-[10px] lg:text-xs px-2 lg:px-3 py-1 rounded transition-all duration-200"
        style={{
          color: useV2Api ? theme.accent.teal : theme.text.muted,
          boxShadow: useV2Api ? `0 0 12px ${theme.accent.teal}44, inset 0 0 8px ${theme.accent.teal}22` : 'none',
          background: useV2Api ? `${theme.accent.teal}11` : 'transparent',
          border: `1px solid ${useV2Api ? theme.accent.teal : 'rgba(255,255,255,0.1)'}`,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}
      >
        API {useV2Api ? 'V2 \u25CF' : 'V1'}
      </button>

      {/* Expert Mode toggle */}
      <button
        onClick={toggleExpert}
        className="nav-btn absolute top-0 right-0 z-20 font-mono text-[10px] lg:text-xs px-2 lg:px-3 py-1 rounded transition-all duration-200"
        style={{
          color: expertMode ? theme.accent.cyan : theme.text.muted,
          borderColor: expertMode ? theme.accent.cyan : 'rgba(255,255,255,0.1)',
          boxShadow: expertMode ? `0 0 12px ${theme.accent.cyan}44, inset 0 0 8px ${theme.accent.cyan}22` : 'none',
          background: expertMode ? `${theme.accent.cyan}11` : 'transparent',
          border: `1px solid ${expertMode ? theme.accent.cyan : 'rgba(255,255,255,0.1)'}`,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}
      >
        EXPERT{expertMode ? ' \u25CF' : ''}
      </button>

    <div className="grid grid-cols-12 gap-3 mt-8">
      {/* Row 1: Diagnosis Card + AccelBars + Audio Spectrum */}
      {/* Expanded panel takes full row, others collapse */}
      <div
        className={`${expanded === 'diag' ? 'col-span-12' : expanded ? 'hidden' : useV2Api ? 'col-span-12 md:col-span-6 lg:col-span-4' : 'col-span-12 md:col-span-6 lg:col-span-3'} cursor-pointer transition-all duration-300`}
        onClick={() => toggle('diag')}
      >
        {useV2Api ? (
          <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} />
        ) : (
          <DiagnosisCard
            diagnostics={diagnostics}
            degradation={degradation}
            regime={regime}
          />
        )}
      </div>

      <div
        className={`${expanded === 'accel' ? 'col-span-12' : expanded ? 'hidden' : 'col-span-12 md:col-span-6 lg:col-span-4'} cursor-pointer transition-all duration-300`}
        onClick={() => toggle('accel')}
      >
        <SmartSphere data={accelData} />
      </div>

      <div
        className={`${expanded === 'audio' ? 'col-span-12' : expanded ? 'hidden' : useV2Api ? 'col-span-12 md:col-span-12 lg:col-span-4' : 'col-span-12 md:col-span-12 lg:col-span-5'} cursor-pointer transition-all duration-300`}
        onClick={() => toggle('audio')}
      >
        <AudioSpectrum data={audioData} />
      </div>

      {/* Collapse hint */}
      {expanded && (
        <div className="col-span-12 text-center">
          <span className="text-[10px] font-mono cursor-pointer px-3 py-1 rounded" style={{
            color: theme.text.muted,
            background: 'rgba(0,229,255,0.05)',
            border: '1px solid rgba(0,229,255,0.15)',
          }} onClick={() => setExpanded(null)}>
            ← Свернуть панель
          </span>
        </div>
      )}

      {/* Row 2: Per-system health bars + Anomaly Timeline */}
      <div className={`${expanded ? 'hidden' : 'col-span-12 lg:col-span-3'}`}>
        <GlassPanel>
          <div className="hud-header mb-3">Подсистемы</div>
          <div className="space-y-3">
            {(['suspension', 'engine', 'electrical', 'audio'] as const).map(sys => {
              // Use V2 scores when available
              const v2Score = useV2Api && v2Report ? v2Report.health_scores[sys] : null
              const sysData = systems[sys]
              const score = v2Score !== null ? v2Score : (sysData?.score ?? 0)
              const trend = useV2Api && v2Report ? v2Report.health_trends[sys] : null
              const sysNames: Record<string, string> = {
                suspension: 'Подвеска',
                engine: 'Двигатель',
                electrical: 'Электрика',
                audio: 'Аудио',
              }
              return (
                <div key={sys}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono" style={{ color: theme.text.secondary }}>
                      {sysNames[sys]}
                    </span>
                    <div className="flex items-center gap-2">
                      {trend && (
                        <span style={{
                          fontSize: 14,
                          color: trend === '\u2193' ? theme.status.critical : trend === '\u2191' ? theme.status.ok : theme.accent.cyan,
                        }}>
                          {trend}
                        </span>
                      )}
                      <span className="text-xs font-mono" style={{
                        color: isOffline && score === 0 ? theme.text.muted : score >= 80 ? theme.status.ok : score >= 50 ? theme.status.warning : theme.status.critical,
                      }}>
                        {isOffline && score === 0 ? '--' : score}
                      </span>
                      <StatusBadge status={isOffline && score === 0 ? 'offline' : score >= 80 ? 'ok' : score >= 50 ? 'warning' : 'critical'} />
                    </div>
                  </div>
                  <HealthBar score={score} label="" />
                  {/* Feature z-scores (V1 only) */}
                  {!useV2Api && sysData?.features && (
                    <div className="mt-1 flex flex-wrap gap-1 overflow-hidden max-w-full">
                      {Object.entries(sysData.features as Record<string, any>)
                        .filter(([, v]: [string, any]) => v.status !== 'missing')
                        .map(([feat, v]: [string, any]) => {
                          const short = feat.replace(/^(accel|audio|pid)_/, '').replace(/_/g, ' ')
                          return (
                            <span key={feat} className="text-[9px] font-mono px-1 rounded truncate max-w-[80px]" title={`${feat}: z${Math.abs(v.z || 0).toFixed(1)}`} style={{
                              color: v.status === 'critical' ? theme.status.critical : v.status === 'warning' ? theme.status.warning : theme.text.muted,
                              background: v.status === 'critical' ? 'rgba(255,23,68,0.15)' : v.status === 'warning' ? 'rgba(255,184,0,0.1)' : 'transparent',
                            }}>
                              {short} z{Math.abs(v.z || 0).toFixed(1)}
                            </span>
                          )
                        })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlassPanel>
      </div>

      <div className={`${expanded ? 'hidden' : useV2Api ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-9'}`}>
        <AnomalyTimeline history={historyData?.history ?? []} />
      </div>

      {useV2Api && !expanded && (
        <div className="col-span-12 lg:col-span-3">
          <HealthTrends history={v2History} trends={v2Report?.health_trends} />
        </div>
      )}

      {/* Timeline Scrubber — full width */}
      {!expanded && (
        <div className="col-span-12">
          <TimelineScrubber history={historyData?.history ?? []} />
        </div>
      )}

      {/* Row 3: V2 additional panels */}
      {useV2Api && v2Report && !expanded && (
        <div className="col-span-12 grid grid-cols-12 gap-3">
          {/* Fuel Loss (if present) */}
          {v2Report.fuel_loss && (
            <div className="col-span-12 lg:col-span-3">
              <FuelLossWidget fuelLoss={v2Report.fuel_loss} />
            </div>
          )}

          {/* Escalation Timeline */}
          {v2Report.escalations && v2Report.escalations.length > 0 && (
            <div className={v2Report.fuel_loss ? 'col-span-12 lg:col-span-4' : 'col-span-12 lg:col-span-6'}>
              <EscalationTimeline escalations={v2Report.escalations} />
            </div>
          )}

          {/* Next Steps */}
          {v2Report.next_steps && v2Report.next_steps.length > 0 && (
            <div className={v2Report.fuel_loss ? 'col-span-12 lg:col-span-5' : 'col-span-12 lg:col-span-6'}>
              <NextSteps steps={v2Report.next_steps} />
            </div>
          )}

          {/* Recalls */}
          <div className="col-span-12">
            <RecallsPanel recalls={v2Report.recalls || []} />
          </div>

          {/* Correlations */}
          <div className="col-span-12">
            <CorrelationPanel clientHash={clientHash} />
          </div>
        </div>
      )}

      {/* Row 4: Expert panels (CoherenceMap + CUSUMChart) */}
      {expertMode && (
        <div className="col-span-12 grid grid-cols-12 gap-3">
          <div className="col-span-6">
            <Suspense fallback={<GlassPanel><div className="text-center text-xs font-mono" style={{ color: theme.text.muted }}>Loading...</div></GlassPanel>}>
              <CoherenceMap accel={accelData} audio={audioData} />
            </Suspense>
          </div>
          <div className="col-span-6">
            <Suspense fallback={<GlassPanel><div className="text-center text-xs font-mono" style={{ color: theme.text.muted }}>Loading...</div></GlassPanel>}>
              <CUSUMChart degradation={degradation} history={historyData?.history} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
