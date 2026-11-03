import { describe, expect, it } from 'vitest'
import { DEFAULT_EXERCISES } from '../data/exercises'
import { buildContext, type ContextData } from './exerciseContext'
import { defaultGyms } from './seed'
import type { SetRow } from './types'

let seq = 0
const set = (
  workoutId: string,
  at: number,
  kg: number,
  reps: number,
  type: SetRow['type'] = 'normal',
): SetRow => {
  seq += 1
  return {
    id: `s${seq}`,
    workoutId,
    blockId: 'b',
    exerciseId: 'pull-up',
    gymId: 'on-air',
    order: seq,
    type,
    reps,
    kg,
    rir: null,
    at,
    done: true,
  }
}

function data(sets: SetRow[]): ContextData {
  return {
    exercises: new Map(DEFAULT_EXERCISES.map((e) => [e.id, e])),
    gym: defaultGyms()[0]!,
    links: [],
    machineIncrements: new Map(),
    bodyweights: [{ id: 'bw', at: 0, kg: 64 }],
    sets,
  }
}

describe('buildContext', () => {
  it('donne la dernière séance et la meilleure série (poids du corps inclus), telle que saisie', () => {
    const sets = [
      set('w1', 1, 20, 3), // (64 + 20) × 3 = 252
      set('w1', 2, 0, 12), // 64 × 12 = 768 : meilleure
      set('w2', 10, 10, 8), // 74 × 8 = 592
      set('w2', 11, 40, 20, 'warmup'), // échauffement ignoré
    ]
    const context = buildContext(data(sets), 'pull-up', null)!
    expect(context.previous.map((s) => s.workoutId)).toEqual(['w2', 'w2'])
    expect(context.best).toMatchObject({ kg: 0, reps: 12 })
  })

  it('n’a pas de meilleure série sans historique', () => {
    expect(buildContext(data([]), 'pull-up', null)?.best).toBeNull()
  })
})
