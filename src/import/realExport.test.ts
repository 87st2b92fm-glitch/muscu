/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { AppDB } from '../db/db'
import { buildSummaries } from '../features/home/summaries'
import { applyHevyImport, existingHevyKeys } from './apply'
import { parseCsv } from './csv'
import { parseHevyMeasurements, parseHevyWorkouts } from './hevy'
import { buildPreview } from './preview'

// Vérification sur un vrai export, jamais versionné :
// HEVY_WORKOUTS=~/Downloads/workout_data.csv HEVY_MEASUREMENTS=~/Downloads/measurement_data.csv npx vitest run realExport
const workoutsFile = process.env.HEVY_WORKOUTS
const measurementsFile = process.env.HEVY_MEASUREMENTS

let db: AppDB | null = null
afterEach(async () => {
  await db?.delete()
})

describe.runIf(workoutsFile)('import d’un vrai export Hevy', () => {
  it('importe tout, sans doublon au second passage', async () => {
    db = new AppDB(`real-${crypto.randomUUID()}`)
    const rows = parseCsv(readFileSync(workoutsFile!, 'utf8'))
    const workouts = parseHevyWorkouts(rows)
    const measurements = measurementsFile
      ? parseHevyMeasurements(parseCsv(readFileSync(measurementsFile, 'utf8')))
      : []

    const preview = buildPreview(workouts, await db.exercises.toArray(), [], new Set())
    const unrecognized = preview.names.filter((n) => !n.recognized)
    console.log(
      `${rows.length} lignes → ${preview.workouts.length} séances, ${preview.setCount} séries, ${preview.skippedSets} ignorées\n` +
        `${preview.names.length} noms, ${unrecognized.length} à vérifier : ${unrecognized.map((n) => n.sourceName).join(', ')}\n` +
        `anomalies : ${preview.anomalies.map((a) => `${a.exerciseName} ${a.set.kg} × ${a.set.reps}`).join(', ')}`,
    )
    expect(preview.setCount + preview.skippedSets).toBe(rows.length)

    const started = performance.now()
    const result = await applyHevyImport(db, preview, measurements, {
      gymId: 'on-air',
      resolutions: new Map(),
      corrections: new Map(),
    })
    console.log(`import en ${Math.round(performance.now() - started)} ms`, result)
    expect(result.workouts).toBe(preview.workouts.length)
    expect(result.sets).toBe(preview.setCount)

    const summaryStart = performance.now()
    const exercises = await db.exercises.toArray()
    const summaries = buildSummaries({
      workouts: await db.workouts.toArray(),
      sets: await db.sets.toArray(),
      exercises: new Map(exercises.map((e) => [e.id, e])),
      gyms: new Map([['on-air', { id: 'on-air', name: 'On Air', color: '#e11d48' }]]),
      bodyweights: await db.bodyweights.toArray(),
      links: [],
    })
    const records = summaries.reduce(
      (n, w) => n + w.exercises.reduce((m, e) => m + e.records.length, 0),
      0,
    )
    console.log(
      `résumés en ${Math.round(performance.now() - summaryStart)} ms, ${records} records ; dernière séance :`,
      JSON.stringify(summaries[0], null, 1),
    )

    const again = buildPreview(
      workouts,
      exercises,
      await db.importMappings.toArray(),
      existingHevyKeys(await db.workouts.toArray()),
    )
    expect(again.workouts).toHaveLength(0)
    expect(again.names).toHaveLength(0)
  })
})
