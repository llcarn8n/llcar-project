import { Suspense, lazy, useState, useMemo } from 'react'

const SmartSphere = lazy(() => import('../components/three/SmartSphere').then(m => ({ default: m.SmartSphere })))
import { AudioSpectrum } from '../components/panels/AudioSpectrum'
import { DiagnosisCard } from '../components/panels/DiagnosisCard'
import { AnomalyTimeline } from '../components/panels/AnomalyTimeline'
import type { HistoryPoint } from '../components/panels/AnomalyTimeline'
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
import { TripCompare } from '../components/panels/TripCompare'
import { OnboardingTour } from '../components/onboarding/OnboardingTour'
import { BaselineStatus } from '../components/panels/BaselineStatus'
import { OBDSetup } from '../components/diagnostics/OBDSetup'
import { ChatPanel } from '../components/chat/ChatPanel'
import { RulesList } from '../components/diagnostics/RulesList'
import { DiagnosticSearch } from '../components/diagnostics/DiagnosticSearch'
import { SuspensionTab } from '../components/panels/SuspensionTab'

const CoherenceMap = lazy(() => import('../components/panels/CoherenceMap').then(m => ({ default: m.CoherenceMap })))
const CUSUMChart = lazy(() => import('../components/panels/CUSUMChart').then(m => ({ default: m.CUSUMChart })))
const PseudoOrderPlot = lazy(() => import('../components/panels/PseudoOrderPlot').then(m => ({ default: m.PseudoOrderPlot })))

export function Diagnostics() {
  const { clientHash, timeRange, expertMode, toggleExpert, useV2Api, toggleV2Api } = useDashboardStore()
  const { report: v2Report, history: v2History, loading: v2Loading, error: _v2Error, sendFeedback, fetchLatest } = useDiagnosticV2(clientHash)
  const [manualLoading, setManualLoading] = useState(false)

  // Adapter: convert V2 HistoryEntry[] to AnomalyTimeline's HistoryPoint[]
  const v2HistoryAdapted = useMemo<HistoryPoint[]>(() => {
    if (!v2History || v2History.length === 0) return []
    return v2History.map((entry) => ({
      time: entry.time,
      overall: entry.overall_score,
      suspension: entry.suspension_score,
      engine: entry.engine_score,
      electrical: entry.electrical_score,
      audio: entry.audio_score,
      confidence: entry.confidence,
      degradation: false,
      trend: 0,
      regime: 'unknown',
      top_diagnostic: entry.top_diagnostic || '',
      top_diagnostic_confidence: entry.top_diagnostic_confidence,
    }))
  }, [v2History])

  const handleRunDiagnostic = async () => {
    setManualLoading(true)
    await fetchLatest()
    setManualLoading(false)
  }

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
      {/* V2 API toggle — Expert only */}
      {expertMode && (
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
      )}

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
          <div className="flex flex-col gap-2">
            <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} />
            <button
              onClick={(e) => { e.stopPropagation(); handleRunDiagnostic() }}
              disabled={manualLoading}
              className="w-full py-2 px-4 rounded transition-all duration-300"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 12,
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                color: manualLoading ? theme.text.muted : theme.accent.cyan,
                background: manualLoading
                  ? 'rgba(0,229,255,0.03)'
                  : 'rgba(0,229,255,0.06)',
                border: `1px solid ${manualLoading ? 'rgba(0,229,255,0.1)' : 'rgba(0,229,255,0.3)'}`,
                backdropFilter: 'blur(12px)',
                boxShadow: manualLoading
                  ? 'none'
                  : `0 0 16px rgba(0,229,255,0.1), inset 0 0 12px rgba(0,229,255,0.05)`,
                cursor: manualLoading ? 'wait' : 'pointer',
              }}
            >
              {manualLoading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="animate-spin" style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(0,229,255,0.2)',
                    borderTopColor: theme.accent.cyan,
                    borderRadius: '50%',
                  }} />
                  Анализ...
                </span>
              ) : (
                'Запустить диагностику'
              )}
            </button>
          </div>
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
        <Suspense fallback={
          <GlassPanel style={{ height: 'min(420px, 55vh)' }}>
            <div className="hud-header mb-3">Вибрация 3D</div>
            <div className="flex items-center justify-center" style={{ height: 200, color: 'rgba(0,229,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}>Loading 3D...</div>
          </GlassPanel>
        }>
          <SmartSphere data={accelData} />
        </Suspense>
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

      {/* System Checklist */}
      {useV2Api && v2Report && !expanded && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">Чек-лист систем</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { key: 'suspension' as const, name: 'Подвеска', icon: '\u{1F6DE}' },
                { key: 'engine' as const, name: 'Двигатель', icon: '\u2699' },
                { key: 'electrical' as const, name: 'Электрика', icon: '\u26A1' },
                { key: 'audio' as const, name: 'Шумы/вибрации', icon: '\u{1F50A}' },
              ]).map(sys => {
                const score = v2Report.health_scores[sys.key] ?? 0
                const hasDiag = v2Report.diagnoses.some(d =>
                  (d.status === 'likely' || d.status === 'possible') &&
                  (d.rule_name.includes(sys.key) || d.evidence?.some(e => typeof e === 'string' && e.includes(sys.key === 'audio' ? 'audio' : sys.key === 'suspension' ? 'accel' : sys.key)))
                )
                const st = score >= 80 && !hasDiag ? 'ok' : score >= 50 ? 'warning' : 'critical'
                const stColor = st === 'ok' ? theme.status.ok : st === 'warning' ? theme.status.warning : theme.status.critical
                const checkIcon = st === 'ok' ? '\u2713' : st === 'warning' ? '\u26A0' : '\u2717'
                const stLabel = st === 'ok' ? 'Проверено — норма' : st === 'warning' ? 'Требует внимания' : 'Обнаружены проблемы'
                return (
                  <div key={sys.key} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 4,
                    background: `${stColor}08`,
                    border: `1px solid ${stColor}20`,
                  }}>
                    <span style={{ fontSize: 20, color: stColor, textShadow: `0 0 8px ${stColor}40` }}>{checkIcon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: theme.text.primary }}>
                        {sys.icon} {sys.name}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: "'Rajdhani', sans-serif", color: stColor, fontWeight: 600 }}>
                        {stLabel}
                      </div>
                      <div style={{ fontSize: 9, fontFamily: 'Consolas, monospace', color: theme.text.muted, marginTop: 1 }}>
                        Score: {score}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassPanel>
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
                  <HealthBar score={score} label="" showWear={useV2Api} />
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
        <AnomalyTimeline history={useV2Api ? v2HistoryAdapted : (historyData?.history ?? [])} />
      </div>

      {useV2Api && !expanded && (
        <div className="col-span-12 lg:col-span-3">
          <HealthTrends history={v2History} trends={v2Report?.health_trends} />
        </div>
      )}

      {/* Timeline Scrubber — full width */}
      {!expanded && (
        <div className="col-span-12">
          <TimelineScrubber history={useV2Api ? v2HistoryAdapted : (historyData?.history ?? [])} />
        </div>
      )}

      {/* Row 3: V2 additional panels */}
      {useV2Api && v2Report && !expanded && (
        <div className="col-span-12 grid grid-cols-12 gap-3">
          {/* Trip Compare */}
          {v2History.length >= 2 && (
            <div className="col-span-12 lg:col-span-3">
              <TripCompare history={v2History} />
            </div>
          )}

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

          {/* Baseline quality */}
          {v2Report.baseline_status && (
            <div className="col-span-12 lg:col-span-3">
              <BaselineStatus
                ready={v2Report.baseline_status.ready}
                totalSamples={v2Report.baseline_status.total_samples}
                samplesNeeded={v2Report.baseline_status.samples_needed}
              />
            </div>
          )}

          {/* Correlations */}
          <div className={v2Report.baseline_status ? 'col-span-12 lg:col-span-9' : 'col-span-12'}>
            <CorrelationPanel clientHash={clientHash} />
          </div>
        </div>
      )}

      {/* Suspension analysis — V2 style with 3D scatter + charts */}
      <div className="col-span-12">
        <SuspensionTab accelData={accelData} />
      </div>

      {/* Rules + Search — ALWAYS visible, important section */}
      <div className="col-span-12 lg:col-span-5">
        <DiagnosticSearch />
      </div>
      <div className="col-span-12 lg:col-span-7">
        <RulesList />
      </div>

      {/* OBD + Chat */}
      {!expanded && (
        <>
          <div className="col-span-12 grid grid-cols-12 gap-3">
            <div className="col-span-12 lg:col-span-4">
              <OBDSetup />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <ChatPanel />
            </div>
          </div>
        </>
      )}

      {/* Row 4: Expert panels (CoherenceMap + CUSUMChart + PseudoOrderPlot) */}
      {expertMode && (
        <div className="col-span-12 grid grid-cols-12 gap-3">
          <div className="col-span-6 lg:col-span-4">
            <Suspense fallback={<GlassPanel><div className="text-center text-xs font-mono" style={{ color: theme.text.muted }}>Loading...</div></GlassPanel>}>
              <CoherenceMap accel={accelData} audio={audioData} />
            </Suspense>
          </div>
          <div className="col-span-6 lg:col-span-4">
            <Suspense fallback={<GlassPanel><div className="text-center text-xs font-mono" style={{ color: theme.text.muted }}>Loading...</div></GlassPanel>}>
              <CUSUMChart degradation={degradation} history={historyData?.history} />
            </Suspense>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <Suspense fallback={<GlassPanel><div className="text-center text-xs font-mono" style={{ color: theme.text.muted }}>Loading...</div></GlassPanel>}>
              <PseudoOrderPlot accel={accelData} pids={apiData?.pids ?? []} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
