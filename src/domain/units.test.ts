import { describe, expect, it } from 'vitest'
import { normalizeRepRange, parseDecimal, round2 } from './units'

describe('round2', () => {
  it('arrondit au centième', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(47.666)).toBe(47.67)
  })
})

describe('parseDecimal', () => {
  it('accepte la virgule et le point', () => {
    expect(parseDecimal('63,5')).toBe(63.5)
    expect(parseDecimal(' 64.2 ')).toBe(64.2)
    expect(parseDecimal('64')).toBe(64)
  })

  it('refuse les saisies invalides', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('-3')).toBeNull()
    expect(parseDecimal('6,3,5')).toBeNull()
  })
})

describe('normalizeRepRange', () => {
  it('garde une fourchette valide', () => {
    expect(normalizeRepRange(8, 12)).toEqual({ min: 8, max: 12 })
  })

  it('remet les bornes dans l’ordre et arrondit', () => {
    expect(normalizeRepRange(12.4, 7.6)).toEqual({ min: 8, max: 12 })
  })

  it('accepte une fourchette d’une seule valeur et refuse zéro', () => {
    expect(normalizeRepRange(5, 5)).toEqual({ min: 5, max: 5 })
    expect(normalizeRepRange(0, 3)).toEqual({ min: 1, max: 3 })
  })

  it('renvoie null s’il manque une borne', () => {
    expect(normalizeRepRange(8, null)).toBeNull()
    expect(normalizeRepRange(null, null)).toBeNull()
  })
})
