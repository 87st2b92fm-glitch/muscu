import { describe, expect, it } from 'vitest'
import { DEFAULT_EXERCISES } from '../../data/exercises'
import type { SetRow, Workout } from '../../db/types'
import type { SummaryInput } from '../home/summaries'
import { performancesForGym } from './performance'

const exercises = new Map(DEFAULT_EXERCISES.map((e) => [e.id, e]))

function workout(id: string, gymId: string, at: number): Workout {
  return {
    id,
    title: id,
    gymId,
    templateId: null,
    startedAt: at,
    endedAt: at + 1,
    notes: '',
    status: 'done',
    blocks: [],
    restEndsAt: null,
    source: 'app',
  }
}
let seq = 0
function set(w: Workout, exerciseId: string, kg: number, reps: number): SetRow {
  seq += 1
  return {
    id: `s${seq}`,
    workoutId: w.id,
    blockId: 'b',
    exerciseId,
    gymId: w.gymId,
    order: seq,
    type: 'normal',
    reps,
    kg,
    rir: null,
    at: w.startedAt + seq,
    done: true,
  }
}

describe('performancesForGym', () => {
  const onAir = workout('w1', 'on-air', 1000)
  const basic = workout('w2', 'basic', 2000)
  const input: SummaryInput = {
    workouts: [onAir, basic],
    sets: [
      set(onAir, 'squat', 100, 5),
      set(basic, 'squat', 105, 3),
      set(onAir, 'leg-extension', 75, 8),
      set(basic, 'leg-extension', 50, 12),
      set(onAir, 'pull-up', 10, 6),
    ],
    exercises,
    gyms: new Map(),
    bodyweights: [{ at: 0, kg: 64 }],
    links: [],
  }

  it('compte les poids libres de toutes les salles et les machines de la salle choisie', () => {
    const fromBasic = performancesForGym(input, 'basic')
    const squat = fromBasic.find((p) => p.exercise.id === 'squat')
    expect(squat?.series).toHaveLength(2)
    expect(squat?.records.maxWeight?.value).toBe(105)
    const legExtension = fromBasic.find((p) => p.exercise.id === 'leg-extension')
    expect(legExtension?.records.maxWeight?.value).toBe(50)
    expect(fromBasic.find((p) => p.exercise.id === 'pull-up')).toBeDefined()
  })

  it('fusionne les machines liées entre deux salles', () => {
    const linked = performancesForGym(
      {
        ...input,
        links: [
          { exerciseId: 'leg-extension', gymId: 'on-air', linkGroupId: 'g' },
          { exerciseId: 'leg-extension', gymId: 'basic', linkGroupId: 'g' },
        ],
      },
      'basic',
    )
    expect(linked.find((p) => p.exercise.id === 'leg-extension')?.records.maxWeight?.value).toBe(75)
  })

  it('utilise la charge effective pour les exercices lestés et trie du plus récent au plus ancien', () => {
    const fromOnAir = performancesForGym(input, 'on-air')
    expect(fromOnAir.find((p) => p.exercise.id === 'pull-up')?.records.maxWeight?.value).toBe(74)
    expect(fromOnAir[0]?.exercise.id).toBe('squat')
  })
})
