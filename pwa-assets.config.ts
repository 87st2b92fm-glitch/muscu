import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Génère favicon, icônes PWA et apple-touch-icon à partir de public/logo.svg (npm run icons).
// iOS n'accepte pas la transparence pour l'icône d'écran d'accueil : fond sombre plein.
const background = '#0b0d10'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.2, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, padding: 0.15, resizeOptions: { background } },
  },
  images: ['public/logo.svg'],
})
