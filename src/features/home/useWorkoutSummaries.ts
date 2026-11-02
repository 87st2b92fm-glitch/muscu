import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { buildSummaries } from './summaries'
import type { WorkoutSummary } from './types'

/** Résumés de toutes les séances terminées, recalculés quand la base change. */
export function useWorkoutSummaries(): WorkoutSummary[] | undefined {
  return useLiveQuery(async () => {
    const [workouts, sets, exercises, gyms, bodyweights, setups] = await Promise.all([
      db.workouts.where('status').equals('done').toArray(),
      db.sets.toArray(),
      db.exercises.toArray(),
      db.gyms.toArray(),
      db.bodyweights.toArray(),
      db.machineSetups.toArray(),
    ])
    return buildSummaries({
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
    })
  })
}
