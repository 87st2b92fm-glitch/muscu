const kgFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const dayWithYearFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** Nombre à la française, au plus deux décimales : « 2,27 ». */
export function formatNumber(value: number): string {
  return kgFormatter.format(value)
}

/** Affiche une charge à la française : 2,5 kg, 1 250 kg (au plus deux décimales). */
export function formatKg(kg: number): string {
  return `${kgFormatter.format(kg)} kg`
}

/** Une série : « 80 kg × 8 ». */
export function formatSet(kg: number, reps: number): string {
  return `${formatKg(kg)} × ${reps}`
}

/** Série d'un exercice au poids du corps : « PDC × 8 », « PDC + 10 kg × 6 ». */
export function formatBodyweightSet(lestKg: number, reps: number): string {
  return lestKg > 0 ? `PDC + ${formatKg(lestKg)} × ${reps}` : `PDC × ${reps}`
}

/** Durée d'une séance : « 45 min », « 1 h 05 ». */
export function formatDuration(minutes: number): string {
  const total = Math.round(minutes)
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h} h ${String(m).padStart(2, '0')}`
}

/**
 * Date relative : « Aujourd'hui », « Hier », « lun. 2 nov. » cette année, « 6 août 2025 » avant.
 */
export function formatDay(date: Date, now: Date = new Date()): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days === 0) return 'Aujourd’hui'
  if (days === 1) return 'Hier'
  return date.getFullYear() === now.getFullYear()
    ? dayFormatter.format(date)
    : dayWithYearFormatter.format(date)
}
