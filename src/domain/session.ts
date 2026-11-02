import type { Equipment } from '../db/types'
import type { PlateStock } from './plates'
import type { Suggestion } from './progression'
import type { SetEntry } from './types'

/** Série passée d'un exercice, telle que saisie. */
export interface PastSet extends SetEntry {
  workoutId: string
  at: number
  order: number
}

/** Séries de la séance la plus récente, dans l'ordre de saisie. */
export function lastSessionSets<T extends PastSet>(history: readonly T[]): T[] {
  if (history.length === 0) return []
  const latest = history.reduce((a, b) => (b.at > a.at ? b : a))
  return history.filter((s) => s.workoutId === latest.workoutId).sort((a, b) => a.order - b.order)
}

/**
 * Plus petit écart de charge possible : réglage de la machine, écart entre haltères,
 * ou deux plus petits disques (un de chaque côté) pour la barre et la Smith ; un disque pour un lest.
 */
export function incrementFor(
  equipment: Equipment,
  gym: { plates: readonly PlateStock[]; dumbbellIncrementKg: number | null },
  machineIncrementKg: number | null,
): number | null {
  const smallestPlate = gym.plates.length > 0 ? Math.min(...gym.plates.map((p) => p.kg)) : null
  switch (equipment) {
    case 'machine':
    case 'cable':
      return machineIncrementKg
    case 'dumbbell':
      return gym.dumbbellIncrementKg
    case 'barbell':
    case 'smith':
      return smallestPlate === null ? null : smallestPlate * 2
    case 'bodyweight':
      return smallestPlate
    case 'kettlebell':
      return null
  }
}

/**
 * Séries préremplies pour une nouvelle séance : celles de la dernière fois (même type, charge, reps),
 * corrigées par la suggestion de progression sur les séries de travail. Un tap suffit ensuite
 * pour valider chaque série.
 */
export function plannedSets(
  count: number,
  previous: readonly SetEntry[],
  suggestion: Suggestion | null,
): SetEntry[] {
  const planned: SetEntry[] = []
  const workingKg = suggestion?.action === 'increase' ? suggestion.fromKg : suggestion?.kg
  let keepIndex = 0
  for (let i = 0; i < count; i++) {
    const base = previous[i] ?? previous[previous.length - 1] ?? { type: 'normal', kg: 0, reps: 0 }
    const set: SetEntry = {
      type: base.type === 'drop' ? 'normal' : base.type,
      kg: base.kg,
      reps: base.reps,
    }
    const isWorking = set.type !== 'warmup' && set.kg === workingKg
    if (suggestion && isWorking) {
      if (suggestion.action === 'increase') {
        set.kg = suggestion.kg ?? set.kg
        set.reps = suggestion.reps
      } else {
        set.reps = suggestion.reps[keepIndex++] ?? set.reps
      }
    }
    planned.push(set)
  }
  return planned
}
