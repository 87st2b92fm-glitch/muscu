import { describe, expect, it } from 'vitest'
import { niceTicks, sessionSeries } from './progress'
import type { ScoredSet, SetType } from './types'

let seq = 0
const set = (workoutId: string, at: number, kg: number, reps: number, type: SetType = 'normal') => {
  seq += 1
  return { id: `s${seq}`, workoutId, at, kg, reps, type } satisfies ScoredSet & {
    workoutId: string
  }
}

describe('sessionSeries', () => {
  it('résume chaque séance, de la plus ancienne à la plus récente', () => {
    const series = sessionSeries([
      set('w2', 200, 90, 5),
      set('w1', 100, 60, 10, 'warmup'),
      set('w1', 101, 80, 8),
      set('w1', 102, 80, 9),
      set('w2', 201, 85, 6),
    ])
    expect(series.map((p) => p.workoutId)).toEqual(['w1', 'w2'])
    expect(series[0]).toMatchObject({
      at: 101,
      maxKg: 80,
      volume: 80 * 8 + 80 * 9,
      best: { kg: 80, reps: 9 },
    })
    // 80 × (1 + 9/30) = 104 ; 90 × (1 + 5/30) = 105.
    expect(series[0]?.e1rm).toBe(104)
    expect(series[1]?.e1rm).toBe(105)
  })

  it('n’a pas de 1RM estimé sans série de 1 à 10 reps', () => {
    expect(sessionSeries([set('w', 1, 20, 15)])[0]?.e1rm).toBeNull()
  })

  it('ignore une séance faite seulement d’échauffements', () => {
    expect(sessionSeries([set('w', 1, 40, 10, 'warmup')])).toEqual([])
  })
})

describe('niceTicks', () => {
  it('donne des graduations rondes couvrant l’intervalle', () => {
    expect(niceTicks(62, 118)).toEqual([60, 80, 100, 120])
    expect(niceTicks(0, 9720)).toEqual([0, 2500, 5000, 7500, 10000])
  })

  it('élargit un intervalle nul', () => {
    const ticks = niceTicks(80, 80)
    expect(ticks[0]).toBeLessThan(80)
    expect(ticks[ticks.length - 1]).toBeGreaterThan(80)
  })
})
