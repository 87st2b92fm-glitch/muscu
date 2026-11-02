import { NavLink } from 'react-router'
import { ChartLine, CircleUser, Dumbbell, History, Library, type LucideIcon } from 'lucide-react'

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Séance', icon: Dumbbell },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/performance', label: 'Performance', icon: ChartLine },
  { to: '/exercices', label: 'Exercices', icon: Library },
  { to: '/profil', label: 'Profil', icon: CircleUser },
]

export default function TabBar() {
  return (
    <nav className="border-border bg-surface border-t pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  isActive ? 'text-accent' : 'text-muted'
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
