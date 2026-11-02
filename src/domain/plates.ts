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

const UNREACHABLE = Number.MAX_SAFE_INTEGER

/** Types de disques en centièmes de kg, du plus lourd au plus léger, doublons fusionnés. */
function plateTypes(stock: readonly PlateStock[]): [number, number][] {
  const counts = new Map<number, number>()
  for (const plate of stock) {
    const w = Math.round(plate.kg * 100)
    if (w > 0 && plate.pairs > 0) counts.set(w, (counts.get(w) ?? 0) + plate.pairs)
  }
  return [...counts].sort((a, b) => b[0] - a[0])
}

/** fewest[a] : nombre minimal de disques pour obtenir exactement a (centièmes) par côté. */
function fewestTable(types: readonly [number, number][], cap: number): number[] {
  const fewest = new Array<number>(cap + 1).fill(UNREACHABLE)
  fewest[0] = 0
  for (const [w, n] of types) {
    for (let copy = 0; copy < n; copy++) {
      for (let a = cap; a >= w; a--) {
        if (fewest[a - w]! + 1 < fewest[a]!) fewest[a] = fewest[a - w]! + 1
      }
    }
  }
  return fewest
}

/** À nombre de disques égal, on préfère les plus lourds (25 + 15 plutôt que 20 + 20). */
function pickPlates(types: readonly [number, number][], amount: number, count: number): number[] {
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
  return pick(0, amount, count) ?? []
}

function result(
  types: readonly [number, number][],
  fewest: readonly number[],
  perSideHundredths: number,
  barKg: number,
  wantedHundredths: number,
): PlateLoad {
  return {
    perSide: pickPlates(types, perSideHundredths, fewest[perSideHundredths]!),
    totalKg: round2(barKg + (2 * perSideHundredths) / 100),
    exact: perSideHundredths * 2 === wantedHundredths,
  }
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
  const wanted = Math.round((targetKg - barKg) * 100)
  const cap = Math.floor(wanted / 2)
  const types = plateTypes(stock)
  const fewest = fewestTable(types, cap)
  let best = cap
  while (best > 0 && fewest[best] === UNREACHABLE) best--
  return result(types, fewest, best, barKg, wanted)
}

/**
 * Charge réalisable la plus proche au-dessus de `targetKg` (ou égale). null si le stock de la
 * salle ne permet pas d'atteindre la cible.
 */
export function loadBarAbove(
  targetKg: number,
  barKg: number,
  stock: readonly PlateStock[],
): PlateLoad | null {
  // Négatif si la cible est sous la barre : la barre seule convient alors, sans être exacte.
  const wanted = Math.round((targetKg - barKg) * 100)
  const types = plateTypes(stock)
  const cap = types.reduce((sum, [w, n]) => sum + w * n, 0)
  const fewest = fewestTable(types, cap)
  for (let a = Math.max(0, Math.ceil(wanted / 2)); a <= cap; a++) {
    if (fewest[a] !== UNREACHABLE) return result(types, fewest, a, barKg, wanted)
  }
  return null
}
