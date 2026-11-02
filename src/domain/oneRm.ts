import { round2 } from './units'
import type { SetEntry } from './types'

/** Au-delà de 10 reps, l'estimation du 1RM n'est plus fiable : ces séries sont ignorées. */
export const MAX_REPS_FOR_ONE_RM = 10

/**
 * 1RM estimé par la formule d'Epley : charge × (1 + reps / 30).
 * Une série d'une seule rep vaut sa charge (Epley la surestimerait de 3 %). Arrondi au centième.
 */
export function epley(kg: number, reps: number): number {
  return reps === 1 ? kg : round2(kg * (1 + reps / 30))
}

/** 1RM estimé d'une série, ou null si elle ne compte pas (échauffement, hors 1–10 reps, sans charge). */
export function estimateOneRm(set: SetEntry): number | null {
  if (set.type === 'warmup') return null
  if (set.reps < 1 || set.reps > MAX_REPS_FOR_ONE_RM) return null
  if (set.kg <= 0) return null
  return epley(set.kg, set.reps)
}
