import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

interface BaselineStatusProps {
  ready: boolean
  totalSamples: number
  samplesNeeded: number
}

export function BaselineStatus({ ready, totalSamples, samplesNeeded }: BaselineStatusProps) {
  const targetSamples = 200
  const progress = Math.min(100, (totalSamples / targetSamples) * 100)
  const tier = ready ? { color: theme.status.ok, icon: '✅', label: 'Завершена' } : { color: theme.status.warning, icon: '🔄', label: 'В процессе' }

  return (
    <GlassPanel>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{tier.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: theme.text.primary }}>
            Калибровка — обучение на вашей машине
          </div>
          <span style={{
            fontSize: 8, fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
            color: tier.color, padding: '2px 6px', borderRadius: 2,
            background: `${tier.color}12`, border: `1px solid ${tier.color}25`,
          }}>
            {tier.label}
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace", color: tier.color }}>
            {totalSamples}
          </div>
          <div style={{ fontSize: 9, color: theme.text.muted }}>из {targetSamples}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 12 }}>
        <div style={{
          height: '100%', width: `${progress}%`, borderRadius: 2, transition: 'width 0.5s',
          background: ready
            ? 'linear-gradient(90deg, var(--status-ok), var(--accent-teal))'
            : 'linear-gradient(90deg, var(--status-warning), var(--accent-cyan))',
        }} />
      </div>

      {/* Explanation */}
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: theme.text.muted, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 600, color: theme.accent.teal, marginBottom: 4, fontSize: 11 }}>Что это значит:</div>
        <p style={{ margin: '0 0 6px' }}>
          Каждая машина вибрирует по-своему — даже одинаковые модели. LLCAR первые {targetSamples} замеров
          запоминает <strong style={{ color: theme.text.secondary }}>нормальные значения именно вашего авто</strong>:
          уровень вибрации на холостых, шум двигателя, показания датчиков.
        </p>
        <div style={{ fontWeight: 600, color: theme.accent.teal, marginBottom: 4, fontSize: 11 }}>Как перепроверяем:</div>
        <p style={{ margin: '0 0 6px' }}>
          После калибровки каждый новый замер сравнивается с <strong style={{ color: theme.text.secondary }}>вашим личным базовым уровнем</strong>,
          а не с абстрактными нормами. Отклонение от вашей нормы → LLCAR предупреждает.
        </p>
        {!ready && (
          <p style={{ margin: '6px 0 0', padding: '6px 8px', borderRadius: 4, background: `${theme.status.warning}08`, border: `1px solid ${theme.status.warning}12` }}>
            ⏳ Пока идёт калибровка, диагностика работает по общим нормам.
            Чем больше замеров — тем точнее. Осталось: <strong style={{ color: theme.status.warning }}>{samplesNeeded}</strong>.
          </p>
        )}
        {ready && (
          <p style={{ margin: '6px 0 0', padding: '6px 8px', borderRadius: 4, background: `${theme.status.ok}08`, border: `1px solid ${theme.status.ok}12` }}>
            ✅ Калибровка завершена. LLCAR знает вашу машину и может точно определить отклонения.
          </p>
        )}
      </div>
    </GlassPanel>
  )
}
