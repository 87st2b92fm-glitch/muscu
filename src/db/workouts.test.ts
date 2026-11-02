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

const {
  addSet,
  changeWorkoutGym,
  discardWorkout,
  finishWorkout,
  startWorkout,
  toggleSetDone,
  toggleSupersetWithNext,
} = await import('./workouts')

const db = () => testDb.current

beforeEach(async () => {
  testDb.current = new AppDB(`test-${crypto.randomUUID()}`)
  // Une séance passée : hack squat 80 × 8 puis 80 × 7 à On Air, fourchette 6–8, incrément 5 kg.
  const past: Workout = {
    id: 'past',
    title: 'Legs',
    gymId: 'on-air',
    templateId: null,
    startedAt: 1000,
    endedAt: 2000,
    notes: '',
    status: 'done',
    blocks: [{ id: 'pb', exerciseId: 'hack-squat', supersetId: null, notes: '', restSec: null }],
    restEndsAt: null,
    source: 'app',
  }
  const set = (id: string, order: number, reps: number): SetRow => ({
    id,
    workoutId: 'past',
    blockId: 'pb',
    exerciseId: 'hack-squat',
    gymId: 'on-air',
    order,
    type: 'normal',
    reps,
    kg: 80,
    rir: null,
    at: 1000 + order,
    done: true,
  })
  await db().workouts.add(past)
  await db().sets.bulkAdd([set('p1', 0, 8), set('p2', 1, 7)])
  await db().exercises.update('hack-squat', { repRange: { min: 6, max: 8 }, restSec: 90 })
  await db().machineSetups.add({
    id: 'ms',
    exerciseId: 'hack-squat',
    gymId: 'on-air',
    brandModel: null,
    incrementKg: 5,
    linkGroupId: null,
  })
  await db().folders.add({ id: 'f', name: '🍂', order: 0, isProgram: true, nextTemplateId: 't1' })
  await db().templates.bulkAdd([
    {
      id: 't1',
      folderId: 'f',
      name: 'Legs',
      order: 0,
      notes: '',
      blocks: [
        { exerciseId: 'hack-squat', supersetId: null, sets: 2, repRange: null, restSec: null },
        { exerciseId: 'leg-extension', supersetId: null, sets: 3, repRange: null, restSec: 60 },
      ],
    },
    { id: 't2', folderId: 'f', name: 'Push', order: 1, notes: '', blocks: [] },
  ])
})
afterEach(async () => {
  await testDb.current.delete()
})

async function setsOf(workoutId: string) {
  return (await db().sets.where('workoutId').equals(workoutId).toArray()).sort(
    (a, b) => a.at - b.at,
  )
}

describe('séance', () => {
  it('démarre depuis un modèle avec les séries préremplies (dernière perf et suggestion)', async () => {
    const id = await startWorkout({ templateId: 't1', gymId: 'on-air' })
    const workout = (await db().workouts.get(id))!
    expect(workout).toMatchObject({ title: 'Legs', status: 'active', gymId: 'on-air' })
    expect(workout.blocks.map((b) => b.exerciseId)).toEqual(['hack-squat', 'leg-extension'])
    const sets = await setsOf(id)
    // 80 × 8 puis 80 × 7 avec une fourchette 6–8 : même charge, une rep de plus (plafonnée à 8).
    expect(sets.filter((s) => s.exerciseId === 'hack-squat').map((s) => [s.kg, s.reps])).toEqual([
      [80, 8],
      [80, 8],
    ])
    // Jamais fait : 3 séries vides.
    expect(sets.filter((s) => s.exerciseId === 'leg-extension').map((s) => [s.kg, s.reps])).toEqual(
      [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    )
  })

  it('reprend la séance en cours au lieu d’en créer une autre', async () => {
    const first = await startWorkout({ templateId: null, gymId: 'on-air' })
    expect(await startWorkout({ templateId: 't1', gymId: 'on-air' })).toBe(first)
  })

  it('valide une série et lance le repos de l’exercice', async () => {
    const id = await startWorkout({ templateId: 't1', gymId: 'on-air' })
    const first = (await setsOf(id)).find((s) => s.exerciseId === 'hack-squat')
    const before = Date.now()
    await toggleSetDone((await db().workouts.get(id))!, first!)
    expect((await db().sets.get(first!.id))?.done).toBe(true)
    const restEndsAt = (await db().workouts.get(id))!.restEndsAt!
    expect(restEndsAt - before).toBeGreaterThanOrEqual(90_000)
    expect(restEndsAt - before).toBeLessThan(91_000)
  })

  it('ajoute une série qui reprend la précédente', async () => {
    const id = await startWorkout({ templateId: 't1', gymId: 'on-air' })
    const workout = (await db().workouts.get(id))!
    await addSet(workout, workout.blocks[0]!.id)
    const hack = (await setsOf(id)).filter((s) => s.exerciseId === 'hack-squat')
    expect(hack.map((s) => [s.order, s.kg, s.reps])).toEqual([
      [0, 80, 8],
      [1, 80, 8],
      [2, 80, 8],
    ])
  })

  it('groupe et dégroupe un superset', async () => {
    const id = await startWorkout({ templateId: 't1', gymId: 'on-air' })
    let workout = (await db().workouts.get(id))!
    await toggleSupersetWithNext(workout, workout.blocks[0]!.id)
    workout = (await db().workouts.get(id))!
    expect(workout.blocks[0]!.supersetId).not.toBeNull()
    expect(workout.blocks[0]!.supersetId).toBe(workout.blocks[1]!.supersetId)
    await toggleSupersetWithNext(workout, workout.blocks[1]!.id)
    workout = (await db().workouts.get(id))!
    expect(workout.blocks.map((b) => b.supersetId)).toEqual([null, null])
  })

  it('change la salle de la séance et de ses séries', async () => {
    const id = await startWorkout({ templateId: 't1', gymId: 'on-air' })
    await changeWorkoutGym(id, 'basic')
    expect((await db().workouts.get(id))?.gymId).toBe('basic')
    expect((await setsOf(id)).every((s) => s.gymId === 'basic')).toBe(true)
  })

  it('termine : supprime les séries non validées, les exercices vides, et avance le programme', async () => {
    const id = await startWorkout({ templateId: 't1', gymId: 'on-air' })
    const workout = (await db().workouts.get(id))!
    const first = (await setsOf(id)).find((s) => s.exerciseId === 'hack-squat')
    await toggleSetDone(workout, first!)
    expect(await finishWorkout(id)).toBe(true)
    const done = (await db().workouts.get(id))!
    expect(done).toMatchObject({ status: 'done', restEndsAt: null })
    expect(done.endedAt).not.toBeNull()
    expect(done.blocks.map((b) => b.exerciseId)).toEqual(['hack-squat'])
    expect(await setsOf(id)).toHaveLength(1)
    expect((await db().folders.get('f'))?.nextTemplateId).toBe('t2')
  })

  it('abandonne une séance sans série validée', async () => {
    const id = await startWorkout({ templateId: 't1', gymId: 'on-air' })
    expect(await finishWorkout(id)).toBe(false)
    expect(await db().workouts.get(id)).toBeUndefined()
    const other = await startWorkout({ templateId: null, gymId: 'on-air' })
    await discardWorkout(other)
    expect(await db().workouts.count()).toBe(1)
  })
})
