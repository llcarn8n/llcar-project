import { create } from 'zustand'

interface VehicleProfile {
  brand: string
  model: string
  year: number
  engine: string
}

interface DashboardState {
  activeTab: 'dashboard' | 'diagnostics' | 'trips'
  sidebarOpen: boolean
  selectedSystem: string | null
  timeRange: number // minutes
  clientHash: string
  expertMode: boolean
  useV2Api: boolean
  isDarkMode: boolean
  vehicleProfile: VehicleProfile | null
  showVehicleSetup: boolean
  setTab: (tab: DashboardState['activeTab']) => void
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

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'dashboard',
  sidebarOpen: false,
  selectedSystem: null,
  timeRange: 10080,
  clientHash: '362f5a4a5f95127723509e28c392850f',
  expertMode: false,
  useV2Api: true,
  isDarkMode: true,
  vehicleProfile: loadVehicleProfile(),
  showVehicleSetup: false,
  setTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSelectedSystem: (system) => set({ selectedSystem: system }),
  setTimeRange: (minutes) => set({ timeRange: minutes }),
  setClient: (hash) => set({ clientHash: hash }),
  toggleExpert: () => set((s) => ({ expertMode: !s.expertMode })),
  toggleV2Api: () => set((s) => ({ useV2Api: !s.useV2Api })),
  toggleTheme: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  setVehicleProfile: (profile) => set({ vehicleProfile: profile, showVehicleSetup: false }),
  openVehicleSetup: () => set({ showVehicleSetup: true }),
  closeVehicleSetup: () => set({ showVehicleSetup: false }),
}))
