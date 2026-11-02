import { describe, expect, it } from 'vitest'
import { DEFAULT_EXERCISES } from '../../data/exercises'
import { DEFAULT_GYMS } from '../../data/defaultGyms'
import type { SetRow, Workout } from '../../db/types'
import { buildSummaries } from './summaries'

const exercises = new Map(DEFAULT_EXERCISES.map((e) => [e.id, e]))
const gyms = new Map(DEFAULT_GYMS.map((g) => [g.id, g]))
const DAY = 86_400_000

function workout(id: string, day: number, blocks: [string, string][], gymId = 'on-air'): Workout {
  return {
    id,
    title: `Séance ${id}`,
    gymId,
    templateId: null,
    startedAt: day * DAY,
    endedAt: day * DAY + 3_600_000,
    notes: '',
    status: 'done',
    blocks: blocks.map(([blockId, exerciseId]) => ({
      id: blockId,
      exerciseId,
      supersetId: null,
      notes: '',
      restSec: null,
    })),
    restEndsAt: null,
    source: 'app',
  }
}

let seq = 0
function set(
  w: Workout,
  blockId: string,
  kg: number,
  reps: number,
  type: SetRow['type'] = 'normal',
): SetRow {
  seq += 1
  const exerciseId = w.blocks.find((b) => b.id === blockId)!.exerciseId
  return {
    id: `s${seq}`,
    workoutId: w.id,
    blockId,
    exerciseId,
    gymId: w.gymId,
    order: seq,
    type,
    reps,
    kg,
    rir: null,
    at: w.startedAt + seq * 1000,
    done: true,
  }
}

describe('buildSummaries', () => {
  const w1 = workout('w1', 1, [
    ['b1', 'squat'],
    ['b2', 'pull-up'],
  ])
  const w2 = workout('w2', 3, [
    ['b3', 'squat'],
    ['b4', 'pull-up'],
  ])
  const sets = [
    set(w1, 'b1', 60, 10, 'warmup'),
    set(w1, 'b1', 100, 5),
    set(w1, 'b2', 0, 8),
    set(w2, 'b3', 105, 3),
    set(w2, 'b3', 100, 6),
    set(w2, 'b4', 10, 6),
  ]
  const summaries = buildSummaries({
    workouts: [w1, w2],
    sets,
    exercises,
    gyms,
    bodyweights: [{ at: 0, kg: 64 }],
    links: [],
  })

  it('trie de la plus récente à la plus ancienne', () => {
    expect(summaries.map((s) => s.id)).toEqual(['w2', 'w1'])
    expect(summaries[0]?.durationMin).toBe(60)
    expect(summaries[0]?.gym.name).toBe('On Air')
  })

  it('calcule le volume avec la charge effective, hors échauffement', () => {
    // w1 : squat 100 × 5 + tractions (64 + 0) × 8.
    expect(summaries[1]?.volumeKg).toBe(500 + 64 * 8)
  })

  it('donne la meilleure série et les records de chaque exercice', () => {
    const [squat, pullUp] = summaries[0]!.exercises
    expect(squat).toMatchObject({
      name: 'Squat (barre)',
      sets: 2,
      best: { kg: 105, reps: 3 },
      records: ['weight', 'volume'],
    })
    // Tractions : 74 kg effectifs × 6 = 444 < 64 × 8 = 512 : record de charge seulement.
    expect(pullUp).toMatchObject({
      best: { kg: 10, reps: 6 },
      bodyweight: true,
      records: ['weight'],
    })
  })

  it('ne marque aucun record lors de la première séance', () => {
    expect(summaries[1]?.exercises.every((e) => e.records.length === 0)).toBe(true)
  })

  it('ignore les séances en cours', () => {
    const active = { ...workout('w3', 5, [['b5', 'squat']]), status: 'active' as const }
    const result = buildSummaries({
      workouts: [w1, active],
      sets,
      exercises,
      gyms,
      bodyweights: [],
      links: [],
    })
    expect(result.map((s) => s.id)).toEqual(['w1'])
  })
})
