const kgFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

/** Affiche une charge à la française : 2,5 kg, 1 250 kg (au plus deux décimales). */
export function formatKg(kg: number): string {
  return `${kgFormatter.format(kg)} kg`
}
