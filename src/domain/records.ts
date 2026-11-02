import { estimateOneRm } from './oneRm'
import { round2 } from './units'
import type { RecordKind, ScoredSet } from './types'

/** Un record et la série qui l'a établi. `value` : kg, reps ou kg × reps selon le record. */
export interface RecordEntry {
  value: number
  kg: number
  reps: number
  at: number
  setId: string
}

export interface ExerciseRecords {
  /** Charge la plus lourde réussie sur une série d'une seule rep. */
  actualOneRm: RecordEntry | null
  /** Meilleur 1RM estimé (Epley, séries de 1 à 10 reps). */
  estimatedOneRm: RecordEntry | null
  /** Charge la plus lourde, toutes reps confondues. */
  maxWeight: RecordEntry | null
  /** Plus grand nombre de reps sur une série, toutes charges confondues. */
  maxReps: RecordEntry | null
  /** Meilleur charge × reps sur une seule série. */
  bestSetVolume: RecordEntry | null
  /** Reps max pour chaque charge (« 80 kg : 9 reps »), charges décroissantes. */
  repsByWeight: RecordEntry[]
}

/** Les échauffements et les séries sans rep ne comptent jamais pour les records. */
function counts(set: ScoredSet): boolean {
  return set.type !== 'warmup' && set.reps > 0
}

function entry(set: ScoredSet, value: number): RecordEntry {
  return { value, kg: set.kg, reps: set.reps, at: set.at, setId: set.id }
}

/** Garde l'ancien record en cas d'égalité : la date est celle où il a été atteint la première fois. */
function better(current: RecordEntry | null, candidate: RecordEntry): RecordEntry {
  return current === null || candidate.value > current.value ? candidate : current
}

/** Records d'un exercice, à partir de toutes ses séries d'une même portée (voir recordScope). */
export function computeRecords(sets: readonly ScoredSet[]): ExerciseRecords {
  const chronological = sets.filter(counts).sort((a, b) => a.at - b.at)
  let actualOneRm: RecordEntry | null = null
  let estimatedOneRm: RecordEntry | null = null
  let maxWeight: RecordEntry | null = null
  let maxReps: RecordEntry | null = null
  let bestSetVolume: RecordEntry | null = null
  const byWeight = new Map<number, RecordEntry>()

  for (const set of chronological) {
    maxReps = better(maxReps, entry(set, set.reps))
    if (set.kg <= 0) continue

    const kg = round2(set.kg)
    if (set.reps === 1) actualOneRm = better(actualOneRm, entry(set, kg))
    const e1rm = estimateOneRm(set)
    if (e1rm !== null) estimatedOneRm = better(estimatedOneRm, entry(set, e1rm))
    maxWeight = better(maxWeight, entry(set, kg))
    bestSetVolume = better(bestSetVolume, entry(set, round2(set.kg * set.reps)))
    byWeight.set(kg, better(byWeight.get(kg) ?? null, entry(set, set.reps)))
  }

  return {
    actualOneRm,
    estimatedOneRm,
    maxWeight,
    maxReps,
    bestSetVolume,
    repsByWeight: [...byWeight.values()].sort((a, b) => b.kg - a.kg),
  }
}

/**
 * Records battus pendant une séance, série par série, pour les marquer en direct :
 * - `weight` : charge plus lourde que tout ce qui a été fait avant ;
 * - `volume` : charge × reps supérieur à la meilleure série d'avant.
 * Chaque série est comparée à l'historique et aux séries précédentes de la séance.
 * Sans historique (premier essai de l'exercice), aucune série n'est marquée.
 */
export function recordsInWorkout(
  history: readonly ScoredSet[],
  workout: readonly ScoredSet[],
): Map<string, RecordKind[]> {
  const flags = new Map<string, RecordKind[]>()
  const previous = history.filter((s) => counts(s) && s.kg > 0)
  if (previous.length === 0) return flags

  let bestKg = Math.max(...previous.map((s) => round2(s.kg)))
  let bestVolume = Math.max(...previous.map((s) => round2(s.kg * s.reps)))

  for (const set of [...workout].filter(counts).sort((a, b) => a.at - b.at)) {
    if (set.kg <= 0) continue
    const kinds: RecordKind[] = []
    const kg = round2(set.kg)
    const volume = round2(set.kg * set.reps)
    if (kg > bestKg) {
      kinds.push('weight')
      bestKg = kg
    }
    if (volume > bestVolume) {
      kinds.push('volume')
      bestVolume = volume
    }
    if (kinds.length > 0) flags.set(set.id, kinds)
  }
  return flags
}
