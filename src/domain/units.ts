/** Arrondit au centième : évite les 0,30000000000000004 kg dans les comparaisons et l'affichage. */
export function round2(x: number): number {
  return Math.round(x * 100) / 100
}

/** Lit un nombre saisi à la française (« 63,5 ») ; null si la saisie n'est pas un nombre positif. */
export function parseDecimal(input: string): number | null {
  const text = input.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(text)) return null
  return Number(text)
}

/**
 * Fourchette de reps saisie : entiers ≥ 1, bornes remises dans l'ordre.
 * null si l'une des deux manque (pas de fourchette = pas de suggestion de progression).
 */
export function normalizeRepRange(
  min: number | null,
  max: number | null,
): { min: number; max: number } | null {
  if (min === null || max === null) return null
  const a = Math.max(1, Math.round(min))
  const b = Math.max(1, Math.round(max))
  return { min: Math.min(a, b), max: Math.max(a, b) }
}
