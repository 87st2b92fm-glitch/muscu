import type { Equipment, Exercise, ImportMapping } from '../db/types'
import { normalizeText } from '../domain/search'
import type { ExerciseCategory } from '../domain/types'
import type { HevySet, HevyWorkout } from './hevy'

/** Ce que devient un nom d'exercice Hevy : un exercice existant, ou un nouvel exercice perso. */
export type Resolution =
  | { kind: 'existing'; exerciseId: string }
  | { kind: 'create'; category: ExerciseCategory; equipment: Equipment }

export interface NameEntry {
  sourceName: string
  workouts: number
  sets: number
  /** Proposition de départ, modifiable dans l'aperçu. */
  resolution: Resolution
  /** true si l'exercice a été reconnu automatiquement. */
  recognized: boolean
}

export interface Anomaly {
  /** `séance:exercice:série` (indices dans `ImportPreview.workouts`). */
  id: string
  workoutTitle: string
  startedAt: number
  exerciseName: string
  set: HevySet
  reason: string
}

export interface ImportPreview {
  /** Séances à importer (celles déjà présentes sont écartées). */
  workouts: HevyWorkout[]
  alreadyImported: number
  setCount: number
  /** Séries sans reps (cardio, séries vides) : non importées. */
  skippedSets: number
  firstAt: number | null
  lastAt: number | null
  names: NameEntry[]
  anomalies: Anomaly[]
}

export const MAX_PLAUSIBLE_REPS = 50
export const MAX_PLAUSIBLE_KG = 400

/** Clé qui identifie une séance Hevy, pour ne jamais l'importer deux fois. */
export function hevyWorkoutKey(title: string, startedAt: number): string {
  return `${startedAt}\u0000${title}`
}

export function isImportable(set: HevySet): boolean {
  return set.reps !== null && set.reps > 0
}

/** Équipement et catégorie probables d'après le nom, pour un exercice inconnu. */
export function guessNewExercise(name: string): Extract<Resolution, { kind: 'create' }> {
  const n = normalizeText(name)
  const has = (...words: string[]) => words.some((w) => n.includes(w))
  if (has('smith')) return { kind: 'create', category: 'machine', equipment: 'smith' }
  if (has('poulie', 'cable', 'câble'))
    return { kind: 'create', category: 'machine', equipment: 'cable' }
  if (has('machine', 'convergent', 'presse', 'pec deck', 'panatta')) {
    return { kind: 'create', category: 'machine', equipment: 'machine' }
  }
  if (has('haltere', 'dumbbell')) return { kind: 'create', category: 'free', equipment: 'dumbbell' }
  if (has('kettlebell')) return { kind: 'create', category: 'free', equipment: 'kettlebell' }
  return { kind: 'create', category: 'free', equipment: 'barbell' }
}

function anomalyReason(set: HevySet): string | null {
  if (set.reps !== null && set.reps > MAX_PLAUSIBLE_REPS)
    return `${set.reps} reps : faute de frappe ?`
  if (set.kg !== null && set.kg > MAX_PLAUSIBLE_KG) return `${set.kg} kg : faute de frappe ?`
  return null
}

/**
 * Prépare l'aperçu : séances nouvelles, correspondance de chaque nom Hevy (choix déjà retenus,
 * puis noms et alias de la bibliothèque, sinon création proposée) et valeurs suspectes.
 */
export function buildPreview(
  workouts: readonly HevyWorkout[],
  exercises: readonly Exercise[],
  mappings: readonly ImportMapping[],
  existingKeys: ReadonlySet<string>,
): ImportPreview {
  const fresh = workouts.filter((w) => !existingKeys.has(hevyWorkoutKey(w.title, w.startedAt)))

  const known = new Map<string, string>()
  for (const exercise of exercises) {
    for (const name of [exercise.name, ...exercise.aliases])
      known.set(normalizeText(name), exercise.id)
  }
  const remembered = new Map(mappings.map((m) => [normalizeText(m.sourceName), m.exerciseId]))
  const exerciseIds = new Set(exercises.map((e) => e.id))

  const stats = new Map<string, { workouts: Set<number>; sets: number }>()
  const anomalies: Anomaly[] = []
  let setCount = 0
  let skippedSets = 0

  fresh.forEach((workout, wi) => {
    workout.exercises.forEach((exercise, ei) => {
      const importable = exercise.sets.filter(isImportable)
      skippedSets += exercise.sets.length - importable.length
      if (importable.length === 0) return
      setCount += importable.length
      const entry = stats.get(exercise.name) ?? { workouts: new Set(), sets: 0 }
      entry.workouts.add(wi)
      entry.sets += importable.length
      stats.set(exercise.name, entry)

      exercise.sets.forEach((set, si) => {
        const reason = isImportable(set) ? anomalyReason(set) : null
        if (reason) {
          anomalies.push({
            id: `${wi}:${ei}:${si}`,
            workoutTitle: workout.title,
            startedAt: workout.startedAt,
            exerciseName: exercise.name,
            set,
            reason,
          })
        }
      })
    })
  })

  const names: NameEntry[] = [...stats].map(([sourceName, s]) => {
    const key = normalizeText(sourceName)
    const rememberedId = remembered.get(key)
    const exerciseId = rememberedId && exerciseIds.has(rememberedId) ? rememberedId : known.get(key)
    return {
      sourceName,
      workouts: s.workouts.size,
      sets: s.sets,
      resolution: exerciseId ? { kind: 'existing', exerciseId } : guessNewExercise(sourceName),
      recognized: exerciseId !== undefined,
    }
  })
  // Les noms à vérifier d'abord, puis les plus fréquents.
  names.sort((a, b) => Number(a.recognized) - Number(b.recognized) || b.workouts - a.workouts)

  const starts = fresh.map((w) => w.startedAt)
  return {
    workouts: fresh,
    alreadyImported: workouts.length - fresh.length,
    setCount,
    skippedSets,
    firstAt: starts.length ? Math.min(...starts) : null,
    lastAt: starts.length ? Math.max(...starts) : null,
    names,
    anomalies,
  }
}
