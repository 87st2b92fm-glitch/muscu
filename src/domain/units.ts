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
