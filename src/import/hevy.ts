import { MEASUREMENT_KEYS, type MeasurementKey } from '../db/types'
import { normalizeText } from '../domain/search'
import type { SetType } from '../domain/types'

export interface HevySet {
  type: SetType
  kg: number | null
  reps: number | null
  rpe: number | null
  durationSec: number | null
  distanceKm: number | null
}

export interface HevyExercise {
  name: string
  /** Numéro de superset propre à la séance, null hors superset. */
  supersetId: string | null
  notes: string
  sets: HevySet[]
}

export interface HevyWorkout {
  title: string
  startedAt: number
  endedAt: number
  description: string
  exercises: HevyExercise[]
}

export interface HevyMeasurement {
  at: number
  weightKg: number | null
  values: Partial<Record<MeasurementKey, number>>
}

const MONTHS: Record<string, number> = {
  janv: 0,
  jan: 0,
  fevr: 1,
  feb: 1,
  mars: 2,
  mar: 2,
  avr: 3,
  apr: 3,
  mai: 4,
  may: 4,
  juin: 5,
  jun: 5,
  juil: 6,
  jul: 6,
  aout: 7,
  aug: 7,
  sept: 8,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

/** « 1 nov. 2026, 13:48 » (ou « 1 Nov 2026, 13:48 ») en heure locale ; null si illisible. */
export function parseHevyDate(text: string): number | null {
  const match = /^(\d{1,2}) (\S+?)\.? (\d{4}), (\d{1,2}):(\d{2})$/.exec(text.trim())
  if (!match) return null
  const [, day, monthText, year, hour, minute] = match
  const month = MONTHS[normalizeText(monthText!)]
  if (month === undefined) return null
  return new Date(Number(year), month, Number(day), Number(hour), Number(minute)).getTime()
}

function toNumber(text: string | undefined): number | null {
  if (text === undefined || text.trim() === '') return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

const SET_TYPES: Record<string, SetType> = {
  normal: 'normal',
  warmup: 'warmup',
  dropset: 'drop',
  failure: 'failure',
}

export type HevyFileKind = 'workouts' | 'measurements'

/** Reconnaît le fichier d'après ses colonnes. */
export function detectHevyFile(rows: Record<string, string>[]): HevyFileKind | null {
  const columns = Object.keys(rows[0] ?? {})
  if (['title', 'start_time', 'exercise_title', 'set_index'].every((c) => columns.includes(c))) {
    return 'workouts'
  }
  if (columns.includes('date') && columns.includes('weight_kg')) return 'measurements'
  return null
}

/**
 * Regroupe les lignes (une par série) en séances puis en exercices, dans l'ordre du fichier.
 * Un nouvel exercice commence quand le nom change ou que le numéro de série repart en arrière.
 */
export function parseHevyWorkouts(rows: Record<string, string>[]): HevyWorkout[] {
  const workouts = new Map<string, HevyWorkout>()
  let lastSetIndex = -1

  for (const row of rows) {
    const startedAt = parseHevyDate(row.start_time ?? '')
    if (startedAt === null) throw new Error(`Date illisible : « ${row.start_time} »`)
    const key = `${row.title}\u0000${row.start_time}`

    let workout = workouts.get(key)
    if (!workout) {
      workout = {
        title: row.title ?? '',
        startedAt,
        endedAt: parseHevyDate(row.end_time ?? '') ?? startedAt,
        description: row.description ?? '',
        exercises: [],
      }
      workouts.set(key, workout)
      lastSetIndex = -1
    }

    const name = (row.exercise_title ?? '').trim()
    const setIndex = toNumber(row.set_index) ?? 0
    let exercise = workout.exercises[workout.exercises.length - 1]
    if (!exercise || exercise.name !== name || setIndex <= lastSetIndex) {
      exercise = {
        name,
        supersetId: row.superset_id ? row.superset_id : null,
        notes: row.exercise_notes ?? '',
        sets: [],
      }
      workout.exercises.push(exercise)
    }
    lastSetIndex = setIndex

    exercise.sets.push({
      type: SET_TYPES[row.set_type ?? ''] ?? 'normal',
      kg: toNumber(row.weight_kg),
      reps: toNumber(row.reps),
      rpe: toNumber(row.rpe),
      durationSec: toNumber(row.duration_seconds),
      distanceKm: toNumber(row.distance_km),
    })
  }
  return [...workouts.values()]
}

/** « left_bicep_cm » → « leftBicepCm » ; seules les colonnes connues sont gardées. */
function measurementKey(column: string): MeasurementKey | null {
  const key = column.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
  return key in MEASUREMENT_KEYS ? (key as MeasurementKey) : null
}

export function parseHevyMeasurements(rows: Record<string, string>[]): HevyMeasurement[] {
  return rows.flatMap((row) => {
    const at = parseHevyDate(row.date ?? '')
    if (at === null) return []
    const values: HevyMeasurement['values'] = {}
    for (const [column, text] of Object.entries(row)) {
      const key = measurementKey(column)
      const value = toNumber(text)
      if (key && value !== null) values[key] = value
    }
    return [{ at, weightKg: toNumber(row.weight_kg), values }]
  })
}
