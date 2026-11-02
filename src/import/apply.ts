import type { AppDB } from '../db/db'
import type {
  BodyweightRow,
  Exercise,
  MeasurementRow,
  SetRow,
  Workout,
  WorkoutBlock,
} from '../db/types'
import { round2 } from '../domain/units'
import type { HevyMeasurement } from './hevy'
import { hevyWorkoutKey, isImportable, type ImportPreview, type Resolution } from './preview'

/** Correction d'une valeur suspecte : ignorer la série, ou remplacer reps / charge. */
export interface Correction {
  skip: boolean
  reps: number
  kg: number | null
}

export interface ImportChoices {
  gymId: string
  /** Nom Hevy → résolution choisie dans l'aperçu. */
  resolutions: ReadonlyMap<string, Resolution>
  corrections: ReadonlyMap<string, Correction>
}

export interface ImportResult {
  workouts: number
  sets: number
  createdExercises: number
  bodyweights: number
  measurements: number
}

/** RIR ≈ 10 − RPE (RPE 8,5 → RIR 1,5). */
export function rpeToRir(rpe: number | null): number | null {
  return rpe === null ? null : Math.max(0, round2(10 - rpe))
}

export function existingHevyKeys(workouts: readonly Workout[]): Set<string> {
  return new Set(
    workouts.filter((w) => w.source === 'hevy').map((w) => hevyWorkoutKey(w.title, w.startedAt)),
  )
}

/**
 * Écrit l'import dans la base, en une seule transaction (tout ou rien) :
 * exercices perso créés, correspondances retenues, séances et séries, pesées et mensurations.
 * Hevy ne donne que le début et la fin de séance : les séries sont réparties à intervalles
 * réguliers entre les deux, dans l'ordre, pour que les records se calculent dans le bon ordre.
 */
export async function applyHevyImport(
  db: AppDB,
  preview: ImportPreview,
  measurements: readonly HevyMeasurement[],
  choices: ImportChoices,
  newId: () => string = () => crypto.randomUUID(),
): Promise<ImportResult> {
  const result: ImportResult = {
    workouts: 0,
    sets: 0,
    createdExercises: 0,
    bodyweights: 0,
    measurements: 0,
  }

  await db.transaction(
    'rw',
    [db.exercises, db.importMappings, db.workouts, db.sets, db.bodyweights, db.measurements],
    async () => {
      // 1. Exercices : existants ou créés, et correspondances retenues pour le prochain import.
      const exerciseIdByName = new Map<string, string>()
      const newExercises: Exercise[] = []
      for (const entry of preview.names) {
        const resolution = choices.resolutions.get(entry.sourceName) ?? entry.resolution
        if (resolution.kind === 'existing') {
          exerciseIdByName.set(entry.sourceName, resolution.exerciseId)
          continue
        }
        const id = newId()
        exerciseIdByName.set(entry.sourceName, id)
        newExercises.push({
          id,
          name: entry.sourceName,
          category: resolution.category,
          equipment: resolution.equipment,
          primaryMuscles: [],
          secondaryMuscles: [],
          loadMode: 'external',
          repRange: null,
          restSec: null,
          standardKey: null,
          aliases: [entry.sourceName],
          custom: true,
          archived: false,
        })
      }
      await db.exercises.bulkAdd(newExercises)
      await db.importMappings.bulkPut(
        [...exerciseIdByName].map(([sourceName, exerciseId]) => ({ sourceName, exerciseId })),
      )
      result.createdExercises = newExercises.length

      // 2. Séances et séries.
      const workouts: Workout[] = []
      const sets: SetRow[] = []
      preview.workouts.forEach((hevy, wi) => {
        const workoutId = newId()
        const blocks: WorkoutBlock[] = []
        const workoutSets: Omit<SetRow, 'at'>[] = []

        hevy.exercises.forEach((exercise, ei) => {
          const exerciseId = exerciseIdByName.get(exercise.name)
          if (!exerciseId) return
          const blockId = newId()
          let order = 0
          exercise.sets.forEach((set, si) => {
            if (!isImportable(set)) return
            const correction = choices.corrections.get(`${wi}:${ei}:${si}`)
            if (correction?.skip) return
            workoutSets.push({
              id: newId(),
              workoutId,
              blockId,
              exerciseId,
              gymId: choices.gymId,
              order: order++,
              type: set.type,
              reps: correction ? correction.reps : set.reps!,
              kg: (correction ? correction.kg : set.kg) ?? 0,
              rir: rpeToRir(set.rpe),
              done: true,
            })
          })
          if (order === 0) return
          blocks.push({
            id: blockId,
            exerciseId,
            supersetId: exercise.supersetId === null ? null : `${workoutId}:${exercise.supersetId}`,
            notes: exercise.notes,
            restSec: null,
          })
        })
        if (blocks.length === 0) return

        const step = Math.max(hevy.endedAt - hevy.startedAt, 60_000) / workoutSets.length
        workoutSets.forEach((s, i) =>
          sets.push({ ...s, at: Math.round(hevy.startedAt + (i + 0.5) * step) }),
        )
        workouts.push({
          id: workoutId,
          title: hevy.title,
          gymId: choices.gymId,
          templateId: null,
          startedAt: hevy.startedAt,
          endedAt: hevy.endedAt,
          notes: hevy.description,
          status: 'done',
          blocks,
          restEndsAt: null,
          source: 'hevy',
        })
      })
      await db.workouts.bulkAdd(workouts)
      await db.sets.bulkAdd(sets)
      result.workouts = workouts.length
      result.sets = sets.length

      // 3. Pesées et mensurations, sans doublon de date.
      const weighedAt = new Set((await db.bodyweights.toArray()).map((b) => b.at))
      const measuredAt = new Set((await db.measurements.toArray()).map((m) => m.at))
      const bodyweights: BodyweightRow[] = []
      const measurementRows: MeasurementRow[] = []
      for (const m of measurements) {
        if (m.weightKg !== null && !weighedAt.has(m.at)) {
          bodyweights.push({ id: newId(), at: m.at, kg: m.weightKg })
        }
        if (Object.keys(m.values).length > 0 && !measuredAt.has(m.at)) {
          measurementRows.push({ id: newId(), at: m.at, values: m.values })
        }
      }
      await db.bodyweights.bulkAdd(bodyweights)
      await db.measurements.bulkAdd(measurementRows)
      result.bodyweights = bodyweights.length
      result.measurements = measurementRows.length
    },
  )
  return result
}
