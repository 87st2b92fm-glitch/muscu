import { afterEach, describe, expect, it } from 'vitest'
import { AppDB } from '../db/db'
import { backupDue, createBackup, parseBackup, restoreBackup, summarizeBackup } from './backup'

const dbs: AppDB[] = []
function openDb() {
  const db = new AppDB(`test-${crypto.randomUUID()}`)
  dbs.push(db)
  return db
}
afterEach(async () => {
  await Promise.all(dbs.splice(0).map((db) => db.delete()))
})

async function withData(db: AppDB) {
  await db.workouts.add({
    id: 'w1',
    title: 'Legs',
    gymId: 'on-air',
    templateId: null,
    startedAt: 1,
    endedAt: 2,
    notes: '',
    status: 'done',
    blocks: [{ id: 'b', exerciseId: 'squat', supersetId: null, notes: '', restSec: null }],
    restEndsAt: null,
    source: 'app',
  })
  await db.sets.add({
    id: 's1',
    workoutId: 'w1',
    blockId: 'b',
    exerciseId: 'squat',
    gymId: 'on-air',
    order: 0,
    type: 'normal',
    reps: 5,
    kg: 100,
    rir: null,
    at: 1,
    done: true,
  })
  await db.bodyweights.add({ id: 'bw', at: 1, kg: 64 })
  await db.profile.update('me', { sex: 'male' })
}

describe('sauvegarde', () => {
  it('fait l’aller-retour complet (remplacement)', async () => {
    const source = openDb()
    await withData(source)
    const backup = parseBackup(JSON.stringify(await createBackup(source)), source.verno)
    expect(summarizeBackup(backup)).toMatchObject({ workouts: 1, sets: 1, bodyweights: 1 })

    const target = openDb()
    await target.gyms.update('basic', { name: 'Basic Fit' })
    await restoreBackup(target, backup, 'replace')
    expect(await target.sets.get('s1')).toMatchObject({ kg: 100, reps: 5 })
    expect((await target.profile.get('me'))?.sex).toBe('male')
    expect((await target.gyms.get('basic'))?.name).toBe('Basic')
    expect(await target.exercises.count()).toBe(await source.exercises.count())
  })

  it('fusionne sans doublon ni écrasement', async () => {
    const source = openDb()
    await withData(source)
    const backup = await createBackup(source)

    const target = openDb()
    await target.bodyweights.add({ id: 'bw2', at: 5, kg: 65 })
    await target.gyms.update('basic', { name: 'Basic Fit' })
    const added = await restoreBackup(target, backup, 'merge')
    expect(added).toBe(3) // séance, série, pesée : le reste existe déjà
    expect(await target.bodyweights.count()).toBe(2)
    expect((await target.gyms.get('basic'))?.name).toBe('Basic Fit')
    expect((await target.profile.get('me'))?.sex).toBeNull()
    expect(await restoreBackup(target, backup, 'merge')).toBe(0)
  })

  it('refuse un fichier invalide avec un message clair', async () => {
    const db = openDb()
    expect(() => parseBackup('pas du json', db.verno)).toThrow(/JSON valide/)
    expect(() => parseBackup('{"app":"hevy"}', db.verno)).toThrow(/pas une sauvegarde/)
    const backup = await createBackup(db)
    expect(() => parseBackup(JSON.stringify({ ...backup, schemaVersion: 99 }), db.verno)).toThrow(
      /plus récente/,
    )
    const broken = { ...backup, tables: { ...backup.tables, sets: [{ kg: 1 }] } }
    expect(() => parseBackup(JSON.stringify(broken), db.verno)).toThrow(/sets/)
    const missing = { ...backup, tables: { ...backup.tables, workouts: undefined } }
    expect(() => parseBackup(JSON.stringify(missing), db.verno)).toThrow(/workouts/)
  })
})

describe('rappel de sauvegarde', () => {
  const day = 86_400_000
  it('rappelle après 14 jours, ou si jamais sauvegardé, seulement s’il y a des séances', () => {
    expect(backupDue(null, 100 * day, true)).toBe(true)
    expect(backupDue(90 * day, 100 * day, true)).toBe(false)
    expect(backupDue(85 * day, 100 * day, true)).toBe(true)
    expect(backupDue(null, 100 * day, false)).toBe(false)
  })
})
