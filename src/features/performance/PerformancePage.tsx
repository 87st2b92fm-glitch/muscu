import { useState } from 'react'
import { Link } from 'react-router'
import { ChartLine, ChevronRight, Search } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import GymFilter from '../../components/GymFilter'
import PageHeader from '../../components/PageHeader'
import Sparkline from '../../components/charts/Sparkline'
import { useGyms } from '../../db/hooks'
import { formatDay } from '../../domain/format'
import { matchesSearch } from '../../domain/search'
import { headline } from './performance'
import { usePerformances, useSelectedGym } from './usePerformances'

export default function PerformancePage() {
  const gyms = useGyms()
  const { gymId, setGymId } = useSelectedGym()
  const performances = usePerformances(gymId)
  const [query, setQuery] = useState('')
  const found = (performances ?? []).filter((p) =>
    matchesSearch(query, [p.exercise.name, ...p.exercise.aliases]),
  )

  return (
    <>
      <PageHeader title="Performance" />
      <div className="flex flex-col gap-4 px-4">
        {gyms && gymId && (
          <GymFilter
            gyms={gyms}
            value={gymId}
            allowAll={false}
            onChange={(id) => id && setGymId(id)}
          />
        )}
        <p className="px-1 text-sm text-muted">
          Poids libres : records communs à toutes les salles. Machines : records de la salle
          choisie.
        </p>

        {performances && performances.length === 0 ? (
          <EmptyState
            icon={ChartLine}
            title="Pas encore de records"
            text="Termine une séance ou importe ton historique Hevy pour voir tes records et tes courbes."
          />
        ) : (
          <>
            <label className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-surface px-4">
              <Search size={20} className="shrink-0 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  performances ? `Rechercher parmi ${performances.length} exercices` : 'Rechercher'
                }
                aria-label="Rechercher un exercice"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
              />
            </label>
            <ul className="overflow-hidden rounded-3xl bg-surface">
              {found.map((p) => {
                const { label, value, trend } = headline(p)
                return (
                  <li key={p.exercise.id} className="border-b border-border last:border-b-0">
                    <Link
                      to={`/performance/${p.exercise.id}?salle=${gymId}`}
                      className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{p.exercise.name}</span>
                        <span className="block text-sm text-muted">
                          {label}{' '}
                          <span className="font-semibold text-text tabular-nums">{value}</span> ·{' '}
                          {formatDay(new Date(p.lastAt))}
                        </span>
                      </span>
                      <Sparkline values={trend} />
                      <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
                    </Link>
                  </li>
                )
              })}
              {performances && found.length === 0 && (
                <li className="px-4 py-8 text-center text-muted">Aucun exercice ne correspond.</li>
              )}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
