import { db } from '../../db/db'
import type { Workout } from '../../db/types'
import { discardWorkout } from '../../db/workouts'

/** Demande confirmation puis abandonne la séance (rien n'est enregistré). Renvoie true si c'est fait. */
export async function confirmAbandon(workout: Workout): Promise<boolean> {
  const done = await db.sets
    .where('workoutId')
    .equals(workout.id)
    .filter((s) => s.done)
    .count()
  const lost =
    done > 0
      ? ` Les ${done} série${done > 1 ? 's' : ''} validée${done > 1 ? 's' : ''} seront perdues.`
      : ''
  if (!window.confirm(`Abandonner la séance « ${workout.title} » ?${lost}`)) return false
  await discardWorkout(workout.id)
  return true
}
