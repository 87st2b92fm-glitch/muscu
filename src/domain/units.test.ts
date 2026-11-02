import { describe, expect, it } from 'vitest'
import { parseDecimal, round2 } from './units'

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
