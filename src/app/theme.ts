import { useState } from 'react'

export type Theme = 'dark' | 'light'
export type Accent =
  'vert' | 'vert-sombre' | 'turquoise' | 'bleu' | 'violet' | 'rose' | 'rouge' | 'orange' | 'jaune'

/** `light` : la coche est blanche sur cette pastille (couleur foncée). */
export const ACCENTS: { value: Accent; label: string; swatch: string; light?: boolean }[] = [
  { value: 'vert', label: 'Vert', swatch: '#a3e635' },
  { value: 'vert-sombre', label: 'Vert sombre', swatch: '#22a35a', light: true },
  { value: 'turquoise', label: 'Turquoise', swatch: '#2dd4bf' },
  { value: 'bleu', label: 'Bleu', swatch: '#2f8cff', light: true },
  { value: 'violet', label: 'Violet', swatch: '#a78bfa' },
  { value: 'rose', label: 'Rose', swatch: '#f472b6' },
  { value: 'rouge', label: 'Rouge', swatch: '#ef4444', light: true },
  { value: 'orange', label: 'Orange', swatch: '#ff8a3d' },
  { value: 'jaune', label: 'Jaune', swatch: '#facc15' },
]

// Doit rester aligné avec --bg dans index.css et le script de index.html.
const THEME_COLORS: Record<Theme, string> = { dark: '#000000', light: '#f2f3f5' }

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function readAccent(): Accent {
  return (document.documentElement.dataset.accent as Accent | undefined) ?? 'vert'
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Stockage indisponible (navigation privée) : la préférence reste valable pour la session.
  }
}

// Thème et accent sont des préférences de l'appareil : localStorage suffit et permet de les
// appliquer avant le premier rendu (voir index.html).
export function useAppearance() {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [accent, setAccentState] = useState<Accent>(readAccent)

  function setTheme(next: Theme) {
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next])
    save('theme', next)
    setThemeState(next)
  }

  function setAccent(next: Accent) {
    document.documentElement.dataset.accent = next
    save('accent', next)
    setAccentState(next)
  }

  return { theme, setTheme, accent, setAccent }
}
