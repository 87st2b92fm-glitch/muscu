import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { buildContext, loadContextData, type ExerciseContext } from '../../db/exerciseContext'
import type { SetRow, Workout } from '../../db/types'

/** Séance en cours et ses séries ; null s'il n'y en a pas, undefined pendant le chargement. */
export function useActiveWorkout(): { workout: Workout; sets: SetRow[] } | null | undefined {
  return useLiveQuery(async () => {
    const workout = await db.workouts.where('status').equals('active').first()
    if (!workout) return null
    const sets = await db.sets.where('workoutId').equals(workout.id).sortBy('order')
    return { workout, sets }
  })
}

/**
 * Contexte de chaque exercice de la séance (dernière perf, suggestion, historique des records)
 * dans la salle de la séance. Recalculé quand la salle ou la liste d'exercices change.
 */
export function useExerciseContexts(
  workout: Workout | undefined,
): Map<string, ExerciseContext> | undefined {
  const exerciseIds = workout ? [...new Set(workout.blocks.map((b) => b.exerciseId))] : []
  const key = exerciseIds.join('|')
  return useLiveQuery(
    async () => {
      if (!workout) return new Map<string, ExerciseContext>()
      const data = await loadContextData(exerciseIds, workout.gymId)
      const contexts = new Map<string, ExerciseContext>()
      for (const id of exerciseIds) {
        const context = data ? buildContext(data, id, null) : null
        if (context) contexts.set(id, context)
      }
      return contexts
    },
    // `key` résume la liste d'exercices : la requête est relancée quand elle change.
    [workout?.gymId, key],
  )
}
