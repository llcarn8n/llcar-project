import React, { Suspense } from 'react'
import { RPMPanel, SpeedPanel, CoolantVoltagePanel, VibrationPanel } from '../components/panels/InstrumentCard'
import { GlassPanel } from '../components/shared/GlassPanel'
import { HealthBar } from '../components/shared/HealthBar'
import { StatusBadge } from '../components/shared/StatusBadge'

const DigitalTwinCanvas = React.lazy(() => import('../components/three/DigitalTwinCanvas'))
import { StatusPills } from '../components/shared/StatusPills'
import { WeatherWidget } from '../components/shared/WeatherWidget'
import { useApiData } from '../hooks/useApiData'
import { useDiagnosticV2 } from '../hooks/useDiagnosticV2'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'

export function Dashboard() {
  const { clientHash, timeRange, setTimeRange } = useDashboardStore()
  const navigate = useNavigate()
  const { report: v2Report, history: v2History, loading: v2Loading } = useDiagnosticV2(clientHash)

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

  // Prefer V2 health scores (fixes Электрика -1 bug)
  const v2Overall = v2Report?.health_scores?.overall
  const overall = v2Loading ? -1 : (v2Overall ?? anomaly?.overall ?? -1)
  // Trend data for health delta indicator
  const v2Trends = v2Report?.health_trends
  const overallTrend = v2Trends?.overall as string | undefined
  const regime = anomaly?.regime ?? 'unknown'
  const hasData = (apiData?.accel?.length ?? 0) > 0 || (apiData?.pids?.length ?? 0) > 0
  const isOffline = !hasData && overall <= 0 && regime === 'unknown'
  const status = isOffline ? 'offline' : overall >= 80 ? 'ok' : overall >= 50 ? 'warning' : overall <= 0 ? (hasData ? 'warning' : 'unknown') : 'critical'
  const systems = anomaly?.systems ?? {}
  const v2Scores = v2Report?.health_scores
  const diagnostics = v2Report?.diagnoses ?? anomaly?.diagnostics ?? []
  const topDiag = diagnostics.find((d: any) => d.confidence >= 40)

  // Health score delta: compare current overall with previous history entry
  const healthDelta = (() => {
    if (!v2History || v2History.length < 2 || overall < 0) return null
    const prev = v2History[v2History.length - 2]
    if (!prev || prev.overall_score <= 0) return null
    return overall - prev.overall_score
  })()

  // Latest PID values
  const pids = apiData?.pids ?? []
  const lastPid = pids[pids.length - 1] ?? {}
  const accel = apiData?.accel ?? []
  const lastAccel = accel[accel.length - 1] ?? {}
  const totalVib = Math.sqrt(
    (lastAccel.x_std || 0) ** 2 + (lastAccel.y_std || 0) ** 2 + (lastAccel.z_std || 0) ** 2
  )

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Alert bar */}
      {topDiag && (
        <div className="col-span-12">
          <GlassPanel className="!border-l-4 flex items-center gap-3" style={{ borderLeftColor: theme.status.warning }}>
            <StatusBadge status="warning" />
            <span className="text-sm font-mono text-white/80">
              {topDiag.display} — confidence {topDiag.confidence}%
            </span>
          </GlassPanel>
        </div>
      )}

      {/* Health Score */}
      <div className="col-span-3">
        <GlassPanel className="text-center health-accent">
          <div className="hud-header mb-2">Здоровье авто</div>
          {/* Circular health ring */}
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 8px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={isOffline ? 'rgba(255,255,255,0.15)' : status === 'ok' ? '#00E676' : status === 'warning' ? '#FFAB00' : '#FF1744'}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={isOffline ? '0 264' : `${(overall >= 0 ? overall : 0) * 2.64} 264`}
                style={{ filter: isOffline ? 'none' : `drop-shadow(0 0 6px ${status === 'ok' ? '#00E676' : status === 'warning' ? '#FFAB00' : '#FF1744'})`, transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="stat-value" style={{ fontSize: 28, color: isOffline ? 'rgba(255,255,255,0.3)' : status === 'ok' ? '#00E676' : status === 'warning' ? '#FFAB00' : '#FF1744', textShadow: isOffline ? 'none' : '0 0 10px currentColor' }}>
                {isOffline ? '--' : overall >= 0 ? overall : '\u2014'}
              </span>
            </div>
          </div>
          <StatusBadge status={status} />
          {/* Health delta indicator */}
          {!isOffline && (healthDelta !== null || overallTrend) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 4,
            }}>
              {healthDelta !== null && (
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: healthDelta > 0
                    ? 'var(--status-ok)'
                    : healthDelta < 0
                    ? 'var(--status-critical)'
                    : 'var(--text-muted)',
                  textShadow: healthDelta !== 0
                    ? `0 0 6px ${healthDelta > 0 ? 'var(--status-ok)' : 'var(--status-critical)'}60`
                    : 'none',
                }}>
                  {healthDelta > 0 ? '+' : ''}{healthDelta}
                </span>
              )}
              {overallTrend && (
                <span style={{
                  fontSize: 16,
                  color: overallTrend === '\u2191'
                    ? 'var(--status-ok)'
                    : overallTrend === '\u2193'
                    ? 'var(--status-critical)'
                    : 'var(--accent-cyan)',
                  textShadow: overallTrend !== '\u2192'
                    ? `0 0 8px ${overallTrend === '\u2191' ? 'var(--status-ok)' : 'var(--status-critical)'}50`
                    : 'none',
                  lineHeight: 1,
                }}>
                  {overallTrend}
                </span>
              )}
            </div>
          )}
          {!isOffline && (healthDelta !== null || overallTrend) && (
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: 2,
              letterSpacing: '0.05em',
            }}>
              vs предыдущий замер
            </div>
          )}
          {isOffline && (
            <div className="text-xs font-mono mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Двигатель выкл</div>
          )}
          <div className="mt-4 space-y-2">
            <HealthBar score={v2Loading ? 0 : (v2Scores?.suspension ?? systems.suspension?.score ?? 0)} label={'\u041F\u043E\u0434\u0432\u0435\u0441\u043A\u0430'} />
            <HealthBar score={v2Loading ? 0 : (v2Scores?.engine ?? systems.engine?.score ?? 0)} label={'\u0414\u0432\u0438\u0433\u0430\u0442\u0435\u043B\u044C'} />
            <HealthBar score={v2Loading ? 0 : (v2Scores?.electrical ?? systems.electrical?.score ?? 0)} label={'\u042D\u043B\u0435\u043A\u0442\u0440\u0438\u043A\u0430'} />
            <HealthBar score={v2Loading ? 0 : (v2Scores?.audio ?? systems.audio?.score ?? 0)} label={'\u0410\u0443\u0434\u0438\u043E'} />
          </div>
          {(() => {
            const sysScores = {
              suspension: v2Loading ? 0 : (v2Scores?.suspension ?? systems.suspension?.score ?? 0),
              engine: v2Loading ? 0 : (v2Scores?.engine ?? systems.engine?.score ?? 0),
              electrical: v2Loading ? 0 : (v2Scores?.electrical ?? systems.electrical?.score ?? 0),
              audio: v2Loading ? 0 : (v2Scores?.audio ?? systems.audio?.score ?? 0),
            }
            const getStatus = (score: number) => isOffline && score === 0 ? 'offline' as const : score >= 80 ? 'ok' as const : score >= 50 ? 'warning' as const : 'critical' as const
            return (
              <StatusPills systems={[
                { name: '\u041F\u043E\u0434\u0432.', score: sysScores.suspension, status: getStatus(sysScores.suspension) },
                { name: '\u0414\u0432\u0438\u0433.', score: sysScores.engine, status: getStatus(sysScores.engine) },
                { name: '\u042D\u043B\u0435\u043A\u0442.', score: sysScores.electrical, status: getStatus(sysScores.electrical) },
                { name: '\u0410\u0443\u0434\u0438\u043E', score: sysScores.audio, status: getStatus(sysScores.audio) },
              ]} />
            )
          })()}
        </GlassPanel>
      </div>

      {/* 3D Digital Twin */}
      <div className="col-span-9">
        <GlassPanel className="!p-0 overflow-hidden relative holographic-projector holo-sheen" style={{ height: 380 }}>
          <div className="absolute top-3 left-3 z-10 hud-header">
            Цифровой двойник
          </div>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <span className="text-xs font-mono" style={{ color: 'rgba(0,229,255,0.5)' }}>Loading 3D...</span>
            </div>
          }>
            <DigitalTwinCanvas />
          </Suspense>
          {/* Holographic scanline overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.025) 2px, rgba(0,229,255,0.025) 4px)',
            pointerEvents: 'none',
            zIndex: 10,
            mixBlendMode: 'screen',
          }} />
        </GlassPanel>
      </div>

      {/* Instruments row */}
      <div className="col-span-12 grid grid-cols-4 gap-3">
        <RPMPanel value={Math.round(lastPid.rpm || 0)} />
        <SpeedPanel value={Math.round(lastPid.speed || 0)} />
        <CoolantVoltagePanel coolant={Math.round(lastPid.coolant || 0)} />
        <VibrationPanel value={totalVib} onClick={() => navigate('/diagnostics')} />
      </div>

      {/* Diagnostics summary — only show real issues (confidence >= 40%) */}
      {diagnostics.filter((d: any) => d.confidence >= 40).length > 0 && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">{'\u0414\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430'}</div>
            <div className="grid grid-cols-4 gap-3">
              {diagnostics.filter((d: any) => d.confidence >= 40).slice(0, 4).map((d: any) => (
                <div key={d.name || d.rule_name} className="flex items-center gap-2">
                  <StatusBadge status={d.status === 'likely' ? 'critical' : d.status === 'possible' ? 'warning' : 'ok'} />
                  <span className="text-xs text-white/70 font-mono">{d.display}</span>
                  <span className="text-xs font-mono ml-auto" style={{ color: theme.accent.cyan }}>{d.confidence}%</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}


      {/* Чек-лист по системам */}
      {!isOffline && (
        <div className="col-span-12">
          <GlassPanel>
            <div className="hud-header mb-3">Состояние систем</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                { key: 'suspension', name: 'Подвеска', icon: '\u{1F6DE}' },
                { key: 'engine', name: 'Двигатель', icon: '\u2699' },
                { key: 'electrical', name: 'Электрика', icon: '\u26A1' },
                { key: 'audio', name: 'Шумы', icon: '\u{1F50A}' },
              ] as const).map(sys => {
                const score = v2Loading ? 0 : (v2Scores?.[sys.key] ?? systems[sys.key]?.score ?? 0)
                const st = score === 0 && isOffline ? 'offline' : score >= 80 ? 'ok' : score >= 50 ? 'warning' : 'critical'
                const stColor = st === 'ok' ? theme.status.ok : st === 'warning' ? theme.status.warning : st === 'critical' ? theme.status.critical : theme.text.muted
                const stLabel = st === 'ok' ? 'Норма' : st === 'warning' ? 'Внимание' : st === 'critical' ? 'Проблема' : '--'
                const checkIcon = st === 'ok' ? '\u2713' : st === 'warning' ? '\u26A0' : st === 'critical' ? '\u2717' : '\u2014'
                return (
                  <div key={sys.key} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 4,
                    background: `${stColor}08`,
                    border: `1px solid ${stColor}20`,
                  }}>
                    <span style={{ fontSize: 16 }}>{sys.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: theme.text.primary }}>
                        {sys.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 'bold', color: stColor }}>{checkIcon}</span>
                        <span style={{ fontSize: 10, fontFamily: "'Rajdhani', sans-serif", color: stColor, fontWeight: 600 }}>
                          {stLabel}
                        </span>
                        <span style={{ fontSize: 10, fontFamily: 'Consolas, monospace', color: stColor, marginLeft: 'auto' }}>
                          {score > 0 ? score : '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Status bar — compact info strip */}
      <div className="col-span-12">
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)', marginBottom: 2 }} />
        <GlassPanel className="!py-2 !px-4">
          <div className="status-bar-inner flex items-center justify-between text-xs font-mono">
            <div className="status-bar-info flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" style={{ flexShrink: 0 }} />
                <span className="text-white/50">{'\u0421\u0442\u0430\u0442\u0443\u0441'}:</span>
                <span className="text-white/80">{'\u0421\u0442\u043E\u044F\u043D\u043A\u0430'}</span>
              </span>
              <span className="status-bar-divider text-white/30">|</span>
              <span className="text-white/50">Дорога: <span className="text-white/80">{
                ({standstill:'стоянка',asphalt:'асфальт',gravel:'грунт'} as Record<string,string>)[anomaly?.road_type] || anomaly?.road_type || 'н/д'
              }</span></span>
              <span className="status-bar-divider text-white/30">|</span>
              <span className="text-white/50">Режим: <span style={{ color: '#00E5FF' }}>{
                ({idle:'холостой',city:'город',highway:'трасса',acceleration:'разгон',braking:'торможение',cornering:'поворот',unknown:'н/д'} as Record<string,string>)[anomaly?.regime] || anomaly?.regime || 'н/д'
              }</span></span>
              <span className="status-bar-divider text-white/30">|</span>
              <WeatherWidget weather={apiData?.latest_weather} />
            </div>
            <div className="status-bar-time-range flex items-center gap-3">
              {[
                { label: '5м', val: 5 },
                { label: '15м', val: 15 },
                { label: '1ч', val: 60 },
                { label: '6ч', val: 360 },
                { label: '24ч', val: 1440 },
                { label: '7д', val: 10080 },
              ].map(t => (
                <button key={t.val} onClick={() => setTimeRange(t.val)}
                  className="px-2 py-0.5 rounded transition-all"
                  style={{
                    fontSize: 10,
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: '0.05em',
                    background: timeRange === t.val ? 'rgba(0,229,255,0.15)' : 'transparent',
                    border: timeRange === t.val ? '1px solid rgba(0,229,255,0.4)' : '1px solid transparent',
                    color: timeRange === t.val ? '#00E5FF' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                  }}
                >{t.label}</button>
              ))}
              <span className="text-white/20 ml-2" style={{ fontSize: 10 }}>
                {new Date().toLocaleTimeString('ru-RU')}
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
