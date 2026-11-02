import { describe, expect, it } from 'vitest'
import { effectiveKg, volumeOf } from './load'
import type { ScoredSet } from './types'

describe('effectiveKg', () => {
  it('garde la charge saisie pour un exercice avec charge externe', () => {
    expect(effectiveKg(80, 'external', 64)).toBe(80)
  })

  it('ajoute le poids de corps au lest', () => {
    expect(effectiveKg(10, 'bodyweight', 64)).toBe(74)
  })

  it('compte le poids de corps seul sans lest', () => {
    expect(effectiveKg(0, 'bodyweight', 63.5)).toBe(63.5)
  })

  it('renvoie null si le poids de corps est inconnu', () => {
    expect(effectiveKg(10, 'bodyweight', null)).toBeNull()
  })
})

describe('volumeOf', () => {
  const set = (type: ScoredSet['type'], kg: number, reps: number): ScoredSet => ({
    id: `${type}-${kg}-${reps}`,
    at: 0,
    type,
    kg,
    reps,
  })

  it('additionne charge × reps hors échauffement', () => {
    expect(
      volumeOf([
        set('warmup', 40, 10),
        set('normal', 80, 8),
        set('normal', 80, 7),
        set('drop', 60, 10),
      ]),
    ).toBe(80 * 8 + 80 * 7 + 60 * 10)
  })

  it('évite les erreurs de virgule flottante', () => {
    expect(volumeOf([set('normal', 22.6, 3)])).toBe(67.8)
  })
})
