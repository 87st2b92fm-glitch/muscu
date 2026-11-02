import { describe, expect, it } from 'vitest'
import { formatBodyweightSet, formatDay, formatDuration, formatKg, formatSet } from './format'

describe('formatKg', () => {
  it('affiche les entiers sans décimale', () => {
    expect(formatKg(100)).toBe('100 kg')
  })

  it('utilise la virgule décimale', () => {
    expect(formatKg(2.5)).toBe('2,5 kg')
  })

  it('garde deux décimales pour les charges non rondes', () => {
    expect(formatKg(2.27)).toBe('2,27 kg')
  })

  it('masque les erreurs de virgule flottante', () => {
    expect(formatKg(0.1 + 0.2)).toBe('0,3 kg')
  })

  it('sépare les milliers', () => {
    expect(formatKg(1250)).toMatch(/^1\s250 kg$/u)
  })
})

describe('formatSet', () => {
  it('affiche charge et reps', () => {
    expect(formatSet(82.5, 8)).toBe('82,5 kg × 8')
  })
})

describe('formatBodyweightSet', () => {
  it('affiche le poids du corps seul ou avec lest', () => {
    expect(formatBodyweightSet(0, 8)).toBe('PDC × 8')
    expect(formatBodyweightSet(10, 6)).toBe('PDC + 10 kg × 6')
  })
})

describe('formatDuration', () => {
  it('affiche les minutes sous une heure', () => {
    expect(formatDuration(45)).toBe('45 min')
  })

  it('affiche heures et minutes sur deux chiffres', () => {
    expect(formatDuration(65)).toBe('1 h 05')
  })

  it('arrondit à la minute', () => {
    expect(formatDuration(59.6)).toBe('1 h 00')
  })
})

describe('formatDay', () => {
  const now = new Date(2026, 10, 2, 21, 0)

  it("dit « Aujourd'hui » pour le jour même", () => {
    expect(formatDay(new Date(2026, 10, 2, 7, 30), now)).toBe('Aujourd’hui')
  })

  it('dit « Hier » pour la veille, même tard le soir', () => {
    expect(formatDay(new Date(2026, 10, 1, 23, 50), now)).toBe('Hier')
  })

  it('affiche la date courte au-delà', () => {
    expect(formatDay(new Date(2026, 9, 29, 18, 0), now)).toBe('jeu. 29 oct.')
  })
})
