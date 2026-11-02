import { Moon, Sun } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useTheme, type Theme } from '../../app/theme'

const THEMES: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'light', label: 'Clair', icon: Sun },
]

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()

  return (
    <>
      <PageHeader title="Profil" />
      <div className="flex flex-col gap-6 px-4 pb-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-muted px-1 text-sm font-semibold tracking-wide uppercase">
            Apparence
          </h2>
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
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl font-medium ${
                  theme === value ? 'bg-surface text-text shadow-sm' : 'text-muted'
                }`}
              >
                <Icon size={18} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
