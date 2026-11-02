import { afterEach, describe, expect, it } from 'vitest'
import { AppDB } from '../db/db'
import { applyHevyImport, existingHevyKeys, rpeToRir } from './apply'
import type { HevySet, HevyWorkout } from './hevy'
import { buildPreview } from './preview'
import { routineCandidates } from './routines'

const set = (kg: number | null, reps: number | null, extra: Partial<HevySet> = {}): HevySet => ({
  type: 'normal',
  kg,
  reps,
  rpe: null,
  durationSec: null,
  distanceKm: null,
  ...extra,
})

const START = new Date(2026, 9, 18, 14, 0).getTime()
const HOUR = 3_600_000

const WORKOUTS: HevyWorkout[] = [
  {
    title: 'Upper',
    startedAt: START,
    endedAt: START + HOUR,
    description: 'Bonne séance',
    exercises: [
      {
        name: 'Développé Couché (Barre)',
        supersetId: null,
        notes: '2 CT',
        sets: [set(60, 10, { type: 'warmup' }), set(85, 6, { rpe: 8.5 }), set(85, 5)],
      },
      { name: 'Élévation Latérale (Haltère)', supersetId: '0', notes: '', sets: [set(12, 15)] },
      { name: 'Oiseau Penché (Haltère)', supersetId: '0', notes: '', sets: [set(8, 15)] },
      { name: 'Kawaï Curl', supersetId: null, notes: '', sets: [set(20, 107), set(20, 10)] },
      { name: 'Tractions', supersetId: null, notes: '', sets: [set(null, 8)] },
      {
        name: 'Vélo Machine',
        supersetId: null,
        notes: '',
        sets: [set(null, null, { durationSec: 600 })],
      },
    ],
  },
]

let db: AppDB | null = null
afterEach(async () => {
  await db?.delete()
  db = null
})

async function importOnce(database: AppDB) {
  const preview = buildPreview(
    WORKOUTS,
    await database.exercises.toArray(),
    await database.importMappings.toArray(),
    existingHevyKeys(await database.workouts.toArray()),
  )
  // Seul le premier import voit l'anomalie (107 reps) : au second, la séance est déjà présente.
  const kawai = preview.anomalies[0]
  return applyHevyImport(
    database,
    preview,
    [
      { at: START - 10 * 24 * HOUR, weightKg: 64, values: {} },
      { at: START - 9 * 24 * HOUR, weightKg: null, values: { neckCm: 38 } },
    ],
    {
      gymId: 'on-air',
      resolutions: new Map([
        ['Kawaï Curl', { kind: 'create', category: 'machine', equipment: 'cable' }],
      ]),
      corrections: new Map(kawai ? [[kawai.id, { skip: false, reps: 10, kg: 20 }]] : []),
    },
  )
}

describe('applyHevyImport', () => {
  it('importe séances, séries, exercices créés, pesées et mensurations', async () => {
    db = new AppDB(`test-${crypto.randomUUID()}`)
    const result = await importOnce(db)
    expect(result).toEqual({
      workouts: 1,
      sets: 8,
      createdExercises: 1,
      bodyweights: 1,
      measurements: 1,
      templates: 0,
    })

    const [workout] = await db.workouts.toArray()
    expect(workout).toMatchObject({
      title: 'Upper',
      gymId: 'on-air',
      status: 'done',
      source: 'hevy',
      notes: 'Bonne séance',
    })
    expect(workout?.blocks).toHaveLength(5)
    expect(workout?.blocks[0]?.notes).toBe('2 CT')
    // Les deux exercices du superset partagent le même identifiant.
    expect(workout?.blocks[1]?.supersetId).not.toBeNull()
    expect(workout?.blocks[1]?.supersetId).toBe(workout?.blocks[2]?.supersetId)
  })

  it('convertit RPE en RIR, corrige les anomalies et répartit les séries dans la séance', async () => {
    db = new AppDB(`test-${crypto.randomUUID()}`)
    await importOnce(db)
    const sets = await db.sets.orderBy('at').toArray()
    expect(sets[0]).toMatchObject({ type: 'warmup', kg: 60, exerciseId: 'bench-press' })
    expect(sets[1]).toMatchObject({ kg: 85, reps: 6, rir: 1.5 })
    expect(sets.every((s) => s.at > START && s.at < START + HOUR)).toBe(true)

    const kawai = await db.exercises.where('name').equals('Kawaï Curl').first()
    expect(kawai).toMatchObject({ custom: true, category: 'machine', equipment: 'cable' })
    const kawaiSets = sets.filter((s) => s.exerciseId === kawai?.id)
    expect(kawaiSets.map((s) => s.reps)).toEqual([10, 10])

    // Tractions sans charge : lest de 0 kg.
    expect(sets.find((s) => s.exerciseId === 'pull-up')).toMatchObject({ kg: 0, reps: 8 })
  })

  it('n’importe rien deux fois et retient les correspondances', async () => {
    db = new AppDB(`test-${crypto.randomUUID()}`)
    await importOnce(db)
    const second = await importOnce(db)
    expect(second).toMatchObject({ workouts: 0, sets: 0, bodyweights: 0, measurements: 0 })
    expect(await db.workouts.count()).toBe(1)
    expect(await db.exercises.where('name').equals('Kawaï Curl').count()).toBe(1)
    expect((await db.importMappings.get('Kawaï Curl'))?.exerciseId).toBeDefined()
  })
})

describe('modèles depuis l’historique', () => {
  it('crée un dossier et un modèle par routine, sans doublon au second import', async () => {
    db = new AppDB(`test-${crypto.randomUUID()}`)
    await importOnce(db)
    const choices = {
      gymId: 'on-air',
      resolutions: new Map(),
      corrections: new Map(),
      routines: { folderName: '🍂', routines: routineCandidates(WORKOUTS, 0) },
    }
    const preview = buildPreview(
      WORKOUTS,
      await db.exercises.toArray(),
      await db.importMappings.toArray(),
      existingHevyKeys(await db.workouts.toArray()),
    )
    expect((await applyHevyImport(db, preview, [], choices)).templates).toBe(1)
    expect((await applyHevyImport(db, preview, [], choices)).templates).toBe(0)

    const [folder] = await db.folders.toArray()
    expect(folder?.name).toBe('🍂')
    const [template] = await db.templates.toArray()
    expect(template).toMatchObject({ name: 'Upper', folderId: folder?.id })
    // Le vélo (sans reps) est écarté ; Kawaï Curl est retrouvé grâce à sa correspondance.
    expect(template?.blocks).toHaveLength(5)
    expect(template?.blocks[0]).toMatchObject({ exerciseId: 'bench-press', sets: 3 })
    expect(template?.blocks[1]?.supersetId).not.toBeNull()
    expect(template?.blocks[1]?.supersetId).toBe(template?.blocks[2]?.supersetId)
  })
})

describe('rpeToRir', () => {
  it('convertit et borne à 0', () => {
    expect(rpeToRir(8)).toBe(2)
    expect(rpeToRir(9.5)).toBe(0.5)
    expect(rpeToRir(10)).toBe(0)
    expect(rpeToRir(null)).toBeNull()
  })
})
