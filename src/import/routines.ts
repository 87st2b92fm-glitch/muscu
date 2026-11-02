import type { HevyWorkout } from './hevy'

/** Modèle reconstitué depuis l'historique : Hevy n'exporte pas les routines, seulement les séances. */
export interface RoutineCandidate {
  title: string
  lastAt: number
  sessions: number
  /** Exercices de la dernière séance portant ce nom, dans l'ordre. */
  exercises: { name: string; sets: number; supersetId: string | null }[]
}

/**
 * Une proposition par nom de séance fait depuis `since`, à partir de la séance la plus récente
 * de ce nom (plus récentes d'abord). Les séries sans reps (cardio) ne comptent pas.
 */
export function routineCandidates(
  workouts: readonly HevyWorkout[],
  since: number,
): RoutineCandidate[] {
  const byTitle = new Map<string, HevyWorkout[]>()
  for (const workout of workouts) {
    byTitle.set(workout.title, [...(byTitle.get(workout.title) ?? []), workout])
  }

  const candidates: RoutineCandidate[] = []
  for (const [title, sessions] of byTitle) {
    const latest = sessions.reduce((a, b) => (b.startedAt > a.startedAt ? b : a))
    if (latest.startedAt < since) continue
    const exercises = latest.exercises
      .map((e) => ({
        name: e.name,
        sets: e.sets.filter((s) => s.reps !== null && s.reps > 0).length,
        supersetId: e.supersetId,
      }))
      .filter((e) => e.sets > 0)
    if (exercises.length === 0) continue
    candidates.push({ title, lastAt: latest.startedAt, sessions: sessions.length, exercises })
  }
  return candidates.sort((a, b) => b.lastAt - a.lastAt)
}
