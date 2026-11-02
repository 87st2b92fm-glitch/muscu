import { describe, expect, it } from 'vitest'
import { bodyweightAt } from './bodyweight'

const day = (d: number) => Date.UTC(2026, 0, d)

describe('bodyweightAt', () => {
  const entries = [
    { at: day(21), kg: 66 },
    { at: day(1), kg: 62 },
  ]

  it('renvoie null sans pesée', () => {
    expect(bodyweightAt(day(5), [])).toBeNull()
  })

  it('prend la première pesée avant celle-ci', () => {
    expect(bodyweightAt(Date.UTC(2025, 5, 1), entries)).toBe(62)
  })

  it('prend la dernière pesée après celle-ci', () => {
    expect(bodyweightAt(Date.UTC(2026, 5, 1), entries)).toBe(66)
  })

  it('interpole linéairement entre deux pesées (même non triées)', () => {
    expect(bodyweightAt(day(11), entries)).toBe(64)
    expect(bodyweightAt(day(6), entries)).toBe(63)
  })

  it('renvoie la pesée exacte le jour même', () => {
    expect(bodyweightAt(day(21), entries)).toBe(66)
  })
})
