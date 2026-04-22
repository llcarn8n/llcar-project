import { create } from 'zustand'
import type { PartSpec } from '../types/rules'

interface VehicleProfile {
  brand: string
  brandId?: string
  model: string
  year: number
  engine: string
  generationId: string | null
  /** Human-readable generation name — shortcut to avoid brands/<id>.json lookup
   *  when set by global search (KBGlobalSearch). Takes precedence over
   *  brands.json gen.id lookup in KnowledgeBase.tsx. */
  generationName?: string
  /** Direct kb path override: "brand/model/gen" — used by KBGlobalSearch when
   *  we already know the exact kb folder and want to skip deriveKBGenPath. */
  kbGenPath?: string
}

export interface HoveredPartState {
  nodeName: string
  partSpec: PartSpec | null
  screenX: number
  screenY: number
}

export interface ActiveRuleDrawerState {
  ruleName: string
}

export type UserTier = 'free' | 'single' | 'monthly' | 'annual'

export interface UserTierState {
  tier: UserTier
  freeReportUsed: boolean
  freeReportVehicleKey: string | null
}

interface DashboardState {
  // Navigation mode
  mode: 'vehicle' | 'general'

  // UI state
  sidebarOpen: boolean
  selectedSystem: string | null
  timeRange: number // minutes
  clientHash: string
  expertMode: boolean
  useV2Api: boolean
  isDarkMode: boolean

  // Vehicle
  vehicleProfile: VehicleProfile | null
  showVehicleSetup: boolean
  connectionDone: boolean
  showConnectionWizard: boolean

  // Monetization
  userTier: UserTierState

  // Diagnostic twin interactions (tooltip + rule drawer)
  hoveredPart: HoveredPartState | null
  activeRuleDrawer: ActiveRuleDrawerState | null

  // Actions
  setMode: (mode: DashboardState['mode']) => void
  toggleSidebar: () => void
  setSelectedSystem: (system: string | null) => void
  setTimeRange: (minutes: number) => void
  setClient: (hash: string) => void
  toggleExpert: () => void
  toggleV2Api: () => void
  toggleTheme: () => void
  setVehicleProfile: (profile: VehicleProfile) => void
  openVehicleSetup: () => void
  closeVehicleSetup: () => void
  setConnectionDone: (done: boolean) => void
  resetVehicle: () => void
  openConnectionWizard: () => void
  closeConnectionWizard: () => void
  setUserTier: (tier: UserTier) => void
  markFreeReportUsed: (vehicleKey: string) => void
  setHoveredPart: (hp: HoveredPartState) => void
  clearHoveredPart: () => void
  openRuleDrawer: (ruleName: string) => void
  closeRuleDrawer: () => void
}

function loadVehicleProfile(): VehicleProfile | null {
  try {
    const raw = localStorage.getItem('llcar-vehicle-profile')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.brand && parsed.model && parsed.year && parsed.engine) {
      return parsed as VehicleProfile
    }
    return null
  } catch {
    return null
  }
}

function loadMode(): 'vehicle' | 'general' {
  try {
    const raw = localStorage.getItem('llcar-mode')
    if (raw === 'general') return 'general'
    return 'vehicle'
  } catch {
    return 'vehicle'
  }
}

function loadConnectionDone(): boolean {
  try {
    return localStorage.getItem('llcar-connection-done') === 'true'
  } catch {
    return false
  }
}

function loadUserTier(): UserTierState {
  try {
    const raw = localStorage.getItem('llcar-user-tier')
    if (!raw) return { tier: 'free', freeReportUsed: false, freeReportVehicleKey: null }
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.tier === 'string') {
      return parsed as UserTierState
    }
    return { tier: 'free', freeReportUsed: false, freeReportVehicleKey: null }
  } catch {
    return { tier: 'free', freeReportUsed: false, freeReportVehicleKey: null }
  }
}

function saveUserTier(state: UserTierState) {
  try {
    localStorage.setItem('llcar-user-tier', JSON.stringify(state))
  } catch { /* ignore */ }
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  mode: loadMode(),
  sidebarOpen: false,
  selectedSystem: null,
  timeRange: 10080,
  clientHash: 'b5f2f64851802f4859a3ffe3eda4b2d5', // auto-select freshest client
  expertMode: false,
  useV2Api: true,
  isDarkMode: true,
  vehicleProfile: loadVehicleProfile(),
  showVehicleSetup: false,
  connectionDone: loadConnectionDone(),
  showConnectionWizard: false,
  userTier: loadUserTier(),
  hoveredPart: null,
  activeRuleDrawer: null,

  setMode: (mode) => {
    localStorage.setItem('llcar-mode', mode)
    set({ mode })
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSelectedSystem: (system) => set({ selectedSystem: system }),
  setTimeRange: (minutes) => set({ timeRange: minutes }),
  setClient: (hash) => set({ clientHash: hash }),
  toggleExpert: () => set((s) => ({ expertMode: !s.expertMode })),
  toggleV2Api: () => set((s) => ({ useV2Api: !s.useV2Api })),
  toggleTheme: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  setVehicleProfile: (profile) => {
    localStorage.setItem('llcar-vehicle-profile', JSON.stringify(profile))
    // новый профиль — показываем онбординг-тур снова
    localStorage.removeItem('llcar-onboarding-v3-done')
    set({ vehicleProfile: profile, showVehicleSetup: false, mode: 'vehicle' })
  },
  openVehicleSetup: () => set({ showVehicleSetup: true }),
  closeVehicleSetup: () => set({ showVehicleSetup: false }),
  resetVehicle: () => {
    localStorage.removeItem('llcar-vehicle-profile')
    localStorage.removeItem('llcar-mode')
    localStorage.removeItem('llcar-onboarding-v3-done')
    set({ vehicleProfile: null, mode: 'vehicle' })
  },
  setConnectionDone: (done) => set({ connectionDone: done }),
  openConnectionWizard: () => set({ showConnectionWizard: true }),
  closeConnectionWizard: () => set({ showConnectionWizard: false }),
  setUserTier: (tier) => {
    const newState: UserTierState = { ...get().userTier, tier }
    saveUserTier(newState)
    set({ userTier: newState })
  },
  markFreeReportUsed: (vehicleKey) => {
    const newState: UserTierState = { ...get().userTier, freeReportUsed: true, freeReportVehicleKey: vehicleKey }
    saveUserTier(newState)
    set({ userTier: newState })
  },
  setHoveredPart: (hp) => set({ hoveredPart: hp }),
  clearHoveredPart: () => set({ hoveredPart: null }),
  openRuleDrawer: (ruleName) => set({ activeRuleDrawer: { ruleName } }),
  closeRuleDrawer: () => set({ activeRuleDrawer: null }),
}))

export function useHasAccess(): boolean {
  const userTier = useDashboardStore(s => s.userTier)
  if (userTier.tier === 'monthly' || userTier.tier === 'annual') return true
  if (userTier.tier === 'single') return true
  if (!userTier.freeReportUsed) return true // first report free
  return false
}
