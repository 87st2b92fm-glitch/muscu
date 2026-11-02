import { round2 } from './units'
import type { LoadMode, ScoredSet } from './types'

/**
 * Charge réellement déplacée : la charge saisie, ou lest + poids de corps pour un exercice
 * au poids du corps. null si le poids de corps est inconnu pour un tel exercice.
 */
export function effectiveKg(
  enteredKg: number,
  mode: LoadMode,
  bodyweightKg: number | null,
): number | null {
  if (mode === 'external') return enteredKg
  if (bodyweightKg === null) return null
  return round2(bodyweightKg + enteredKg)
}

/** Volume (charge effective × reps) des séries hors échauffement. */
export function volumeOf(sets: readonly ScoredSet[]): number {
  return round2(sets.reduce((sum, s) => (s.type === 'warmup' ? sum : sum + s.kg * s.reps), 0))
}
