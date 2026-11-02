import { estimateOneRm } from './oneRm'
import { round2 } from './units'
import type { ScoredSet } from './types'

/** Une séance d'un exercice, résumée pour les courbes de progression. */
export interface SessionPoint {
  workoutId: string
  /** Heure de la première série de la séance. */
  at: number
  /** Meilleur 1RM estimé de la séance (null si aucune série de 1 à 10 reps). */
  e1rm: number | null
  /** Charge la plus lourde de la séance. */
  maxKg: number
  /** Volume (charge × reps) de la séance. */
  volume: number
  /** Meilleure série : la plus lourde, puis la plus longue. */
  best: { kg: number; reps: number }
}

/** Points par séance (échauffements exclus), du plus ancien au plus récent. */
export function sessionSeries(
  sets: readonly (ScoredSet & { workoutId: string })[],
): SessionPoint[] {
  const byWorkout = new Map<string, (ScoredSet & { workoutId: string })[]>()
  for (const set of sets) {
    if (set.type === 'warmup' || set.reps <= 0) continue
    byWorkout.set(set.workoutId, [...(byWorkout.get(set.workoutId) ?? []), set])
  }
  return [...byWorkout]
    .map(([workoutId, own]) => {
      let e1rm: number | null = null
      let best = own[0]!
      let volume = 0
      for (const set of own) {
        const estimate = estimateOneRm(set)
        if (estimate !== null && (e1rm === null || estimate > e1rm)) e1rm = estimate
        if (set.kg > best.kg || (set.kg === best.kg && set.reps > best.reps)) best = set
        volume += set.kg * set.reps
      }
      return {
        workoutId,
        at: Math.min(...own.map((s) => s.at)),
        e1rm,
        maxKg: round2(best.kg),
        volume: round2(volume),
        best: { kg: round2(best.kg), reps: best.reps },
      }
    })
    .sort((a, b) => a.at - b.at)
}

/**
 * Graduations « rondes » couvrant [min, max] (pas de 1, 2, 2,5 ou 5 × 10ⁿ), pour un axe lisible.
 * Renvoie au moins deux valeurs.
 */
export function niceTicks(min: number, max: number, target = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  if (max === min) {
    const pad = Math.abs(max) * 0.1 || 1
    min -= pad
    max += pad
  }
  const rough = (max - min) / target
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 1e-9; v += step) ticks.push(round2(v))
  if (ticks[ticks.length - 1]! < max) ticks.push(round2(start + ticks.length * step))
  return ticks
}
