import { Suspense, lazy, useState, useMemo } from 'react'

const DiagnosticTwinCanvas = lazy(() => import('../components/three/DiagnosticTwinCanvas'))
const SmartSphere = lazy(() => import('../components/three/SmartSphere').then(m => ({ default: m.SmartSphere })))
import { AudioSpectrum } from '../components/panels/AudioSpectrum'
import { DiagnosisCard } from '../components/panels/DiagnosisCard'
import { AnomalyTimeline } from '../components/panels/AnomalyTimeline'
import type { HistoryPoint } from '../components/panels/AnomalyTimeline'
import { GlassPanel } from '../components/shared/GlassPanel'
import { useApiData } from '../hooks/useApiData'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'
import { useDiagnosticV2 } from '../hooks/useDiagnosticV2'
import { DiagnosisCardV2 } from '../components/diagnostics/DiagnosisCardV2'
import { RecallsPanel } from '../components/panels/RecallsPanel'
import { EscalationTimeline } from '../components/panels/EscalationTimeline'
import { CorrelationPanel } from '../components/panels/CorrelationPanel'
import { OnboardingTour } from '../components/onboarding/OnboardingTour'
import { BaselineStatus } from '../components/panels/BaselineStatus'
import { ChatPanel } from '../components/chat/ChatPanel'
import { RulesList } from '../components/diagnostics/RulesList'
import { DiagnosticSearch } from '../components/diagnostics/DiagnosticSearch'
import { SuspensionTab } from '../components/panels/SuspensionTab'
import { AudioTab } from '../components/panels/AudioTab'
import { StatusStrip } from '../components/diagnostics/StatusStrip'
import { SystemCard } from '../components/diagnostics/SystemCard'
import { SystemTabBar } from '../components/diagnostics/SystemTabBar'
import { HealthScorePanel } from '../components/diagnostics/HealthScorePanel'

const CoherenceMap = lazy(() => import('../components/panels/CoherenceMap').then(m => ({ default: m.CoherenceMap })))
const CUSUMChart = lazy(() => import('../components/panels/CUSUMChart').then(m => ({ default: m.CUSUMChart })))
const PseudoOrderPlot = lazy(() => import('../components/panels/PseudoOrderPlot').then(m => ({ default: m.PseudoOrderPlot })))

const SYSTEMS = [
  { key: 'suspension' as const, name: 'Подвеска', icon: '🛞' },
  { key: 'engine' as const, name: 'Двигатель', icon: '⚙' },
  { key: 'electrical' as const, name: 'Электрика', icon: '⚡' },
  { key: 'audio' as const, name: 'Аудио', icon: '🔊' },
]

export function Diagnostics() {
  const clientHash = useDashboardStore(s => s.clientHash)
  const timeRange = useDashboardStore(s => s.timeRange)
  const expertMode = useDashboardStore(s => s.expertMode)
  const useV2Api = useDashboardStore(s => s.useV2Api)
  const { report: v2Report, history: v2History, loading: v2Loading, error: _v2Error, sendFeedback, fetchLatest } = useDiagnosticV2(clientHash)
  const [manualLoading, setManualLoading] = useState(false)
  const [activeSystem, setActiveSystem] = useState<string | null>(null)

  // Insight collapse state
  const [openInsight, setOpenInsight] = useState<string | null>(null)
  const [diagExpanded, setDiagExpanded] = useState(false)

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

  const regime = anomaly?.regime ?? 'unknown'
  const hasData = (apiData?.accel?.length ?? 0) > 0 || (apiData?.audio?.length ?? 0) > 0
  const systems = anomaly?.systems ?? {}
  const diagnostics = anomaly?.diagnostics ?? []
  const degradation = anomaly?.degradation

  const accelData = apiData?.accel ?? []
  const audioData = apiData?.audio ?? []
  const lastAccel = accelData[accelData.length - 1] ?? {}
  const totalVib = Math.sqrt(
    (lastAccel.x_std || 0) ** 2 + (lastAccel.y_std || 0) ** 2 + (lastAccel.z_std || 0) ** 2
  )
  void totalVib // used in systemsMap severity calc

  // Build sparkline data from v2History
  const sparklines = useMemo(() => {
    if (!v2History || v2History.length === 0) return { suspension: [], engine: [], electrical: [], audio: [] }
    const last7 = v2History.slice(-7)
    return {
      suspension: last7.map(h => h.suspension_score),
      engine: last7.map(h => h.engine_score),
      electrical: last7.map(h => h.electrical_score),
      audio: last7.map(h => h.audio_score),
    }
  }, [v2History])

  // Old scores for diff
  const oldScores = useMemo(() => {
    if (!v2History || v2History.length < 2) return null
    const first = v2History[0]
    return { suspension: first.suspension_score, engine: first.engine_score, electrical: first.electrical_score, audio: first.audio_score }
  }, [v2History])

  // Systems map for 3D hotspots
  const systemsMap = useMemo(() => {
    const getScore = (key: string) => {
      const v2Score = useV2Api && v2Report ? v2Report.health_scores[key as keyof typeof v2Report.health_scores] : null
      return v2Score ?? (systems[key]?.score ?? 80)
    }
    return {
      suspension: { score: getScore('suspension'), severity: 1 - getScore('suspension') / 100 },
      engine: { score: getScore('engine'), severity: 1 - getScore('engine') / 100 },
      electrical: { score: getScore('electrical'), severity: 1 - getScore('electrical') / 100 },
      audio: { score: getScore('audio'), severity: 1 - getScore('audio') / 100 },
    }
  }, [useV2Api, v2Report, systems])

  const overallScore = useV2Api && v2Report ? v2Report.health_scores.overall : (anomaly?.overall_score ?? 0)

  const handleHotspotClick = (system: string) => {
    setActiveSystem(prev => prev === system ? null : system)
  }

  return (
    <div className="relative">
      <OnboardingTour />

      {/* ═══ ROW 0: STATUS STRIP ═══ */}
      {useV2Api && (
        <div className="mt-8">
          <StatusStrip
            report={v2Report}
            hasData={hasData}
            loading={v2Loading || manualLoading}
            clientHash={clientHash}
            onRunDiagnostic={handleRunDiagnostic}
          />
        </div>
      )}

      {/* ═══ FULL-WIDTH 3D VIEWPORT ═══ */}
      <div className="diag-viewport-full">
        {/* Left overlay: Health Score + System Cards */}
        <div className="diag-overlay-left">
          <div className="diag-overlay-panel">
            <HealthScorePanel overall={overallScore} loading={v2Loading} />
          </div>
          {SYSTEMS.map(sys => {
            const v2Score = useV2Api && v2Report ? v2Report.health_scores[sys.key] : null
            const score = v2Score ?? (systems[sys.key]?.score ?? 0)
            const trend = useV2Api && v2Report ? v2Report.health_trends[sys.key] : undefined
            return (
              <div key={sys.key} className="diag-overlay-panel" style={{ padding: '6px 10px' }}>
                <SystemCard
                  compact
                  name={sys.name}
                  icon={sys.icon}
                  score={score}
                  sparkline={sparklines[sys.key]}
                  oldScore={oldScores?.[sys.key]}
                  trend={trend}
                  onClick={() => handleHotspotClick(sys.key)}
                />
              </div>
            )
          })}
        </div>

        {/* 3D Canvas */}
        <Suspense fallback={
          <div className="flex items-center justify-center" style={{ height: '100%', color: 'rgba(0,229,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}>
            Загрузка 3D модели...
          </div>
        }>
          <DiagnosticTwinCanvas
            systems={systemsMap}
            activeSystem={activeSystem}
            onHotspotClick={handleHotspotClick}
            accelData={accelData.length > 0 ? accelData[accelData.length - 1] : null}
            audioData={audioData}
          />
        </Suspense>

        {/* Right overlay: Compact Diagnosis (collapsible) */}
        <div className="diag-overlay-right">
          <div className="diag-overlay-panel" style={{ cursor: 'pointer' }} onClick={() => setDiagExpanded(!diagExpanded)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: diagExpanded ? 8 : 0 }}>
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: theme.accent.cyan }}>ДИАГНОЗЫ</span>
              <span style={{ fontSize: 10, color: theme.accent.cyan }}>{diagExpanded ? '▾' : '▸'}</span>
            </div>
            {/* Brief: top diagnosis */}
            {!diagExpanded && v2Report?.diagnoses?.[0] && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.text.primary, fontFamily: "'Rajdhani', sans-serif" }}>
                  {v2Report.diagnoses[0].display}
                </div>
                <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif" }}>
                  {v2Report.diagnoses[0].status} · {Math.round(v2Report.diagnoses[0].confidence * 100)}%
                </div>
              </div>
            )}
            {!diagExpanded && !v2Report?.diagnoses?.[0] && diagnostics?.[0] && (
              <div style={{ marginTop: 4, fontSize: 12, color: theme.text.primary, fontFamily: "'Rajdhani', sans-serif" }}>
                {diagnostics[0].rule || 'Нет диагнозов'}
              </div>
            )}
          </div>
          {/* Expanded: full diagnosis card */}
          {diagExpanded && (
            <div className="diag-overlay-panel" style={{ marginTop: 6 }} onClick={e => e.stopPropagation()}>
              {useV2Api ? (
                <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} compact />
              ) : (
                <DiagnosisCard diagnostics={diagnostics} degradation={degradation} regime={regime} />
              )}
            </div>
          )}
        </div>

        <div className="scan-overlay" />
        {/* Link to Suspension tab over the road animation */}
        <div
          onClick={() => handleHotspotClick('suspension')}
          style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 25, cursor: 'pointer', pointerEvents: 'auto',
            fontFamily: "'Orbitron', sans-serif", fontSize: '0.55rem', letterSpacing: '0.12em',
            color: '#00e5ff', textTransform: 'uppercase' as const,
            background: 'rgba(6, 18, 30, 0.85)', backdropFilter: 'blur(8px)',
            padding: '4px 12px', borderRadius: 4,
            border: '1px solid rgba(0, 229, 255, 0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(0, 229, 255, 0.5)'; (e.target as HTMLElement).style.boxShadow = '0 0 12px rgba(0, 229, 255, 0.2)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(0, 229, 255, 0.2)'; (e.target as HTMLElement).style.boxShadow = 'none' }}
        >
          Подвеска →
        </div>
      </div>

      {/* ═══ SYSTEM TAB BAR ═══ */}
      <SystemTabBar active={activeSystem} onChange={setActiveSystem} />

      {/* ═══ DETAIL PANEL (conditional by activeSystem) ═══ */}
      <div className="grid grid-cols-12 gap-3 mt-3">

        {/* ── Обзор (default) ── */}
        {activeSystem === null && (
          <>
            {/* Timeline */}
            <div className="col-span-12">
              <AnomalyTimeline history={useV2Api ? v2HistoryAdapted : (historyData?.history ?? [])} />
            </div>

            {/* Insight cards */}
            {useV2Api && v2Report && (
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-3">
                {v2Report.escalations && v2Report.escalations.length > 0 && (
                  <div className="glass-panel" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => setOpenInsight(openInsight === 'esc' ? null : 'esc')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.text.primary }}>📈 История диагнозов</span>
                      <span style={{ fontSize: 10, color: theme.accent.cyan }}>{openInsight === 'esc' ? '▾' : '▸'}</span>
                    </div>
                    <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif" }}>
                      {v2Report.escalations.length} проблем отслеживается
                    </div>
                    {openInsight === 'esc' && (
                      <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                        <EscalationTimeline escalations={v2Report.escalations} />
                      </div>
                    )}
                  </div>
                )}
                <div className="glass-panel" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => setOpenInsight(openInsight === 'corr' ? null : 'corr')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.text.primary }}>🔗 Корреляции</span>
                    <span style={{ fontSize: 10, color: theme.accent.cyan }}>{openInsight === 'corr' ? '▾' : '▸'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif" }}>
                    Связи вибрация ↔ звук ↔ OBD
                  </div>
                  {openInsight === 'corr' && (
                    <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      <CorrelationPanel clientHash={clientHash} />
                    </div>
                  )}
                </div>
                <div className="glass-panel" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => setOpenInsight(openInsight === 'recall' ? null : 'recall')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.text.primary }}>📋 Отзывные кампании</span>
                    <span style={{ fontSize: 10, color: theme.accent.cyan }}>{openInsight === 'recall' ? '▾' : '▸'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: theme.text.muted, fontFamily: "'Rajdhani', sans-serif" }}>
                    {(v2Report.recalls?.length || 0) === 0 ? 'Не найдено' : `${v2Report.recalls!.length} найдено`}
                  </div>
                  {openInsight === 'recall' && (
                    <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      <RecallsPanel recalls={v2Report.recalls || []} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Baseline + Search + Rules */}
            {useV2Api && v2Report?.baseline_status && (
              <div className="col-span-12 lg:col-span-3">
                <BaselineStatus
                  ready={v2Report.baseline_status.ready}
                  totalSamples={v2Report.baseline_status.total_samples}
                  samplesNeeded={v2Report.baseline_status.samples_needed}
                />
              </div>
            )}
            <div className={useV2Api && v2Report?.baseline_status ? 'col-span-12 lg:col-span-4' : 'col-span-12 lg:col-span-5'}>
              <DiagnosticSearch />
            </div>
            <div className={useV2Api && v2Report?.baseline_status ? 'col-span-12 lg:col-span-5' : 'col-span-12 lg:col-span-7'}>
              <RulesList />
            </div>

            {/* Chat */}
            <div className="col-span-12">
              <ChatPanel />
            </div>
          </>
        )}

        {/* ── Подвеска ── */}
        {activeSystem === 'suspension' && (
          <>
            <div className="col-span-12 lg:col-span-6">
              <Suspense fallback={
                <GlassPanel style={{ height: 'min(420px, 55vh)' }}>
                  <div className="hud-header mb-3">Вибрация 3D</div>
                  <div className="flex items-center justify-center" style={{ height: 200, color: 'rgba(0,229,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}>Loading 3D...</div>
                </GlassPanel>
              }>
                <SmartSphere data={accelData} />
              </Suspense>
            </div>
            <div className="col-span-12 lg:col-span-6">
              <SuspensionTab accelData={accelData} />
            </div>
            <div className="col-span-12">
              <RulesList filterSystem="Подвеска" />
            </div>
          </>
        )}

        {/* ── Двигатель ── */}
        {activeSystem === 'engine' && (
          <>
            <div className="col-span-12 lg:col-span-6">
              {useV2Api ? (
                <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} />
              ) : (
                <DiagnosisCard diagnostics={diagnostics} degradation={degradation} regime={regime} />
              )}
            </div>
            <div className="col-span-12 lg:col-span-6">
              <RulesList filterSystem="Двигатель" />
            </div>
          </>
        )}

        {/* ── Электрика ── */}
        {activeSystem === 'electrical' && (
          <>
            <div className="col-span-12 lg:col-span-6">
              {useV2Api ? (
                <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} />
              ) : (
                <DiagnosisCard diagnostics={diagnostics} degradation={degradation} regime={regime} />
              )}
            </div>
            <div className="col-span-12 lg:col-span-6">
              <RulesList filterSystem="Электрика" />
            </div>
          </>
        )}

        {/* ── Аудио ── */}
        {activeSystem === 'audio' && (
          <>
            <div className="col-span-12 lg:col-span-6">
              <AudioSpectrum data={audioData} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <AudioTab data={audioData} />
            </div>
            <div className="col-span-12">
              <RulesList filterSystem="Шумы" />
            </div>
          </>
        )}

        {/* ═══ EXPERT PANELS ═══ */}
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
