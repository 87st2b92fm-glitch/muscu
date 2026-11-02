import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Plus, Search } from 'lucide-react'
import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import Sheet from '../../components/Sheet'
import { Chip } from '../../components/form'
import { MUSCLES, MUSCLE_IDS } from '../../data/muscles'
import { db } from '../../db/db'
import { createExercise } from '../../db/exercises'
import { EQUIPMENT_LABELS, type Equipment, type Exercise } from '../../db/types'
import { byName, matchesSearch } from '../../domain/search'

const EQUIPMENTS = Object.keys(EQUIPMENT_LABELS) as Equipment[]

/** Groupes affichés : « À compléter » (sans muscle), puis par muscle principal. */
function groupExercises(exercises: Exercise[]): [string, Exercise[]][] {
  const incomplete = exercises.filter((e) => e.primaryMuscles.length === 0)
  const groups: [string, Exercise[]][] =
    incomplete.length > 0 ? [['À compléter : muscles manquants', incomplete]] : []
  for (const muscle of MUSCLE_IDS) {
    const items = exercises.filter((e) => e.primaryMuscles[0] === muscle)
    if (items.length > 0) groups.push([MUSCLES[muscle], items])
  }
  return groups
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to={`/exercices/${exercise.id}`}
        className="flex min-h-14 items-center gap-3 px-4 py-2.5 active:bg-surface-2"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{exercise.name}</span>
          <span className="block text-sm text-muted">
            {EQUIPMENT_LABELS[exercise.equipment]}
            {exercise.category === 'machine' ? ' · records par salle' : ''}
            {exercise.loadMode === 'bodyweight' ? ' · lest + poids du corps' : ''}
            {exercise.custom ? ' · perso' : ''}
            {exercise.repRange ? ` · ${exercise.repRange.min}–${exercise.repRange.max} reps` : ''}
          </span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  )
}

function NewExerciseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState<Equipment>('barbell')

  async function create() {
    const id = await createExercise(name.trim(), equipment)
    setName('')
    onClose()
    navigate(`/exercices/${id}`)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nouvel exercice">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) void create()
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l’exercice"
          aria-label="Nom de l’exercice"
          className="min-h-12 rounded-2xl bg-surface-2 px-4 outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
        />
        <div className="flex flex-wrap gap-2">
          {EQUIPMENTS.map((e) => (
            <Chip key={e} selected={equipment === e} onClick={() => setEquipment(e)}>
              {EQUIPMENT_LABELS[e]}
            </Chip>
          ))}
        </div>
        <Button type="submit" disabled={!name.trim()}>
          Créer
        </Button>
      </form>
    </Sheet>
  )
}

export default function ExercisesPage() {
  const exercises = useLiveQuery(async () => (await db.exercises.toArray()).sort(byName))
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const matching = (exercises ?? []).filter((e) => matchesSearch(query, [e.name, ...e.aliases]))
  const visible = matching.filter((e) => !e.archived)
  const archived = matching.filter((e) => e.archived)

  return (
    <>
      <PageHeader
        title="Exercices"
        back
        action={
          <button
            type="button"
            aria-label="Nouvel exercice"
            onClick={() => setCreating(true)}
            className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-contrast active:opacity-80"
          >
            <Plus size={24} strokeWidth={2.5} aria-hidden />
          </button>
        }
      />
      <div className="flex flex-col gap-5 px-4">
        <label className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-surface px-4">
          <Search size={20} className="shrink-0 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              exercises
                ? `Rechercher parmi ${exercises.length - archived.length} exercices`
                : 'Rechercher'
            }
            aria-label="Rechercher un exercice"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
          />
        </label>

        {exercises && visible.length === 0 && (
          <p className="py-10 text-center text-muted">Aucun exercice ne correspond.</p>
        )}

        {groupExercises(visible).map(([title, items]) => (
          <section key={title} className="flex flex-col gap-2">
            <h2
              className={`px-1 text-sm font-semibold ${title.startsWith('À compléter') ? 'text-gold' : 'text-muted'}`}
            >
              {title}
            </h2>
            <ul className="overflow-hidden rounded-3xl bg-surface">
              {items.map((exercise) => (
                <ExerciseRow key={exercise.id} exercise={exercise} />
              ))}
            </ul>
          </section>
        ))}

        {archived.length > 0 && (
          <section className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="text-muted"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Cacher' : 'Afficher'} les exercices masqués ({archived.length})
            </Button>
            {showArchived && (
              <ul className="overflow-hidden rounded-3xl bg-surface opacity-70">
                {archived.map((exercise) => (
                  <ExerciseRow key={exercise.id} exercise={exercise} />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <NewExerciseSheet open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
