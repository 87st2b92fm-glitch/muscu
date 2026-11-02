import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppDB } from './db'

// Les opérations utilisent l'instance partagée `db` : on la remplace par une base de test.
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

const { addGym, deleteGym, gymDeletionBlocker } = await import('./gyms')
const { createExercise, removeExercise, setMachineLink, updateMachineSetup } =
  await import('./exercises')

beforeEach(() => {
  testDb.current = new AppDB(`test-${crypto.randomUUID()}`)
})
afterEach(async () => {
  await testDb.current.delete()
})

describe('salles', () => {
  it('ajoute une salle avec le stock de disques de la première salle', async () => {
    const id = await addGym()
    const gym = await testDb.current.gyms.get(id)
    expect(gym).toMatchObject({ name: 'Nouvelle salle', order: 3 })
    expect(gym?.plates.length).toBeGreaterThan(0)
  })

  it('refuse de supprimer la salle par défaut ou une salle avec des séances', async () => {
    expect(await gymDeletionBlocker('on-air')).toMatch(/par défaut/)
    await testDb.current.workouts.add({
      id: 'w',
      title: 'Legs',
      gymId: 'basic',
      templateId: null,
      startedAt: 1,
      endedAt: 2,
      notes: '',
      status: 'done',
      blocks: [],
      restEndsAt: null,
      source: 'app',
    })
    expect(await gymDeletionBlocker('basic')).toMatch(/1 séance/)
    expect(await gymDeletionBlocker('suaps')).toBeNull()
  })

  it('supprime une salle et ses réglages de machines', async () => {
    await updateMachineSetup('leg-extension', 'suaps', { incrementKg: 5 })
    await deleteGym('suaps')
    expect(await testDb.current.gyms.get('suaps')).toBeUndefined()
    expect(await testDb.current.machineSetups.count()).toBe(0)
  })
})

describe('exercices', () => {
  it('supprime un exercice perso jamais utilisé', async () => {
    const id = await createExercise('Kawaï Curl', 'cable')
    const exercise = (await testDb.current.exercises.get(id))!
    expect(exercise).toMatchObject({ category: 'machine', custom: true })
    expect(await removeExercise(exercise)).toBe('deleted')
    expect(await testDb.current.exercises.get(id)).toBeUndefined()
  })

  it('masque un exercice de la bibliothèque ou déjà utilisé', async () => {
    const squat = (await testDb.current.exercises.get('squat'))!
    expect(await removeExercise(squat)).toBe('archived')
    expect((await testDb.current.exercises.get('squat'))?.archived).toBe(true)
  })

  it('crée, modifie et lie les réglages d’une machine', async () => {
    await updateMachineSetup('leg-extension', 'on-air', { brandModel: 'Panatta', incrementKg: 2.5 })
    await updateMachineSetup('leg-extension', 'on-air', { incrementKg: 5 })
    await setMachineLink('leg-extension', 'on-air', 'suaps')
    const setups = await testDb.current.machineSetups.toArray()
    expect(setups).toHaveLength(2)
    const onAir = setups.find((s) => s.gymId === 'on-air')
    expect(onAir).toMatchObject({ brandModel: 'Panatta', incrementKg: 5 })
    expect(onAir?.linkGroupId).toBe(setups.find((s) => s.gymId === 'suaps')?.linkGroupId)
  })
})
