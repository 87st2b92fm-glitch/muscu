import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { buildSummaries, scoreHistory, type SummaryInput } from './summaries'
import type { WorkoutSummary } from './types'

/** Toutes les données nécessaires aux résumés et aux records, lues dans la base. */
export async function loadSummaryInput(): Promise<SummaryInput> {
  const [workouts, sets, exercises, gyms, bodyweights, setups] = await Promise.all([
    db.workouts.where('status').equals('done').toArray(),
    db.sets.toArray(),
    db.exercises.toArray(),
    db.gyms.toArray(),
    db.bodyweights.toArray(),
    db.machineSetups.toArray(),
  ])
  return {
    workouts,
    sets,
    exercises: new Map(exercises.map((e) => [e.id, e])),
    gyms: new Map(
      gyms.map((g) => [g.id, { id: g.id, name: g.name, color: g.color, logo: g.logo }]),
    ),
    bodyweights,
    links: setups.flatMap((s) =>
      s.linkGroupId
        ? [{ exerciseId: s.exerciseId, gymId: s.gymId, linkGroupId: s.linkGroupId }]
        : [],
    ),
  }
}

/** Résumés de toutes les séances terminées, recalculés quand la base change. */
export function useWorkoutSummaries(): WorkoutSummary[] | undefined {
  return useLiveQuery(async () => buildSummaries(await loadSummaryInput()))
}

/** Une séance terminée, son résumé et les records de chacune de ses séries. */
export function useWorkoutDetail(workoutId: string) {
  return useLiveQuery(async () => {
    const input = await loadSummaryInput()
    const workout = input.workouts.find((w) => w.id === workoutId)
    if (!workout) return null
    // Les records dépendent de tout l'historique : le résumé est calculé sur l'ensemble.
    const summary = buildSummaries(input).find((w) => w.id === workoutId)
    return {
      workout,
      summary,
      sets: input.sets.filter((s) => s.workoutId === workoutId).sort((a, b) => a.order - b.order),
      exercises: input.exercises,
      flags: scoreHistory(input).flags,
    }
  }, [workoutId])
}
