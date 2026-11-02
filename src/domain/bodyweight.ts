import { round2 } from './units'

export interface BodyweightEntry {
  /** Date de la pesée (ms). */
  at: number
  kg: number
}

/**
 * Poids de corps à une date donnée : interpolation linéaire entre les deux pesées qui l'encadrent,
 * première pesée avant celle-ci, dernière après. null sans aucune pesée.
 */
export function bodyweightAt(at: number, entries: readonly BodyweightEntry[]): number | null {
  if (entries.length === 0) return null
  const sorted = [...entries].sort((a, b) => a.at - b.at)
  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!
  if (at <= first.at) return first.kg
  if (at >= last.at) return last.kg

  const nextIndex = sorted.findIndex((e) => e.at >= at)
  const next = sorted[nextIndex]!
  const prev = sorted[nextIndex - 1]!
  if (next.at === at) return next.kg
  const t = (at - prev.at) / (next.at - prev.at)
  return round2(prev.kg + t * (next.kg - prev.kg))
}
