import { useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { MUSCLES, MUSCLE_IDS, type MuscleId } from '../../data/muscles'
import { useExercises } from '../../db/hooks'
import { EQUIPMENT_LABELS, type Exercise } from '../../db/types'
import { matchesSearch } from '../../domain/search'

function groupByMuscle(exercises: Exercise[]): [MuscleId, Exercise[]][] {
  const groups = new Map<MuscleId, Exercise[]>()
  for (const exercise of exercises) {
    const muscle = exercise.primaryMuscles[0]
    if (!muscle) continue
    groups.set(muscle, [...(groups.get(muscle) ?? []), exercise])
  }
  return MUSCLE_IDS.filter((m) => groups.has(m)).map((m) => [m, groups.get(m)!])
}

export default function ExercisesPage() {
  const exercises = useExercises()
  const [query, setQuery] = useState('')

  const found = (exercises ?? []).filter((e) => matchesSearch(query, [e.name, ...e.aliases]))

  return (
    <>
      <PageHeader title="Exercices" back />
      <div className="flex flex-col gap-5 px-4">
        <label className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-surface px-4">
          <Search size={20} className="shrink-0 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              exercises ? `Rechercher parmi ${exercises.length} exercices` : 'Rechercher'
            }
            aria-label="Rechercher un exercice"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
          />
        </label>

        {exercises && found.length === 0 && (
          <p className="py-10 text-center text-muted">Aucun exercice ne correspond.</p>
        )}

        {groupByMuscle(found).map(([muscle, items]) => (
          <section key={muscle} className="flex flex-col gap-2">
            <h2 className="px-1 text-sm font-semibold text-muted">{MUSCLES[muscle]}</h2>
            <ul className="overflow-hidden rounded-3xl bg-surface">
              {items.map((exercise) => (
                <li
                  key={exercise.id}
                  className="flex min-h-14 flex-col justify-center border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <span className="font-semibold">{exercise.name}</span>
                  <span className="text-sm text-muted">
                    {EQUIPMENT_LABELS[exercise.equipment]}
                    {exercise.category === 'machine' ? ' · records par salle' : ''}
                    {exercise.loadMode === 'bodyweight' ? ' · lest + poids du corps' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
