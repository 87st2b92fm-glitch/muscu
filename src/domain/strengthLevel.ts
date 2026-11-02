import { round2 } from './units'

export const STRENGTH_LEVELS = ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Élite'] as const
export type StrengthLevel = 0 | 1 | 2 | 3 | 4

/**
 * Standards d'un exercice pour un sexe : pour chaque poids de corps (croissant),
 * le 1RM à atteindre pour chacun des 5 niveaux (croissant).
 */
export interface StandardsTable {
  bodyweightsKg: number[]
  thresholdsKg: number[][]
}

export interface StrengthAssessment {
  level: StrengthLevel
  /** Seuils des 5 niveaux à ce poids de corps. */
  thresholdsKg: number[]
  /** 1RM à atteindre pour le niveau suivant, null au niveau Élite. */
  nextKg: number | null
}

/** Seuils à un poids de corps donné : interpolation linéaire entre les tranches, bornée aux extrêmes. */
export function thresholdsAt(bodyweightKg: number, table: StandardsTable): number[] {
  const { bodyweightsKg: bws, thresholdsKg: rows } = table
  if (bodyweightKg <= bws[0]!) return rows[0]!.map(round2)
  if (bodyweightKg >= bws[bws.length - 1]!) return rows[rows.length - 1]!.map(round2)
  const upper = bws.findIndex((bw) => bw >= bodyweightKg)
  const t = (bodyweightKg - bws[upper - 1]!) / (bws[upper]! - bws[upper - 1]!)
  const low = rows[upper - 1]!
  const high = rows[upper]!
  return low.map((v, i) => round2(v + t * (high[i]! - v)))
}

/** Niveau = plus haut seuil atteint ; sous le premier seuil, on reste Débutant. */
export function assessStrength(
  oneRmKg: number,
  bodyweightKg: number,
  table: StandardsTable,
): StrengthAssessment {
  const thresholdsKg = thresholdsAt(bodyweightKg, table)
  let level = 0
  thresholdsKg.forEach((threshold, i) => {
    if (oneRmKg >= threshold) level = i
  })
  return {
    level: level as StrengthLevel,
    thresholdsKg,
    nextKg: level < thresholdsKg.length - 1 ? thresholdsKg[level + 1]! : null,
  }
}
