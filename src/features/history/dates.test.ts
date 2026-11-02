import { describe, expect, it } from 'vitest'
import { formatLongDate, fromDateTimeLocal, toDateTimeLocal } from './dates'

describe('dates de séance', () => {
  const at = new Date(2026, 9, 18, 14, 24).getTime()

  it('affiche la date en toutes lettres', () => {
    expect(formatLongDate(at)).toBe('dimanche 18 octobre 2026 à 14:24')
  })

  it('fait l’aller-retour avec un champ datetime-local', () => {
    expect(toDateTimeLocal(at)).toBe('2026-10-18T14:24')
    expect(fromDateTimeLocal('2026-10-18T14:24')).toBe(at)
  })

  it('refuse une saisie vide ou invalide', () => {
    expect(fromDateTimeLocal('')).toBeNull()
    expect(fromDateTimeLocal('n’importe quoi')).toBeNull()
  })
})
