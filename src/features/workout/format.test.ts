import { describe, expect, it } from 'vitest'
import { formatClock } from './format'

describe('formatClock', () => {
  it('affiche minutes et secondes', () => {
    expect(formatClock(65_000)).toBe('1:05')
    expect(formatClock(0)).toBe('0:00')
  })

  it('ajoute les heures au-delà d’une heure', () => {
    expect(formatClock(3_729_000)).toBe('1:02:09')
  })

  it('arrondit et ne descend pas sous zéro', () => {
    expect(formatClock(1_499)).toBe('0:01')
    expect(formatClock(-5_000)).toBe('0:00')
  })
})
