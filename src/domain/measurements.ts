import type { MeasurementKey } from '../db/types'
import { round2 } from './units'

export interface Point {
  at: number
  value: number
}

/** Valeurs d'une mensuration dans le temps (relevés qui la contiennent), du plus ancien au plus récent. */
export function measurementSeries(
  rows: readonly { at: number; values: Partial<Record<MeasurementKey, number>> }[],
  key: MeasurementKey,
): Point[] {
  return rows
    .flatMap((r) => {
      const value = r.values[key]
      return value === undefined ? [] : [{ at: r.at, value }]
    })
    .sort((a, b) => a.at - b.at)
}

/** Dernière valeur et écart avec la précédente (null s'il n'y en a qu'une). */
export function latestChange(series: readonly Point[]): (Point & { delta: number | null }) | null {
  const last = series[series.length - 1]
  if (!last) return null
  const previous = series[series.length - 2]
  return { ...last, delta: previous ? round2(last.value - previous.value) : null }
}

/** Écart signé à la française : « +0,5 », « −1,2 », « = ». */
export function formatDelta(delta: number): string {
  if (delta === 0) return '='
  const text = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Math.abs(delta))
  return `${delta > 0 ? '+' : '−'}${text}`
}
