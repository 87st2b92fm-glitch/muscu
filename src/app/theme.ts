import { useState } from 'react'

export type Theme = 'dark' | 'light'

const THEME_COLORS: Record<Theme, string> = { dark: '#0b0d10', light: '#f4f5f7' }

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Le thème est une préférence de l'appareil : localStorage suffit et permet de l'appliquer
// avant le premier rendu (voir index.html).
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme)

  function setTheme(next: Theme) {
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next])
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Stockage indisponible (navigation privée) : le thème reste valable pour la session.
    }
    setThemeState(next)
  }

  return { theme, setTheme }
}
