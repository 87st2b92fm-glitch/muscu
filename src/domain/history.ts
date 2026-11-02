import { round2 } from './units'
import type { RecordKind, ScoredSet } from './types'

/** Série de l'historique, avec sa séance et sa portée de records (voir recordScope). */
export interface HistorySet extends ScoredSet {
  workoutId: string
  scope: string
}

/**
 * Records battus par chaque série de tout l'historique, en un seul passage chronologique.
 * Mêmes règles que `recordsInWorkout` : comparaison à tout ce qui précède dans la même portée,
 * échauffements exclus, et rien n'est marqué lors de la première séance d'un exercice.
 */
export function recordFlags(sets: readonly HistorySet[]): Map<string, RecordKind[]> {
  const flags = new Map<string, RecordKind[]>()
  const byScope = new Map<string, HistorySet[]>()
  for (const set of sets) {
    if (set.type === 'warmup' || set.reps <= 0 || set.kg <= 0) continue
    byScope.set(set.scope, [...(byScope.get(set.scope) ?? []), set])
  }

  for (const scopeSets of byScope.values()) {
    scopeSets.sort((a, b) => a.at - b.at)
    const firstWorkoutId = scopeSets[0]!.workoutId
    let bestKg = 0
    let bestVolume = 0
    for (const set of scopeSets) {
      const kg = round2(set.kg)
      const volume = round2(set.kg * set.reps)
      if (set.workoutId !== firstWorkoutId) {
        const kinds: RecordKind[] = []
        if (kg > bestKg) kinds.push('weight')
        if (volume > bestVolume) kinds.push('volume')
        if (kinds.length > 0) flags.set(set.id, kinds)
      }
      bestKg = Math.max(bestKg, kg)
      bestVolume = Math.max(bestVolume, volume)
    }
  }
  return flags
}
