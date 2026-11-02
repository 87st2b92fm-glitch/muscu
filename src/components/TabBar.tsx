import { NavLink } from 'react-router'
import { ChartLine, CircleUser, Dumbbell, House, type LucideIcon } from 'lucide-react'

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Accueil', icon: House },
  { to: '/entrainement', label: 'Entraînement', icon: Dumbbell },
  { to: '/performance', label: 'Perf', icon: ChartLine },
  { to: '/profil', label: 'Profil', icon: CircleUser },
]

/** Barre d'onglets flottante en pastille, au-dessus de la barre d'accueil de l'iPhone. */
export default function TabBar() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <ul className="pointer-events-auto flex w-full max-w-md gap-1 rounded-full border border-border/70 bg-surface/80 p-1.5 shadow-xl shadow-black/30 backdrop-blur-xl">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                  isActive ? 'bg-surface-2 text-accent' : 'text-muted'
                }`
              }
            >
              <Icon size={24} strokeWidth={2} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
