import { create } from 'zustand'

interface VehicleProfile {
  brand: string
  model: string
  year: number
  engine: string
  generationId: string | null
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
  openConnectionWizard: () => void
  closeConnectionWizard: () => void
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

export const useDashboardStore = create<DashboardState>((set) => ({
  mode: loadMode(),
  sidebarOpen: false,
  selectedSystem: null,
  timeRange: 10080,
  clientHash: '362f5a4a5f95127723509e28c392850f',
  expertMode: false,
  useV2Api: true,
  isDarkMode: true,
  vehicleProfile: loadVehicleProfile(),
  showVehicleSetup: false,
  connectionDone: loadConnectionDone(),
  showConnectionWizard: false,

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
    set({ vehicleProfile: profile, showVehicleSetup: false, mode: 'vehicle' })
  },
  openVehicleSetup: () => set({ showVehicleSetup: true }),
  closeVehicleSetup: () => set({ showVehicleSetup: false }),
  setConnectionDone: (done) => set({ connectionDone: done }),
  openConnectionWizard: () => set({ showConnectionWizard: true }),
  closeConnectionWizard: () => set({ showConnectionWizard: false }),
}))
