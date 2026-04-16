import { useState, useEffect } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface ShadowMetrics {
  rule_name: string
  window_days: number
  trigger_count: number
  precision_vs_eusama: number | null
  clean_cohort_fpr: number | null
  median_lead_days: number | null
  promotion_ready: boolean
}

const SHADOW_RULES = [
  'spectral_kurtosis_impulsive_bearing',
  'order_tracking_mount_wear_shadow',
  'phase_lag_shift_shadow',
  'damping_bandwidth_wide_shadow',
  'stand_import_eusama_boge_phase_hpbm_shadow',
  'order_2x_imbalance_l4',
  'order_05_misfire_diesel',
  'knock_impulse_kurtogram_band',
]

const PARENT: Record<string, string> = {
  spectral_kurtosis_impulsive_bearing: 'wheel_bearing_bpfo_harmonic',
  order_tracking_mount_wear_shadow: 'engine_mount_wear',
  phase_lag_shift_shadow: 'damper_energy_decay_poor',
  damping_bandwidth_wide_shadow: 'damper_energy_decay_poor',
  knock_impulse_kurtogram_band: 'knock_impulse_percussive',
}

export function ShadowMetricsPanel() {
  const [selected, setSelected] = useState<string>(SHADOW_RULES[0])
  const [metrics, setMetrics] = useState<ShadowMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const parent = PARENT[selected]
    const url = `/api/diagnostics/shadow-metrics/?rule_name=${selected}&window_days=30${parent ? `&parent_rule=${parent}` : ''}`
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((d: ShadowMetrics) => { setMetrics(d); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [selected])

  const ready = metrics?.promotion_ready === true
  const badgeColor = ready ? '#22c55e' : theme.status.warning

  return (
    <GlassPanel>
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', color: theme.accent.cyan, fontSize: 14 }}>
          Shadow-метрики калибровки (30 дней)
        </h3>

        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{ width: '100%', padding: '6px 8px', marginBottom: 12,
                   background: 'rgba(0,0,0,.4)', color: '#fff',
                   border: `1px solid ${theme.accent.cyan}55`, borderRadius: 4 }}
        >
          {SHADOW_RULES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {loading && <div style={{ opacity: .6 }}>Загрузка…</div>}
        {error && <div style={{ color: theme.status.critical }}>Ошибка: {error}</div>}

        {metrics && !loading && (
          <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
            <Row label="Срабатываний" value={String(metrics.trigger_count)} />
            <Row label="Precision vs EUSAMA" value={fmt(metrics.precision_vs_eusama)} />
            <Row label="FPR на чистом парке" value={fmt(metrics.clean_cohort_fpr)} />
            <Row label="Медиана опережения, дн." value={fmt(metrics.median_lead_days)} />
            <div style={{ marginTop: 8,
                          padding: '4px 8px',
                          background: `${badgeColor}22`,
                          border: `1px solid ${badgeColor}`,
                          borderRadius: 4,
                          textAlign: 'center',
                          color: badgeColor }}>
              {ready ? '✅ Готово к промоушну' : '⏳ Калибровка продолжается'}
            </div>
            {ready && (
              <code style={{ fontSize: 10, opacity: .7, marginTop: 6 }}>
                python -m diagnostic.scripts.promote_shadow_rule --rule-name {selected}
                {PARENT[selected] ? ` --parent-rule ${PARENT[selected]}` : ''} --dry-run
              </code>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ opacity: .7 }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function fmt(v: number | null): string {
  if (v === null || v === undefined) return '—'
  return typeof v === 'number' ? v.toFixed(2) : String(v)
}
