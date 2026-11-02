import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { EQUIPMENT_LABELS, type Exercise } from '../db/types'
import { matchesSearch } from '../domain/search'

/** Recherche + liste d'exercices pour en choisir un (import, modèles, séance). */
export default function ExerciseSearchList({
  exercises,
  selectedId,
  onPick,
}: {
  exercises: readonly Exercise[]
  selectedId?: string
  onPick: (exerciseId: string) => void
}) {
  const [query, setQuery] = useState('')
  const found = exercises.filter((e) => matchesSearch(query, [e.name, ...e.aliases]))

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-surface-2 px-4">
        <Search size={20} className="shrink-0 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un exercice"
          aria-label="Rechercher un exercice"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
        />
      </label>
      <ul className="flex flex-col">
        {found.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              onClick={() => onPick(exercise.id)}
              className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left active:bg-surface-2"
            >
              <span className="flex-1">
                <span className="block font-semibold">{exercise.name}</span>
                <span className="block text-sm text-muted">
                  {EQUIPMENT_LABELS[exercise.equipment]}
                  {exercise.custom ? ' · perso' : ''}
                </span>
              </span>
              {exercise.id === selectedId && (
                <Check size={22} className="text-accent" aria-hidden />
              )}
            </button>
          </li>
        ))}
        {found.length === 0 && <li className="py-6 text-center text-muted">Aucun exercice.</li>}
      </ul>
    </div>
  )
}
