import { useState } from 'react'
import { GlassPanel } from '../shared/GlassPanel'
import { theme } from '../../theme'

const STEPS = [
  { icon: '\u{1F50D}', title: 'Найдите разъём OBD-II', text: 'Под рулевой колонкой, в бардачке или у АКПП' },
  { icon: '\u{1F6D1}', title: 'Заглушите двигатель', text: 'Не подключайте адаптер при работающем двигателе' },
  { icon: '\u{1F50C}', title: 'Подключите сканер', text: 'Вставьте BT-адаптер в OBD-II до щелчка' },
  { icon: '\u{1F511}', title: 'Включите зажигание', text: 'Если сканер не видно — поверните ключ в ON' },
  { icon: '\u{1F4F2}', title: 'Откройте LLCAR', text: 'Приложение автоматически найдёт адаптер через Bluetooth' },
]

export function OBDSetup() {
  const [expanded, setExpanded] = useState(false)

  return (
    <GlassPanel>
      <div
        className="hud-header mb-2"
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span>Подключение OBD-II</span>
        <span style={{
          fontSize: 12,
          color: theme.text.muted,
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>
          &#x25B6;
        </span>
      </div>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 4,
              background: 'rgba(0,229,255,0.02)',
              border: '1px solid rgba(0,229,255,0.06)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
                background: 'rgba(0,229,255,0.06)',
                border: '1px solid rgba(0,229,255,0.12)',
                flexShrink: 0,
              }}>
                {step.icon}
              </div>
              <div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: theme.text.secondary,
                }}>
                  {i + 1}. {step.title}
                </div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 11,
                  color: theme.text.muted,
                }}>
                  {step.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}
