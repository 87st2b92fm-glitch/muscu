/** Arrondit au centième : évite les 0,30000000000000004 kg dans les comparaisons et l'affichage. */
export function round2(x: number): number {
  return Math.round(x * 100) / 100
}
