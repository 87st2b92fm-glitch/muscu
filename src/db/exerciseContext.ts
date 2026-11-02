import { bodyweightAt } from '../domain/bodyweight'
import { effectiveKg } from '../domain/load'
import { suggestNext, type Suggestion } from '../domain/progression'
import { recordScope, type MachineLink } from '../domain/recordScope'
import { incrementFor, lastSessionSets } from '../domain/session'
import type { RepRange, ScoredSet } from '../domain/types'
import { db } from './db'
import type { BodyweightRow, Exercise, Gym, SetRow } from './types'

/** Ce qu'il faut savoir sur un exercice pendant une séance, dans la salle du jour. */
export interface ExerciseContext {
  exercise: Exercise
  scope: string
  /** Séries de la dernière séance (même portée de records), dans l'ordre. */
  previous: SetRow[]
  /** Tout l'historique de la portée, en charge effective, pour détecter les records. */
  history: ScoredSet[]
  incrementKg: number | null
  suggestion: Suggestion | null
  /** Poids de corps actuel, pour la charge effective des exercices lestés. */
  bodyweightKg: number | null
}

export interface ContextData {
  exercises: Map<string, Exercise>
  gym: Gym
  links: MachineLink[]
  machineIncrements: Map<string, number | null>
  bodyweights: BodyweightRow[]
  /** Séries validées des séances terminées, pour les exercices concernés. */
  sets: SetRow[]
}

/** Calcule le contexte d'un exercice à partir de données déjà chargées (pur, testable). */
export function buildContext(
  data: ContextData,
  exerciseId: string,
  repRange: RepRange | null,
): ExerciseContext | null {
  const exercise = data.exercises.get(exerciseId)
  if (!exercise) return null
  const scope = recordScope(exercise, data.gym.id, data.links)
  const inScope = data.sets.filter(
    (s) => s.exerciseId === exerciseId && recordScope(exercise, s.gymId, data.links) === scope,
  )
  const previous = lastSessionSets(inScope)
  const incrementKg = incrementFor(
    exercise.equipment,
    data.gym,
    data.machineIncrements.get(`${exerciseId}@${data.gym.id}`) ?? null,
  )
  return {
    exercise,
    scope,
    previous,
    history: inScope.map((s) => ({
      id: s.id,
      at: s.at,
      type: s.type,
      reps: s.reps,
      kg: effectiveKg(s.kg, exercise.loadMode, bodyweightAt(s.at, data.bodyweights)) ?? s.kg,
    })),
    incrementKg,
    suggestion: suggestNext(previous, repRange ?? exercise.repRange, incrementKg),
    bodyweightKg: bodyweightAt(Date.now(), data.bodyweights),
  }
}

/** Charge depuis la base tout ce qu'il faut pour `buildContext`. */
export async function loadContextData(
  exerciseIds: readonly string[],
  gymId: string,
): Promise<ContextData | null> {
  const ids = [...new Set(exerciseIds)]
  const [gym, exercises, setups, bodyweights, doneWorkouts, sets] = await Promise.all([
    db.gyms.get(gymId),
    db.exercises.bulkGet(ids),
    db.machineSetups.filter((s) => ids.includes(s.exerciseId)).toArray(),
    db.bodyweights.toArray(),
    db.workouts.where('status').equals('done').primaryKeys(),
    ids.length > 0 ? db.sets.where('exerciseId').anyOf(ids).toArray() : Promise.resolve([]),
  ])
  if (!gym) return null
  const done = new Set(doneWorkouts)
  return {
    exercises: new Map(exercises.flatMap((e) => (e ? [[e.id, e]] : []))),
    gym,
    links: setups.flatMap((s) =>
      s.linkGroupId
        ? [{ exerciseId: s.exerciseId, gymId: s.gymId, linkGroupId: s.linkGroupId }]
        : [],
    ),
    machineIncrements: new Map(setups.map((s) => [`${s.exerciseId}@${s.gymId}`, s.incrementKg])),
    bodyweights,
    sets: sets.filter((s) => s.done && done.has(s.workoutId)),
  }
}
