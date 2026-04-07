import { create } from 'zustand'

interface DashboardState {
  activeTab: 'dashboard' | 'diagnostics' | 'trips'
  sidebarOpen: boolean
  selectedSystem: string | null
  timeRange: number // minutes
  clientHash: string
  expertMode: boolean
  setTab: (tab: DashboardState['activeTab']) => void
  toggleSidebar: () => void
  setSelectedSystem: (system: string | null) => void
  setTimeRange: (minutes: number) => void
  setClient: (hash: string) => void
  toggleExpert: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'dashboard',
  sidebarOpen: false,
  selectedSystem: null,
  timeRange: 10080,
  clientHash: '362f5a4a5f95127723509e28c392850f',
  expertMode: false,
  setTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSelectedSystem: (system) => set({ selectedSystem: system }),
  setTimeRange: (minutes) => set({ timeRange: minutes }),
  setClient: (hash) => set({ clientHash: hash }),
  toggleExpert: () => set((s) => ({ expertMode: !s.expertMode })),
}))
