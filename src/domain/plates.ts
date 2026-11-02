import { round2 } from './units'

/** Disques disponibles dans une salle : charge d'un disque et nombre de paires. */
export interface PlateStock {
  kg: number
  pairs: number
}

export interface PlateLoad {
  /** Disques à mettre de chaque côté, du plus lourd au plus léger. */
  perSide: number[]
  /** Charge obtenue, barre comprise. */
  totalKg: number
  /** false si la charge cible n'est pas réalisable : on donne la plus proche en dessous. */
  exact: boolean
}

/**
 * Disques à charger de chaque côté pour approcher au mieux `targetKg` sans la dépasser,
 * avec le moins de disques possible, les plus lourds en priorité. Recherche exacte au centième de kg :
 * un choix glouton échoue quand le stock est limité. null si la cible est sous la barre.
 */
export function loadBar(
  targetKg: number,
  barKg: number,
  stock: readonly PlateStock[],
): PlateLoad | null {
  if (targetKg < barKg) return null
  const wantedHundredths = Math.round((targetKg - barKg) * 100)
  const cap = Math.floor(wantedHundredths / 2)

  // Types de disques en centièmes de kg, du plus lourd au plus léger, doublons fusionnés.
  const counts = new Map<number, number>()
  for (const plate of stock) {
    const w = Math.round(plate.kg * 100)
    if (w > 0 && plate.pairs > 0) counts.set(w, (counts.get(w) ?? 0) + plate.pairs)
  }
  const types = [...counts].sort((a, b) => b[0] - a[0])

  // fewest[a] : nombre minimal de disques pour obtenir exactement a par côté.
  const UNREACHABLE = Number.MAX_SAFE_INTEGER
  const fewest = new Array<number>(cap + 1).fill(UNREACHABLE)
  fewest[0] = 0
  for (const [w, n] of types) {
    for (let copy = 0; copy < n; copy++) {
      for (let a = cap; a >= w; a--) {
        if (fewest[a - w]! + 1 < fewest[a]!) fewest[a] = fewest[a - w]! + 1
      }
    }
  }

  let best = cap
  while (best > 0 && fewest[best] === UNREACHABLE) best--

  // À nombre de disques égal, on préfère les plus lourds (25 + 15 plutôt que 20 + 20).
  function pick(typeIndex: number, remaining: number, platesLeft: number): number[] | null {
    if (remaining === 0) return []
    const type = types[typeIndex]
    if (!type || platesLeft === 0) return null
    const [w, n] = type
    for (let c = Math.min(n, Math.floor(remaining / w), platesLeft); c >= 0; c--) {
      const rest = pick(typeIndex + 1, remaining - c * w, platesLeft - c)
      if (rest) return [...Array<number>(c).fill(w / 100), ...rest]
    }
    return null
  }
  const perSide = pick(0, best, fewest[best]!) ?? []

  return {
    perSide,
    totalKg: round2(barKg + (2 * best) / 100),
    exact: best * 2 === wantedHundredths,
  }
}
