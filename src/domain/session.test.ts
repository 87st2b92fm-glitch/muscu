import { describe, expect, it } from 'vitest'
import { incrementFor, lastSessionSets, plannedSets, type PastSet } from './session'
import type { SetEntry } from './types'

const past = (workoutId: string, at: number, order: number, kg: number, reps: number): PastSet => ({
  workoutId,
  at,
  order,
  kg,
  reps,
  type: 'normal',
})
const s = (kg: number, reps: number, type: SetEntry['type'] = 'normal'): SetEntry => ({
  kg,
  reps,
  type,
})

describe('lastSessionSets', () => {
  it('renvoie les séries de la séance la plus récente, dans l’ordre', () => {
    const history = [past('w1', 10, 0, 80, 8), past('w2', 22, 1, 85, 6), past('w2', 21, 0, 85, 7)]
    expect(lastSessionSets(history).map((x) => x.reps)).toEqual([7, 6])
  })

  it('renvoie une liste vide sans historique', () => {
    expect(lastSessionSets([])).toEqual([])
  })
})

describe('incrementFor', () => {
  const gym = {
    plates: [
      { kg: 1.25, pairs: 2 },
      { kg: 20, pairs: 4 },
    ],
    dumbbellIncrementKg: 2,
  }

  it('utilise deux petits disques pour la barre et la Smith', () => {
    expect(incrementFor('barbell', gym, null)).toBe(2.5)
    expect(incrementFor('smith', gym, null)).toBe(2.5)
  })

  it('utilise le réglage de la machine, même non rond', () => {
    expect(incrementFor('cable', gym, 2.27)).toBe(2.27)
    expect(incrementFor('machine', gym, null)).toBeNull()
  })

  it('utilise l’écart entre haltères et un disque pour un lest', () => {
    expect(incrementFor('dumbbell', gym, null)).toBe(2)
    expect(incrementFor('bodyweight', gym, null)).toBe(1.25)
  })
})

describe('plannedSets', () => {
  it('reprend la dernière séance, échauffements compris', () => {
    expect(plannedSets(3, [s(40, 10, 'warmup'), s(80, 8), s(80, 7)], null)).toEqual([
      s(40, 10, 'warmup'),
      s(80, 8),
      s(80, 7),
    ])
  })

  it('complète avec la dernière série s’il y en a plus que la dernière fois', () => {
    expect(plannedSets(3, [s(80, 8)], null)).toEqual([s(80, 8), s(80, 8), s(80, 8)])
  })

  it('part de zéro sans historique', () => {
    expect(plannedSets(2, [], null)).toEqual([s(0, 0), s(0, 0)])
  })

  it('applique une montée de charge aux séries de travail', () => {
    const previous = [s(40, 10, 'warmup'), s(60, 12), s(60, 12)]
    const planned = plannedSets(3, previous, { action: 'increase', fromKg: 60, kg: 62.5, reps: 8 })
    expect(planned).toEqual([s(40, 10, 'warmup'), s(62.5, 8), s(62.5, 8)])
  })

  it('garde la charge et vise une rep de plus', () => {
    const planned = plannedSets(2, [s(60, 12), s(60, 10)], {
      action: 'keep',
      kg: 60,
      reps: [12, 11],
    })
    expect(planned).toEqual([s(60, 12), s(60, 11)])
  })

  it('ne recopie pas une série dégressive comme dégressive', () => {
    expect(plannedSets(1, [s(40, 12, 'drop')], null)[0]?.type).toBe('normal')
  })
})
