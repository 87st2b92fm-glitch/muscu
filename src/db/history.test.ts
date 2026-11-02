import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppDB } from './db'
import type { SetRow, Workout } from './types'

const testDb = vi.hoisted(() => ({ current: null as unknown as AppDB }))
vi.mock('./db', async (importOriginal) => {
  const original = await importOriginal<typeof import('./db')>()
  return {
    ...original,
    get db() {
      return testDb.current
    },
  }
})

const { addPastExercise, addPastSet, saveAsTemplate, updateWorkoutTimes } =
  await import('./history')
const db = () => testDb.current
const START = new Date(2026, 9, 18, 14, 0).getTime()

beforeEach(async () => {
  testDb.current = new AppDB(`test-${crypto.randomUUID()}`)
  const workout: Workout = {
    id: 'w',
    title: 'Upper',
    gymId: 'on-air',
    templateId: null,
    startedAt: START,
    endedAt: START + 3_600_000,
    notes: '',
    status: 'done',
    restEndsAt: null,
    source: 'app',
    blocks: [
      { id: 'b1', exerciseId: 'db-lateral-raise', supersetId: 'ss', notes: '', restSec: 60 },
      { id: 'b2', exerciseId: 'db-reverse-fly', supersetId: 'ss', notes: '', restSec: null },
    ],
  }
  const set = (id: string, blockId: string, exerciseId: string, order: number): SetRow => ({
    id,
    workoutId: 'w',
    blockId,
    exerciseId,
    gymId: 'on-air',
    order,
    type: 'normal',
    reps: 12,
    kg: 10,
    rir: null,
    at: START + 60_000 * (order + 1),
    done: true,
  })
  await db().workouts.add(workout)
  await db().sets.bulkAdd([
    set('s1', 'b1', 'db-lateral-raise', 0),
    set('s2', 'b1', 'db-lateral-raise', 1),
    set('s3', 'b2', 'db-reverse-fly', 0),
  ])
})
afterEach(async () => {
  await testDb.current.delete()
})

describe('séances passées', () => {
  it('déplace la séance et ses séries dans le temps', async () => {
    const later = START + 86_400_000
    await updateWorkoutTimes('w', later, 75)
    expect(await db().workouts.get('w')).toMatchObject({
      startedAt: later,
      endedAt: later + 75 * 60_000,
    })
    expect((await db().sets.get('s1'))?.at).toBe(later + 60_000)
  })

  it('ajoute une série validée qui reprend la dernière', async () => {
    await addPastSet('w', 'b1')
    const sets = (await db().sets.where('workoutId').equals('w').toArray()).filter(
      (s) => s.blockId === 'b1',
    )
    expect(sets).toHaveLength(3)
    const added = sets.find((s) => s.order === 2)!
    expect(added).toMatchObject({ done: true, kg: 10, reps: 12, exerciseId: 'db-lateral-raise' })
    expect(added.at).toBeGreaterThan((await db().sets.get('s2'))!.at)
  })

  it('ajoute un exercice oublié avec une série à compléter', async () => {
    await addPastExercise('w', 'db-curl')
    const workout = (await db().workouts.get('w'))!
    expect(workout.blocks.map((b) => b.exerciseId)).toEqual([
      'db-lateral-raise',
      'db-reverse-fly',
      'db-curl',
    ])
    const curl = await db().sets.where('exerciseId').equals('db-curl').toArray()
    expect(curl).toEqual([expect.objectContaining({ kg: 0, reps: 0, done: true })])
  })

  it('enregistre la séance comme modèle, superset et repos compris', async () => {
    const id = await saveAsTemplate('w')
    const template = (await db().templates.get(id!))!
    expect(template).toMatchObject({ name: 'Upper', folderId: null })
    expect(template.blocks.map((b) => [b.exerciseId, b.sets, b.restSec])).toEqual([
      ['db-lateral-raise', 2, 60],
      ['db-reverse-fly', 1, null],
    ])
    expect(template.blocks[0]!.supersetId).not.toBeNull()
    expect(template.blocks[0]!.supersetId).toBe(template.blocks[1]!.supersetId)
    expect(template.blocks[0]!.supersetId).not.toBe('ss')
  })
})
