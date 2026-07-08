import { createContext, useContext, useEffect } from 'react'
import { useUIStore } from '@/store'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { theme, initTheme } = useUIStore()

  useEffect(() => {
    initTheme()
  }, [initTheme])

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
