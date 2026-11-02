import { round2 } from './units'
import type { RepRange, SetEntry } from './types'

/**
 * Suggestion pour la prochaine séance (jamais imposée) :
 * - `increase` : toutes les séries à la charge de travail ont atteint le haut de la fourchette,
 *   on monte du plus petit incrément (kg null si aucun incrément n'est renseigné) et on repart du bas ;
 * - `keep` : même charge, une rep de plus par série, sans dépasser le haut de la fourchette.
 */
export type Suggestion =
  | { action: 'increase'; fromKg: number; kg: number | null; reps: number }
  | { action: 'keep'; kg: number; reps: number[] }

/**
 * Double progression à partir de la dernière séance de l'exercice (dans la même portée de records).
 * `lastSession` contient les séries telles que saisies (lest seul pour un exercice au poids du corps).
 * Seules les séries de travail à la charge la plus lourde comptent : échauffements et dégressives
 * sont ignorés, tout comme les séries de montée en charge d'une pyramide.
 */
export function suggestNext(
  lastSession: readonly SetEntry[],
  range: RepRange | null,
  incrementKg: number | null,
): Suggestion | null {
  if (range === null) return null
  const working = lastSession.filter(
    (s) => (s.type === 'normal' || s.type === 'failure') && s.reps > 0,
  )
  if (working.length === 0) return null

  const topKg = Math.max(...working.map((s) => s.kg))
  const topSets = working.filter((s) => s.kg === topKg)

  if (topSets.every((s) => s.reps >= range.max)) {
    return {
      action: 'increase',
      fromKg: topKg,
      kg: incrementKg ? round2(topKg + incrementKg) : null,
      reps: range.min,
    }
  }
  return {
    action: 'keep',
    kg: topKg,
    reps: topSets.map((s) => Math.min(range.max, s.reps + 1)),
  }
}
