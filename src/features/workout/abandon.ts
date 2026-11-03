import type { Confirm } from '../../components/confirmContext'
import { db } from '../../db/db'
import type { Workout } from '../../db/types'
import { discardWorkout } from '../../db/workouts'

/** Demande confirmation puis abandonne la séance (rien n'est enregistré). Renvoie true si c'est fait. */
export async function confirmAbandon(workout: Workout, confirm: Confirm): Promise<boolean> {
  const done = await db.sets
    .where('workoutId')
    .equals(workout.id)
    .filter((s) => s.done)
    .count()
  const ok = await confirm({
    title: `Abandonner « ${workout.title} » ?`,
    message:
      done > 0
        ? `Les ${done} série${done > 1 ? 's' : ''} validée${done > 1 ? 's' : ''} seront perdues.`
        : 'Rien ne sera enregistré.',
    confirmLabel: 'Abandonner',
    danger: true,
  })
  if (!ok) return false
  await discardWorkout(workout.id)
  return true
}
