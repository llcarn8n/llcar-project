import { useState, useEffect } from 'react'
import { DTCSearch } from '../components/dtc/DTCSearch'
import { GlassPanel } from '../components/shared/GlassPanel'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'

// Full DTC detail from dtc-index.json (loaded on demand)
interface DTCFull {
  severity: string
  title_ru?: string
  title_en?: string
  system_id?: string
  can_drive?: string
  source?: string
}

const CAN_DRIVE_MAP: Record<string, { text: string; color: string; icon: string }> = {
  no_stop: { text: 'Остановитесь! Движение опасно.', color: theme.status.critical, icon: '\u{1F6D1}' },
  caution: { text: 'Двигайтесь осторожно, избегайте нагрузок.', color: theme.status.warning, icon: '\u26A0' },
  check: { text: 'Проверьте при первой возможности.', color: theme.accent.cyan, icon: '\u{1F50D}' },
  ok: { text: 'Можно продолжать движение.', color: theme.status.ok, icon: '\u2705' },
}

// DTC code prefix meanings
function getDTCCategory(code: string): string {
  if (code.startsWith('P0') || code.startsWith('P2') || code.startsWith('P3')) return 'Силовой агрегат (стандартный)'
  if (code.startsWith('P1')) return 'Силовой агрегат (производитель)'
  if (code.startsWith('C0') || code.startsWith('C2')) return 'Шасси (стандартный)'
  if (code.startsWith('C1') || code.startsWith('C3')) return 'Шасси (производитель)'
  if (code.startsWith('B0') || code.startsWith('B2')) return 'Кузов (стандартный)'
  if (code.startsWith('B1') || code.startsWith('B3')) return 'Кузов (производитель)'
  if (code.startsWith('U0') || code.startsWith('U2')) return 'Сеть (стандартный)'
  if (code.startsWith('U1') || code.startsWith('U3')) return 'Сеть (производитель)'
  return 'Неизвестная категория'
}

export function ErrorCodes() {
  const { vehicleProfile } = useDashboardStore()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [detail, setDetail] = useState<DTCFull | null>(null)
  const [multiCodes, setMultiCodes] = useState('')

  // Load full detail when code selected (from full index - could be API in future)
  useEffect(() => {
    if (!selectedCode) { setDetail(null); return }
    // For now, detail comes from the search index data we already display
    // In future: fetch from /api/v3/dtc/detail/?code=X
    setDetail(null)
  }, [selectedCode])

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Search panel */}
      <div className="col-span-12 lg:col-span-7">
        <DTCSearch onSelect={setSelectedCode} selectedCode={selectedCode} />
      </div>

      {/* Detail / Multi-DTC panel */}
      <div className="col-span-12 lg:col-span-5">
        {/* Selected code detail */}
        {selectedCode && (
          <GlassPanel style={{ marginBottom: 12 }}>
            <div className="hud-header mb-3">
              <span style={{ color: theme.accent.cyan }}>{selectedCode}</span>
            </div>

            {/* Category */}
            <div style={{
              padding: '8px 12px',
              borderRadius: 4,
              background: 'rgba(0,229,255,0.03)',
              border: '1px solid rgba(0,229,255,0.08)',
              marginBottom: 12,
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: theme.text.muted,
                letterSpacing: '0.05em',
                marginBottom: 2,
              }}>
                Категория
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: theme.text.secondary,
              }}>
                {getDTCCategory(selectedCode)}
              </div>
            </div>

            {/* Can drive recommendation */}
            {(() => {
              // Default to 'check' if we don't have specific data
              const driveKey = detail?.can_drive || 'check'
              const drive = CAN_DRIVE_MAP[driveKey] || CAN_DRIVE_MAP.check
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 4,
                  background: `${drive.color}08`,
                  border: `1px solid ${drive.color}20`,
                  marginBottom: 12,
                }}>
                  <span style={{ fontSize: 24 }}>{drive.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme.text.muted,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase' as const,
                    }}>
                      Можно ли ехать?
                    </div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: drive.color,
                    }}>
                      {drive.text}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Vehicle context */}
            {vehicleProfile && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 4,
                background: 'rgba(0,229,255,0.02)',
                border: '1px solid rgba(0,229,255,0.06)',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 12,
                color: theme.text.muted,
              }}>
                Для <strong style={{ color: theme.text.secondary }}>{vehicleProfile.brand} {vehicleProfile.model}</strong> могут
                быть дополнительные рекомендации — раздел пополняется.
              </div>
            )}
          </GlassPanel>
        )}

        {/* Multi-DTC input */}
        <GlassPanel>
          <div className="hud-header mb-3">Несколько кодов сразу</div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 12,
            color: theme.text.muted,
            marginBottom: 8,
            lineHeight: 1.4,
          }}>
            Введите несколько кодов через запятую — покажем связанные ситуации и общую картину.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="P0420, P0171, P0300"
              value={multiCodes}
              onChange={e => setMultiCodes(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'rgba(0,229,255,0.04)',
                border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: 4,
                outline: 'none',
                letterSpacing: '0.1em',
              }}
            />
            <button
              onClick={() => {
                // Future: call /api/v3/dtc/multi/
                const codes = multiCodes.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
                if (codes.length > 0) setSelectedCode(codes[0])
              }}
              style={{
                padding: '10px 20px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#0C1220',
                background: `linear-gradient(135deg, ${theme.accent.cyan}, ${theme.accent.teal})`,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                textTransform: 'uppercase' as const,
              }}
            >
              Анализ
            </button>
          </div>

          {/* Placeholder for multi-DTC results */}
          {multiCodes && (
            <div style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 12px',
              borderRadius: 4,
              background: 'rgba(0,229,255,0.02)',
              border: '1px solid rgba(0,229,255,0.06)',
            }}>
              <img
                src={`${import.meta.env.BASE_URL}images/robot/Error_Codes_Caricature_F5ROtOf7.webp`}
                alt="LLCAR"
                style={{ width: 48, height: 48, objectFit: 'contain', opacity: 0.7 }}
              />
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 12,
                color: theme.text.muted,
                lineHeight: 1.4,
              }}>
                Мульти-DTC анализ с привязкой к ситуациям — скоро.
                <br />
                В базе 20 мульти-DTC паттернов для комплексной диагностики.
              </div>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
