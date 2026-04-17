import { Suspense, lazy, useState, useMemo } from 'react'
import { ActiveDiagnosesFeed } from '../components/diagnostics/ActiveDiagnosesFeed'

const DiagnosticTwinCanvas = lazy(() => import('../components/three/DiagnosticTwinCanvas'))
const SmartSphere = lazy(() => import('../components/three/SmartSphere').then(m => ({ default: m.SmartSphere })))
const VehicleInfo = lazy(() => import('./VehicleInfo').then(m => ({ default: m.VehicleInfo })))
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
import { CanvasOverlayHUD } from '../components/diagnostics/CanvasOverlayHUD'
import PartTooltip from '../components/three/PartTooltip'

// V3 LUMEN primitives
import { NebulaPanel } from '../components/ui/NebulaPanel'
import { GhostButton } from '../components/ui/GhostButton'
import { MiniSparkline } from '../components/ui/MiniSparkline'
import { SkyOrb } from '../components/ui/SkyOrb'

const CoherenceMap = lazy(() => import('../components/panels/CoherenceMap').then(m => ({ default: m.CoherenceMap })))
const CUSUMChart = lazy(() => import('../components/panels/CUSUMChart').then(m => ({ default: m.CUSUMChart })))
const PseudoOrderPlot = lazy(() => import('../components/panels/PseudoOrderPlot').then(m => ({ default: m.PseudoOrderPlot })))
const RuleDetailDrawer = lazy(() => import('../components/diagnostics/RuleDetailDrawer'))

type SystemKey = 'suspension' | 'engine' | 'electrical' | 'audio'

const SYSTEMS: { key: SystemKey; name: string; short: string }[] = [
  { key: 'suspension', name: 'Подвеска',  short: 'ПОДВ' },
  { key: 'engine',     name: 'Двигатель', short: 'ДВС'  },
  { key: 'electrical', name: 'Электрика', short: 'ЭЛЕК' },
  { key: 'audio',      name: 'Аудио',     short: 'АУД'  },
]

const TIME_PILLS = [
  { label: '1ч',  val: 60 },
  { label: '24ч', val: 1440 },
  { label: '7д',  val: 10080 },
  { label: '30д', val: 43200 },
]

function statusFromScore(score: number): string {
  if (score >= 80) return 'NORMAL'
  if (score >= 60) return 'DEGRADED'
  return 'CRITICAL'
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

  // getScore with clamp [0,100] — защита от -1 sentinel из старого API
  const getScore = (key: SystemKey): number | null => {
    const v2Score = useV2Api && v2Report ? v2Report.health_scores[key] : null
    const raw = v2Score ?? systems[key]?.score
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null
    return Math.max(0, Math.min(100, Math.round(raw)))
  }

  const systemsMap = useMemo(() => {
    const scoreOr = (k: SystemKey) => getScore(k) ?? 100
    return {
      suspension: { score: scoreOr('suspension'), severity: 1 - scoreOr('suspension') / 100 },
      engine:     { score: scoreOr('engine'),     severity: 1 - scoreOr('engine') / 100 },
      electrical: { score: scoreOr('electrical'), severity: 1 - scoreOr('electrical') / 100 },
      audio:      { score: scoreOr('audio'),      severity: 1 - scoreOr('audio') / 100 },
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useV2Api, v2Report, systems])

  const overallScoreRaw = useV2Api && v2Report ? v2Report.health_scores.overall : (anomaly?.overall_score ?? 0)
  const overallScore = typeof overallScoreRaw === 'number' && Number.isFinite(overallScoreRaw) && overallScoreRaw >= 0
    ? Math.max(0, Math.min(100, Math.round(overallScoreRaw)))
    : 0
  const statusLabel = statusFromScore(overallScore)

  const handleHotspotClick = (system: string) => {
    setActiveSystem(prev => prev === system ? null : (system as SystemKey))
  }

  const PanelFull = (
    <NebulaPanel coolHalo="bl" warmHalo="tr" style={{ position: 'relative', overflow: 'hidden', height: 'calc(100vh - 96px)', borderRadius: 0, minHeight: 560 }}>
      {/* 3D canvas */}
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--c-spectral-muted)', fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.18em' }}>
          LOADING 3D...
        </div>
      }>
        <DiagnosticTwinCanvas
          systems={systemsMap}
          activeSystem={activeSystem}
          onHotspotClick={handleHotspotClick}
          accelData={accelData.length > 0 ? accelData[accelData.length - 1] : null}
        />
      </Suspense>

      {/* Bottom telemetry ribbon */}
      <CanvasOverlayHUD pids={apiData?.pids} />

      {/* Part hover tooltip */}
      <PartTooltip />

      {/* Rule detail drawer */}
      <Suspense fallback={null}>
        <RuleDetailDrawer />
      </Suspense>

      {/* Top time-strip: time-pills + can_drive on LEFT, vehicle/online/date on RIGHT */}
      <div className="lumen-time-strip" style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        borderBottom: '1px solid var(--c-spectral-divider)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto', flexWrap: 'nowrap' }}>
          {/* Time-pills — single row, no wrap */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
            {TIME_PILLS.map(p => (
              <GhostButton
                key={p.val}
                active={timeRange === p.val}
                onClick={() => setTimeRange(p.val)}
                variant="pill"
                size="sm"
                style={{ padding: '3px 10px', fontSize: 10, flex: '0 0 auto' }}
              >
                {p.label}
              </GhostButton>
            ))}
          </div>

          {/* can_drive pill */}
          {v2Report?.can_drive && (() => {
            const driveMap = {
              safe: { label: 'МОЖНО ЕХАТЬ', color: '#6BE08F' },
              caution: { label: 'ОСТОРОЖНО', color: '#E0B46B' },
              stop: { label: 'СТОП', color: '#E06B6B' },
            } as const
            const drive = driveMap[v2Report.can_drive]
            return (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--f-body)', fontSize: 9, fontWeight: 600,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: drive.color,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: drive.color,
                  boxShadow: `0 0 6px ${drive.color}`,
                  animation: v2Report.can_drive === 'stop' ? 'canDrivePulse 1.4s ease-in-out infinite' : 'none',
                }} />
                {drive.label}
              </span>
            )
          })()}
          <style>{`
            @keyframes canDrivePulse {
              0%, 100% { box-shadow: 0 0 6px currentColor; opacity: 1; }
              50% { box-shadow: 0 0 12px currentColor; opacity: 0.7; }
            }
          `}</style>
        </div>

        {/* Right cluster: date readout + online indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
          {(() => {
            const isOnline = (apiData?.pids?.length ?? 0) > 0
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: isOnline ? theme.status.ok : theme.text.muted,
                  boxShadow: isOnline ? `0 0 6px ${theme.status.ok}` : 'none',
                  animation: isOnline ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                }} />
                <span style={{
                  fontSize: 9, fontFamily: 'var(--f-body)',
                  color: 'var(--c-spectral-faint)',
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                }}>{isOnline ? 'Онлайн' : 'Офлайн'}</span>
              </div>
            )
          })()}
          <div style={{
            fontSize: 9, fontFamily: 'var(--f-mono)',
            color: 'var(--c-spectral-faint)', letterSpacing: '0.12em',
          }}>
            {(() => {
              const now = new Date()
              const from = new Date(now.getTime() - timeRange * 60 * 1000)
              const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
              return `${fmt(from)} — ${fmt(now)}`
            })()}
          </div>
        </div>
      </div>

      {/* System tabs top-center */}
      <div className="lumen-system-tabs" style={{
        position: 'absolute',
        top: 44,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        background: 'transparent',
      }}>
        {([
          { key: null as SystemKey | null, label: 'ОБЗОР', value: overallScore as number | null, series: sparklines.overall },
          ...SYSTEMS.map(s => ({ key: s.key as SystemKey | null, label: s.short, value: getScore(s.key), series: sparklines[s.key] })),
        ]).map((t, i) => {
          const active = activeSystem === t.key
          return (
            <button
              key={t.label}
              onClick={() => setActiveSystem(t.key)}
              style={{
                position: 'relative',
                minWidth: 118,
                padding: '10px 18px 12px',
                border: 'none',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(200,180,142,0.22)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 5,
                background: active ? 'rgba(200,180,142,0.10)' : 'transparent',
                boxShadow: active
                  ? 'inset 0 -2px 0 0 #E6D4A8, 0 0 22px rgba(200,180,142,0.18)'
                  : 'none',
                transition: 'background 160ms var(--ease-hud), box-shadow 160ms var(--ease-hud)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(200,180,142,0.05)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{
                fontSize: 9,
                fontFamily: 'var(--f-body)',
                fontWeight: 700,
                color: active ? '#F8ECC8' : '#E6D4A8',
                textTransform: 'uppercase',
                letterSpacing: '0.26em',
                lineHeight: 1,
                textShadow: active
                  ? '0 0 12px rgba(230,212,168,0.7), 0 0 4px rgba(230,212,168,0.4)'
                  : '0 0 6px rgba(230,212,168,0.35)',
              }}>{t.label}</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <span style={{
                  fontSize: 16,
                  fontFamily: 'var(--f-mono)',
                  fontWeight: 400,
                  color: t.value == null ? 'var(--c-spectral-muted)' : (active ? '#FFFFFF' : '#EFF2F7'),
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: active ? '0 0 10px rgba(239,242,247,0.45)' : '0 0 4px rgba(239,242,247,0.20)',
                }}>{t.value == null ? '—' : t.value}</span>
                <MiniSparkline data={t.series} width={44} height={12} />
              </div>
            </button>
          )
        })}
      </div>

      {/* HEALTH SCORE — left overlay */}
      <div className="lumen-health-hud" style={{
        position: 'absolute', top: 56, left: 18, zIndex: 15,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none',
        width: 220,
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
        <span style={microLabel}>HEALTH SCORE</span>
        <div style={{ marginTop: 4 }}>
          <span style={microLabel}>24Ч</span>
          <div style={{ marginTop: 4 }}>
            <MiniSparkline data={sparklines.overall} width={200} height={24} fill />
          </div>
        </div>
      </div>

      {/* SkyOrb — LEFT, just to the right of HEALTH SCORE column (HS column: left 18, width 220 → right edge ~238; orb at left 250) */}
      <div className="lumen-sky-orb" style={{
        position: 'absolute', top: 64, left: 250, zIndex: 15,
        pointerEvents: 'auto',
      }}>
        <SkyOrb />
      </div>

      {/* Right diagnoses feed */}
      <ActiveDiagnosesFeed report={v2Report} onOpenRule={openRuleDrawer} />
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
