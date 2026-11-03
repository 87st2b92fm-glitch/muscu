import type { MuscleId } from '../data/muscles'
import {
  assessStrength,
  type StandardsTable,
  type StrengthAssessment,
  type StrengthLevel,
} from './strengthLevel'

/** Un exercice de référence (poids libre avec standard) et ton meilleur 1RM estimé. */
export interface ReferenceLift {
  exerciseId: string
  name: string
  primaryMuscles: readonly MuscleId[]
  oneRmKg: number
  table: StandardsTable
}

export interface LiftLevel extends StrengthAssessment {
  exerciseId: string
  name: string
  oneRmKg: number
}

export interface MuscleLevel {
  muscle: MuscleId
  level: StrengthLevel
  /** Exercice qui donne le niveau du muscle. */
  best: LiftLevel
  /** Tous les exercices pris en compte, du meilleur au moins bon. */
  lifts: LiftLevel[]
}

/** Avancement vers le niveau suivant (0 à 1), pour départager deux exercices du même niveau. */
function progress(l: LiftLevel): number {
  if (l.nextKg === null) return 1
  const from = l.thresholdsKg[l.level] ?? 0
  return Math.max(0, (l.oneRmKg - from) / (l.nextKg - from || 1))
}

/**
 * Niveau de chaque muscle = niveau du meilleur exercice de référence qui le travaille en muscle
 * principal (poids libres uniquement : les machines n'ont pas de standard fiable).
 * Un muscle sans exercice de référence n'apparaît pas (gris sur la carte).
 */
export function muscleLevels(
  lifts: readonly ReferenceLift[],
  bodyweightKg: number,
): Map<MuscleId, MuscleLevel> {
  const byMuscle = new Map<MuscleId, LiftLevel[]>()
  for (const lift of lifts) {
    const assessed: LiftLevel = {
      ...assessStrength(lift.oneRmKg, bodyweightKg, lift.table),
      exerciseId: lift.exerciseId,
      name: lift.name,
      oneRmKg: lift.oneRmKg,
    }
    for (const muscle of lift.primaryMuscles) {
      byMuscle.set(muscle, [...(byMuscle.get(muscle) ?? []), assessed])
    }
  }

  const result = new Map<MuscleId, MuscleLevel>()
  for (const [muscle, levels] of byMuscle) {
    const sorted = [...levels].sort((a, b) => b.level - a.level || progress(b) - progress(a))
    result.set(muscle, { muscle, level: sorted[0]!.level, best: sorted[0]!, lifts: sorted })
  }
  return result
}
