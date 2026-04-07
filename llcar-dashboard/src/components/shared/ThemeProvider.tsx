import { useEffect } from 'react'
import { useDashboardStore } from '../../stores/dashboardStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDarkMode = useDashboardStore(s => s.isDarkMode)

  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDarkMode)
    document.body.classList.toggle('dark-mode', isDarkMode)
  }, [isDarkMode])

  return <>{children}</>
}
