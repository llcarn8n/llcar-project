import { Suspense, lazy, useState, useMemo } from 'react'
import { ActiveDiagnosesFeed } from '../components/diagnostics/ActiveDiagnosesFeed'
import { RulesPicker } from '../components/diagnostics/RulesPicker'
import { StatusBar } from '../components/diagnostics/StatusBar'
import { SystemScoreCards } from '../components/diagnostics/SystemScoreCards'
import { LiveTelemetryRibbon } from '../components/diagnostics/LiveTelemetryRibbon'

const DiagnosticTwinCanvas = lazy(() => import('../components/three/DiagnosticTwinCanvas'))
const SmartSphere = lazy(() => import('../components/three/SmartSphere').then(m => ({ default: m.SmartSphere })))
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
import { useDebouncedDiagnoses } from '../hooks/useDebouncedDiagnoses'
import { DiagnosisCardV2 } from '../components/diagnostics/DiagnosisCardV2'
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
  const { diagnoses: debouncedDiagnoses, activeCount: debouncedActive, flickeringCount: debouncedFlicker } = useDebouncedDiagnoses(v2Report?.diagnoses)
  const v2ReportDebounced = v2Report ? { ...v2Report, diagnoses: debouncedDiagnoses } : null
  const [manualLoading, setManualLoading] = useState(false)
  const [activeSystem, setActiveSystem] = useState<SystemKey | null>('suspension')
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

  // Sparklines — данные от сервера. Backend шлёт 1000 точек, фильтруем по timeRange (минуты),
  // затем downsample до ~40 точек для читаемой кривой.
  const sparklines = useMemo(() => {
    const empty = { suspension: [] as number[], engine: [] as number[], electrical: [] as number[], audio: [] as number[], overall: [] as number[] }
    if (!v2History || v2History.length === 0) return empty

    // Entries отсортированы по убыванию времени (first = новейший). Берём те, что в пределах timeRange.
    const now = Date.now()
    const cutoff = now - timeRange * 60 * 1000
    const inRange = v2History.filter(h => {
      const t = h.time ? new Date(h.time).getTime() : 0
      return t >= cutoff
    })
    const src = inRange.length >= 2 ? inRange : v2History.slice(0, 60) // fallback: последний час если timeRange узкий
    // Восходящий порядок по времени
    const ordered = [...src].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    // Downsample до 40 точек
    const target = 40
    const step = Math.max(1, Math.floor(ordered.length / target))
    const sampled = ordered.filter((_, i) => i % step === 0).slice(-target)
    return {
      suspension: sampled.map(h => h.suspension_score),
      engine: sampled.map(h => h.engine_score),
      electrical: sampled.map(h => h.electrical_score),
      audio: sampled.map(h => h.audio_score),
      overall: sampled.map(h => h.overall_score),
    }
  }, [v2History, timeRange])

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
              <MiniSparkline data={sparklines.overall} width={90} height={20} fill strokeWidth={1} />
            </div>
          </div>
        </div>
      )}

      {/* SkyOrb — погода + солнце/луна, desktop right-top, mobile ниже health panel */}
      <div className="lumen-sky-orb" style={{
        position: 'absolute',
        top: isMobile ? 68 : 64,
        right: isMobile ? 10 : 18,
        zIndex: 15,
        pointerEvents: 'auto',
      }}>
        <SkyOrb />
      </div>

      {/* Right diagnoses feed (desktop only) */}
      {!isMobile && <ActiveDiagnosesFeed report={v2ReportDebounced} onOpenRule={openRuleDrawer} activeCount={debouncedActive} flickeringCount={debouncedFlicker} />}

      {/* Rules picker — bottom-right только на десктопе (на мобиле рендерим отдельно под сценой) */}
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
            <MiniSparkline data={sparklines.overall} width={100} height={20} fill strokeWidth={1} />
          </div>
        </div>
      )}
    </NebulaPanel>
  )

  // Общий блок диагностики — добавляется во все системные табы (suspension/engine/electrical/audio)
  // под их специфичным контентом. Ничего из Обзора не теряется.
  const commonBlock = (
    <>
      <div className="col-span-12">
        {useV2Api ? (
          <DiagnosisCardV2 report={v2Report} loading={v2Loading} onFeedback={sendFeedback} clientHash={clientHash} />
        ) : (
          <DiagnosisCard diagnostics={diagnostics} degradation={degradation} regime={regime} />
        )}
      </div>
      {useV2Api && v2Report?.baseline_status && (
        <div className="col-span-12 lg:col-span-5">
          <BaselineStatus
            ready={v2Report.baseline_status.ready}
            totalSamples={v2Report.baseline_status.total_samples}
            samplesNeeded={v2Report.baseline_status.samples_needed}
          />
        </div>
      )}
      <div className={useV2Api && v2Report?.baseline_status ? 'col-span-12 lg:col-span-7' : 'col-span-12'}>
        <AnomalyTimeline history={useV2Api ? v2HistoryAdapted : (historyData?.history ?? [])} />
      </div>
      <div className="col-span-12">
        <CorrelationPanel clientHash={clientHash} />
      </div>
      {useV2Api && v2Report?.escalations && v2Report.escalations.length > 0 && (
        <div className="col-span-12">
          <EscalationTimeline escalations={v2Report.escalations} />
        </div>
      )}
      <div className="col-span-12">
        <DiagnosticSearch />
      </div>
      <div className="col-span-12">
        <ChatPanel />
      </div>
    </>
  )

  return (
    <div className="relative" style={{ margin: '-1rem -1rem 0' }}>
      <OnboardingTour />

      {PanelFull}

      {/* MOBILE: горизонтальная лента табов систем + диагнозы */}
      {isMobile && (
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '10px 12px',
          scrollbarWidth: 'none',
          background: 'var(--c-void)',
          borderBottom: '1px solid rgba(230,212,168,0.12)',
        }}>
          {(['suspension', 'engine', 'electrical', 'audio'] as SystemKey[]).map((key) => {
            const label = { suspension: 'ПОДВЕСКА', engine: 'ДВИГАТЕЛЬ', electrical: 'ЭЛЕКТРИКА', audio: 'АУДИО' }[key]
            const val = getScore(key)
            const active = activeSystem === key
            const dotColor = val == null ? 'rgba(184,190,199,0.35)'
              : val >= 80 ? '#6BE08F'
              : val >= 50 ? '#E0B46B'
              : '#FF4A4A'
            return (
              <button
                key={key}
                onClick={() => setActiveSystem(key)}
                style={{
                  flexShrink: 0,
                  minWidth: 96,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 4,
                  background: active ? 'rgba(200,180,142,0.14)' : 'transparent',
                  boxShadow: active ? 'inset 2px 0 0 0 #E6D4A8' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 7, fontFamily: 'var(--f-body)', fontWeight: 700,
                  color: active ? '#F8ECC8' : '#E6D4A8',
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                }}>
                  <span aria-hidden style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: dotColor,
                    boxShadow: `0 0 3px ${dotColor}`,
                    flexShrink: 0,
                  }} />
                  {label}
                </span>
                <span style={{
                  fontSize: 14, fontFamily: 'var(--f-mono)', fontWeight: 400,
                  color: val == null ? 'var(--c-spectral-muted)' : (active ? '#FFFFFF' : '#EFF2F7'),
                  lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                }}>{val == null ? '—' : val}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* MOBILE: компактная панель диагнозов */}
      {isMobile && (v2ReportDebounced?.diagnoses?.length ?? 0) > 0 && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--c-void)',
          borderBottom: '1px solid rgba(230,212,168,0.12)',
        }}>
          <div style={{
            fontSize: 8, fontFamily: 'var(--f-display)', fontWeight: 700,
            color: '#F2E4C2', letterSpacing: '0.28em', textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Диагнозы · {debouncedActive ?? v2ReportDebounced?.diagnoses?.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {v2ReportDebounced?.diagnoses?.slice(0, 5).map((d, i) => {
              const conf = Math.round((d.confidence ?? 0) > 1 ? (d.confidence ?? 0) : (d.confidence ?? 0) * 100)
              const sevColor = conf >= 70 ? '#FF4A4A' : conf >= 40 ? '#E0B46B' : '#6BE08F'
              const ruleName = d.rule_name
              return (
                <div key={i}
                  onClick={() => ruleName && openRuleDrawer(ruleName)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '6px 0',
                    borderBottom: '1px solid var(--c-spectral-divider)',
                    cursor: ruleName ? 'pointer' : 'default',
                  }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: sevColor,
                    marginTop: 6, flexShrink: 0,
                    boxShadow: `0 0 4px ${sevColor}`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--f-display)', color: '#B8BEC7', lineHeight: 1.3 }}>
                      {d.display || ruleName || 'Диагноз'}
                    </div>
                    <div style={{ fontSize: 8, fontFamily: 'var(--f-mono)', color: 'var(--c-spectral-faint)', letterSpacing: '0.06em' }}>
                      {d.status ?? ''} {d.status ? '·' : ''} {conf}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MOBILE: RulesPicker после диагнозов */}
      {isMobile && (
        <div style={{ padding: '10px 12px', background: 'var(--c-void)', borderBottom: '1px solid rgba(230,212,168,0.12)' }}>
          <RulesPicker onOpenRule={openRuleDrawer} />
        </div>
      )}

      <div className="road-underlay grid grid-cols-12 gap-3" style={{ padding: '1rem' }}>
        {activeSystem === null && (
          <>
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
              </div>
            )}

            <div className="col-span-12 lg:col-span-4">
              <DiagnosticSearch />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <RulesList />
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
            {commonBlock}
          </>
        )}

        {activeSystem === 'engine' && (
          <>
            <div className="col-span-12">
              <RulesList filterSystem="Двигатель" />
            </div>
            {commonBlock}
          </>
        )}

        {activeSystem === 'electrical' && (
          <>
            <div className="col-span-12">
              <RulesList filterSystem="Электрика" />
            </div>
            {commonBlock}
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
            {commonBlock}
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
