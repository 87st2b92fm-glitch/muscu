const longFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** « dimanche 18 octobre 2026 à 14:24 » */
export function formatLongDate(at: number): string {
  return longFormatter.format(at)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Valeur d'un champ `datetime-local` (heure locale) : « 2026-10-18T14:24 ». */
export function toDateTimeLocal(at: number): string {
  const d = new Date(at)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Inverse de `toDateTimeLocal` ; null si la saisie est vide ou invalide. */
export function fromDateTimeLocal(value: string): number | null {
  if (!value) return null
  const at = new Date(value).getTime()
  return Number.isNaN(at) ? null : at
}
