import { Check, Moon, Sun } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { ACCENTS, useAppearance, type Theme } from '../../app/theme'

const THEMES: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'light', label: 'Clair', icon: Sun },
]

export default function ProfilePage() {
  const { theme, setTheme, accent, setAccent } = useAppearance()

  return (
    <>
      <PageHeader title="Profil" />
      <div className="flex flex-col gap-6 px-4">
        <section className="flex flex-col gap-3">
          <h2 className="text-muted px-1 text-sm font-semibold">Apparence</h2>
          <div className="bg-surface flex flex-col gap-5 rounded-3xl p-4">
            <div
              role="radiogroup"
              aria-label="Thème"
              className="bg-surface-2 flex gap-1 rounded-2xl p-1"
            >
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={theme === value}
                  onClick={() => setTheme(value)}
                  className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${
                    theme === value ? 'bg-surface text-text shadow-sm' : 'text-muted'
                  }`}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            <div>
              <p className="mb-3 font-semibold">Couleur d’accent</p>
              <div role="radiogroup" aria-label="Couleur d’accent" className="flex justify-between">
                {ACCENTS.map(({ value, label, swatch }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={accent === value}
                    aria-label={label}
                    onClick={() => setAccent(value)}
                    className="ring-offset-surface aria-checked:ring-text flex size-12 items-center justify-center rounded-full ring-offset-2 transition-shadow aria-checked:ring-2"
                    style={{ backgroundColor: swatch }}
                  >
                    {accent === value && (
                      <Check size={22} strokeWidth={3} className="text-black/80" aria-hidden />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
