import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_EXERCISES } from '../data/exercises'
import { AppDB } from './db'
import { PROFILE_ID } from './types'

let db: AppDB | null = null

function openDb() {
  db = new AppDB(`test-${crypto.randomUUID()}`)
  return db
}

afterEach(async () => {
  await db?.delete()
  db = null
})

describe('base de données', () => {
  it('crée les trois salles au premier lancement, On Air en premier', async () => {
    const gyms = await openDb().gyms.orderBy('order').toArray()
    expect(gyms.map((g) => g.name)).toEqual(['On Air', 'SUAPS', 'Basic'])
    expect(gyms[0]?.bars[0]?.kg).toBe(20)
  })

  it('crée le profil avec On Air comme salle par défaut', async () => {
    const profile = await openDb().profile.get(PROFILE_ID)
    expect(profile?.defaultGymId).toBe('on-air')
    expect(profile?.rirEnabled).toBe(true)
  })

  it('crée la bibliothèque d’exercices', async () => {
    expect(await openDb().exercises.count()).toBe(DEFAULT_EXERCISES.length)
  })

  it('retrouve les séries par exercice et par salle', async () => {
    const database = openDb()
    const base = {
      workoutId: 'w',
      blockId: 'b',
      order: 0,
      type: 'normal' as const,
      reps: 8,
      kg: 50,
      rir: null,
      done: true,
    }
    await database.sets.bulkAdd([
      { ...base, id: '1', exerciseId: 'leg-extension', gymId: 'on-air', at: 1 },
      { ...base, id: '2', exerciseId: 'leg-extension', gymId: 'basic', at: 2 },
      { ...base, id: '3', exerciseId: 'squat', gymId: 'on-air', at: 3 },
    ])
    const sets = await database.sets
      .where('[exerciseId+gymId]')
      .equals(['leg-extension', 'on-air'])
      .toArray()
    expect(sets.map((s) => s.id)).toEqual(['1'])
  })

  it('met le logo On Air dès le premier lancement', async () => {
    expect((await openDb().gyms.get('on-air'))?.logo).toMatch(/^data:image\/png;base64,/)
  })

  it('ajoute le logo On Air aux bases v1 sans écraser un logo existant', async () => {
    const name = `test-${crypto.randomUUID()}`
    const v1 = new Dexie(name)
    v1.version(1).stores({ gyms: 'id, order' })
    await v1.open()
    await v1.table('gyms').bulkAdd([
      { id: 'on-air', name: 'On Air', order: 0 },
      { id: 'basic', name: 'Basic', order: 1, logo: 'data:mon-logo' },
    ])
    v1.close()

    db = new AppDB(name)
    expect((await db.gyms.get('on-air'))?.logo).toMatch(/^data:image\/png/)
    expect((await db.gyms.get('basic'))?.logo).toBe('data:mon-logo')
  })

  it('ne recrée pas les données à la réouverture', async () => {
    const database = openDb()
    await database.gyms.update('on-air', { name: 'On Air Lyon' })
    database.close()
    await database.open()
    expect((await database.gyms.get('on-air'))?.name).toBe('On Air Lyon')
    expect(await database.gyms.count()).toBe(3)
  })
})
