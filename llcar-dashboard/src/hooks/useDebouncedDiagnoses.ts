import { useEffect, useRef, useState } from 'react'
import type { Diagnosis } from './useDiagnosticV2'

export interface DebouncedDiagnosis extends Diagnosis {
  _flickering?: boolean
  _missedSnapshots?: number
}

interface DebouncedState {
  diagnoses: DebouncedDiagnosis[]
  activeCount: number
  flickeringCount: number
}

/**
 * Смягчает «мерцание» диагнозов от backend:
 * - правило сработало на пороге → ушло → вернулось через 10 секунд
 * - без дебаунса список скачет 9↔11 за 30 сек
 *
 * Логика:
 *   - свежий snapshot: missed=0, активный
 *   - пропущен 1-N snapshot'ов (N < ttl): остаётся в списке с флагом _flickering
 *   - пропущен больше ttl: удаляется окончательно
 */
export function useDebouncedDiagnoses(
  incoming: Diagnosis[] | undefined | null,
  ttlSnapshots = 3,
): DebouncedState {
  const [state, setState] = useState<DebouncedState>({
    diagnoses: [],
    activeCount: 0,
    flickeringCount: 0,
  })
  const seenRef = useRef<Map<string, { diag: Diagnosis; missed: number }>>(new Map())

  useEffect(() => {
    if (!Array.isArray(incoming)) return
    const m = seenRef.current
    const incomingNames = new Set<string>()

    for (const d of incoming) {
      if (!d.rule_name) continue
      incomingNames.add(d.rule_name)
      m.set(d.rule_name, { diag: d, missed: 0 })
    }

    for (const [name, entry] of Array.from(m.entries())) {
      if (!incomingNames.has(name)) {
        entry.missed += 1
        if (entry.missed > ttlSnapshots) {
          m.delete(name)
        }
      }
    }

    const all: DebouncedDiagnosis[] = []
    let active = 0
    let flicker = 0
    for (const entry of Array.from(m.values())) {
      if (entry.missed === 0) {
        active++
        all.push(entry.diag as DebouncedDiagnosis)
      } else {
        flicker++
        all.push({ ...entry.diag, _flickering: true, _missedSnapshots: entry.missed })
      }
    }
    all.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))

    setState({ diagnoses: all, activeCount: active, flickeringCount: flicker })
  }, [incoming, ttlSnapshots])

  return state
}
