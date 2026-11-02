import { describe, expect, it } from 'vitest'
import { formatKg } from './format'

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
