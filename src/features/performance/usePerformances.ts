import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router'
import { useProfile } from '../../db/hooks'
import { loadSummaryInput } from '../home/useWorkoutSummaries'
import { performancesForGym, type ExercisePerformance } from './performance'

/** Performances de tous les exercices vues depuis une salle, recalculées quand la base change. */
export function usePerformances(gymId: string | null): ExercisePerformance[] | undefined {
  return useLiveQuery(
    async () => (gymId ? performancesForGym(await loadSummaryInput(), gymId) : []),
    [gymId],
  )
}

/** Salle choisie dans l'URL (?salle=…), sinon la salle par défaut : elle suit d'un écran à l'autre. */
export function useSelectedGym() {
  const [params, setParams] = useSearchParams()
  const profile = useProfile()
  const gymId = params.get('salle') ?? profile?.defaultGymId ?? null
  return {
    gymId,
    setGymId: (id: string) => setParams({ salle: id }, { replace: true }),
  }
}
