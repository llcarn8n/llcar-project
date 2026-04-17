import { Suspense, lazy, useState, useMemo } from 'react'
import { ActiveDiagnosesFeed } from '../components/diagnostics/ActiveDiagnosesFeed'
import { RulesPicker } from '../components/diagnostics/RulesPicker'
import { StatusBar } from '../components/diagnostics/StatusBar'
import { SystemScoreCards } from '../components/diagnostics/SystemScoreCards'
import { LiveTelemetryRibbon } from '../components/diagnostics/LiveTelemetryRibbon'

const DiagnosticTwinCanvas = lazy(() => import('../components/three/DiagnosticTwinCanvas'))
const SmartSphere = lazy(() => import('../components/three/SmartSphere').then(m => ({ default: m.SmartSphere })))
const VehicleInfo = lazy(() => import('./VehicleInfo').then(m => ({ default: m.VehicleInfo })))
import { AudioSpectrum } from '../components/panels/AudioSpectrum'
import { DiagnosisCard } from '../components/panels/DiagnosisCard'
import { AnomalyTimeline } from '../components/panels/AnomalyTimeline'
import type { HistoryPoint } from '../components/panels/AnomalyTimeline'
import { GlassPanel } from '../components/shared/GlassPanel'
import { useApiData } from '../hooks/useApiData'
import { useIsMobile } from '../hooks/useIsMobile'
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
import PartTooltip from '../components/three/PartTooltip'

// V3 LUMEN primitives
import { NebulaPanel } from '../components/ui/NebulaPanel'
import { MiniSparkline } from '../components/ui/MiniSparkline'
import { SkyOrb } from '../components/ui/SkyOrb'

const CoherenceMap = lazy(() => import('../components/panels/CoherenceMap').then(m => ({ default: m.CoherenceMap })))
const CUSUMChart = lazy(() => import('../components/panels/CUSUMChart').then(m => ({ default: m.CUSUMChart })))
const PseudoOrderPlot = lazy(() => import('../components/panels/PseudoOrderPlot').then(m => ({ default: m.PseudoOrderPlot })))
const RuleDetailDrawer = lazy(() => import('../components/diagnostics/RuleDetailDrawer'))

type SystemKey = 'suspension' | 'engine' | 'electrical' | 'audio'

function statusFromScore(score: number): string {
  if (score >= 80) return 'НОРМА'
  if (score >= 60) return 'УХУДШЕНО'
  return 'КРИТИЧНО'
}

function timeRangeLabel(minutes: number): string {
  if (minutes <= 60) return '1Ч'
  if (minutes <= 1440) return '24Ч'
  if (minutes <= 10080) return '7Д'
  return '30Д'
}

const microLabel: React.CSSProperties = {
  fontFamily: 'var(--f-body)',
  fontSize: 9,
  fontWeight: 600,
  color: '#E6D4A8',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  textShadow: '0 0 10px rgba(200,180,142,0.35), 0 0 2px rgba(200,180,142,0.25)',
}

export function Diagnostics() {
  const clientHash = useDashboardStore(s => s.clientHash)
  const timeRange = useDashboardStore(s => s.timeRange)
  const setTimeRange = useDashboardStore(s => s.setTimeRange)
  const expertMode = useDashboardStore(s => s.expertMode)
  const useV2Api = useDashboardStore(s => s.useV2Api)
  const openRuleDrawer = useDashboardStore(s => s.openRuleDrawer)
  const vehicleProfile = useDashboardStore(s => s.vehicleProfile)
  const resetVehicle = useDashboardStore(s => s.resetVehicle)
  const { report: v2Report, history: v2History, loading: v2Loading, error: _v2Error, sendFeedback, fetchLatest } = useDiagnosticV2(clientHash, timeRange)
  const [manualLoading, setManualLoading] = useState(false)
  const [activeSystem, setActiveSystem] = useState<SystemKey | null>(null)
  const [openInsight, setOpenInsight] = useState<string | null>(null)

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
  void handleRunDiagnostic
  void manualLoading

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
  const systems = anomaly?.systems ?? {}
  const diagnostics = anomaly?.diagnostics ?? []
  const degradation = anomaly?.degradation

  const accelData = apiData?.accel ?? []
  const audioData = apiData?.audio ?? []

  // Sparklines
  const sparklines = useMemo(() => {
    const empty = { suspension: [] as number[], engine: [] as number[], electrical: [] as number[], audio: [] as number[], overall: [] as number[] }
    if (!v2History || v2History.length === 0) return empty
    const last7 = v2History.slice(-7)
    return {
      suspension: last7.map(h => h.suspension_score),
      engine: last7.map(h => h.engine_score),
      electrical: last7.map(h => h.electrical_score),
      audio: last7.map(h => h.audio_score),
      overall: last7.map(h => h.overall_score),
    }
  }, [v2History])

  // getScore with clamp [0,100] — защита от -1 sentinel из старого API.
  // Для electrical/audio 0 трактуется как «нет данных» когда нет OBD/микрофона —
  // бэкенд не умеет отличать «нулевое здоровье» от «не замеряли».
  const getScore = (key: SystemKey): number | null => {
    const v2Score = useV2Api && v2Report ? v2Report.health_scores[key] : null
    const raw = v2Score ?? systems[key]?.score
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null
    if (raw === 0) {
      const ds = v2Report?.data_source
      if (key === 'electrical' && ds && !ds.has_obd) return null
      if (key === 'audio' && ds && !ds.has_audio) return null
      if (key === 'electrical' || key === 'audio') return null
    }
    return Math.max(0, Math.min(100, Math.round(raw)))
  }

  const overallScoreRaw = useV2Api && v2Report ? v2Report.health_scores.overall : (anomaly?.overall_score ?? 0)
  const overallScore = typeof overallScoreRaw === 'number' && Number.isFinite(overallScoreRaw) && overallScoreRaw >= 0
    ? Math.max(0, Math.min(100, Math.round(overallScoreRaw)))
    : 0
  const statusLabel = statusFromScore(overallScore)
  const isMobile = useIsMobile()

  const PanelFull = (
    <NebulaPanel coolHalo="bl" warmHalo="tr" style={{ position: 'relative', overflow: 'hidden', height: isMobile ? 460 : 'calc(100vh - 96px)', borderRadius: 0, minHeight: isMobile ? 380 : 560 }}>
      {/* 3D canvas */}
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--c-spectral-muted)', fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.18em' }}>
          LOADING 3D...
        </div>
      }>
        <DiagnosticTwinCanvas
          activeSystem={activeSystem}
          accelData={accelData.length > 0 ? accelData[accelData.length - 1] : null}
        />
      </Suspense>

      {/* Bottom telemetry ribbon (desktop only) */}
      {!isMobile && <LiveTelemetryRibbon pids={apiData?.pids} />}

      {/* Part hover tooltip */}
      <PartTooltip />

      {/* Rule detail drawer (desktop only) */}
      {!isMobile && (
        <Suspense fallback={null}>
          <RuleDetailDrawer />
        </Suspense>
      )}

      {/* Top time-strip (desktop only — на мобиле в под-канвас стэк) */}
      {!isMobile && (
        <StatusBar
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          canDrive={v2Report?.can_drive}
          vehicleProfile={vehicleProfile}
          onResetVehicle={resetVehicle}
          isOnline={(apiData?.pids?.length ?? 0) > 0}
        />
      )}

      {/* System tabs top-center (desktop only) */}
      {!isMobile && (
        <SystemScoreCards
          overallScore={overallScore}
          getScore={getScore}
          sparklines={sparklines}
          activeSystem={activeSystem}
          setActiveSystem={setActiveSystem}
        />
      )}

      {/* HEALTH SCORE — left overlay (desktop only) */}
      {!isMobile && (
        <div className="lumen-health-hud" style={{
          position: 'absolute', top: 56, left: 8, zIndex: 15,
          display: 'flex', flexDirection: 'column', gap: 10,
          alignItems: 'center', textAlign: 'center',
          pointerEvents: 'none',
          width: 170,
        }}>
          <span style={microLabel}>{statusLabel}</span>
          <span style={{
            fontFamily: 'var(--f-display)',
            fontSize: 108,
            fontWeight: 100,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            color: '#F2E4C2',
            textShadow: '0 0 24px rgba(200,180,142,0.40), 0 0 6px rgba(200,180,142,0.30)',
            fontVariantNumeric: 'tabular-nums',
          }}>{overallScore}</span>
          <span style={microLabel}>ЗДОРОВЬЕ</span>
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={microLabel}>{timeRangeLabel(timeRange)}</span>
            <div style={{ marginTop: 4 }}>
              <MiniSparkline data={sparklines.overall} width={150} height={24} fill />
            </div>
          </div>
        </div>
      )}

      {/* SkyOrb (desktop only) */}
      {!isMobile && (
        <div className="lumen-sky-orb" style={{
          position: 'absolute', top: 64, right: 18, zIndex: 15,
          pointerEvents: 'auto',
        }}>
          <SkyOrb />
        </div>
      )}

      {/* Right diagnoses feed (desktop only) */}
      {!isMobile && <ActiveDiagnosesFeed report={v2Report} onOpenRule={openRuleDrawer} />}

      {/* Rules picker — bottom-right corner (desktop only) */}
      {!isMobile && <RulesPicker onOpenRule={openRuleDrawer} />}

      {/* MOBILE: компактная подпись health + system tabs над канвасом */}
      {isMobile && (
        <div style={{
          position: 'absolute', top: 8, left: 8, right: 8, zIndex: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(10,11,22,0.55)',
          border: '1px solid var(--c-spectral-divider)',
          borderRadius: 6,
          backdropFilter: 'blur(6px)',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...microLabel, fontSize: 8 }}>{statusLabel}</span>
            <span style={{
              fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 200,
              lineHeight: 1, color: '#F2E4C2',
              textShadow: '0 0 12px rgba(200,180,142,0.40)',
              fontVariantNumeric: 'tabular-nums',
            }}>{overallScore}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
            <span style={{ ...microLabel, fontSize: 8 }}>ЗДОРОВЬЕ · {timeRangeLabel(timeRange)}</span>
            <MiniSparkline data={sparklines.overall} width={100} height={20} fill />
          </div>
        </div>
      )}
    </NebulaPanel>
  )

  return (
    <div className="relative" style={{ margin: '-1rem -1rem 0' }}>
      <OnboardingTour />

      {PanelFull}

      <div className="grid grid-cols-12 gap-3" style={{ padding: '1rem' }}>
        {activeSystem === null && (
          <>
            <div className="col-span-12">
              <Suspense fallback={null}>
                <VehicleInfo />
              </Suspense>
            </div>

            <div className="col-span-12">
              {useV2Api ? (
                <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} />
              ) : (
                <DiagnosisCard diagnostics={diagnostics} degradation={degradation} regime={regime} />
              )}
            </div>

            <div className="col-span-12 lg:col-span-5">
              {useV2Api && v2Report?.baseline_status && (
                <BaselineStatus
                  ready={v2Report.baseline_status.ready}
                  totalSamples={v2Report.baseline_status.total_samples}
                  samplesNeeded={v2Report.baseline_status.samples_needed}
                />
              )}
            </div>
            <div className="col-span-12 lg:col-span-7">
              <AnomalyTimeline history={useV2Api ? v2HistoryAdapted : (historyData?.history ?? [])} />
            </div>

            {useV2Api && v2Report && (
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-3">
                {v2Report.escalations && v2Report.escalations.length > 0 && (
                  <div className="glass-panel" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => setOpenInsight(openInsight === 'esc' ? null : 'esc')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontFamily: 'var(--f-body)', fontWeight: 600, color: theme.text.primary }}>История диагнозов</span>
                      <span style={{ fontSize: 10, color: theme.accent.cyan }}>{openInsight === 'esc' ? '▾' : '▸'}</span>
                    </div>
                    {openInsight === 'esc' && <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}><EscalationTimeline escalations={v2Report.escalations} /></div>}
                  </div>
                )}
                <div className="glass-panel" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => setOpenInsight(openInsight === 'corr' ? null : 'corr')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--f-body)', fontWeight: 600, color: theme.text.primary }}>Корреляции</span>
                    <span style={{ fontSize: 10, color: theme.accent.cyan }}>{openInsight === 'corr' ? '▾' : '▸'}</span>
                  </div>
                  {openInsight === 'corr' && <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}><CorrelationPanel clientHash={clientHash} /></div>}
                </div>
                <div className="glass-panel" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => setOpenInsight(openInsight === 'recall' ? null : 'recall')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--f-body)', fontWeight: 600, color: theme.text.primary }}>Отзывные</span>
                    <span style={{ fontSize: 10, color: theme.accent.cyan }}>{openInsight === 'recall' ? '▾' : '▸'}</span>
                  </div>
                  {openInsight === 'recall' && <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}><RecallsPanel recalls={v2Report.recalls || []} /></div>}
                </div>
              </div>
            )}

            <div className="col-span-12 lg:col-span-4">
              <DiagnosticSearch />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <RulesList />
            </div>

            <div className="col-span-12">
              <ChatPanel />
            </div>
          </>
        )}

        {activeSystem === 'suspension' && (
          <>
            <div className="col-span-12">
              <SuspensionTab accelData={accelData} />
            </div>
            <div className="col-span-12 lg:col-span-12">
              <Suspense fallback={
                <GlassPanel style={{ height: 'min(400px, 50vh)' }}>
                  <div className="flex items-center justify-center" style={{ height: 200, color: 'var(--c-amber)', fontSize: 12, fontFamily: 'var(--f-mono)' }}>Loading 3D...</div>
                </GlassPanel>
              }>
                <SmartSphere data={accelData} />
              </Suspense>
            </div>
            <div className="col-span-12">
              <RulesList filterSystem="Подвеска" />
            </div>
          </>
        )}

        {activeSystem === 'engine' && (
          <>
            <div className="col-span-12">
              {useV2Api ? (
                <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} />
              ) : (
                <DiagnosisCard diagnostics={diagnostics} degradation={degradation} regime={regime} />
              )}
            </div>
            <div className="col-span-12">
              <RulesList filterSystem="Двигатель" />
            </div>
          </>
        )}

        {activeSystem === 'electrical' && (
          <>
            <div className="col-span-12">
              {useV2Api ? (
                <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} />
              ) : (
                <DiagnosisCard diagnostics={diagnostics} degradation={degradation} regime={regime} />
              )}
            </div>
            <div className="col-span-12">
              <RulesList filterSystem="Электрика" />
            </div>
          </>
        )}

        {activeSystem === 'audio' && (
          <>
            <div className="col-span-12">
              <AudioTab data={audioData} />
            </div>
            <div className="col-span-12">
              <AudioSpectrum data={audioData} />
            </div>
            <div className="col-span-12">
              <RulesList filterSystem="Шумы" />
            </div>
          </>
        )}

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
