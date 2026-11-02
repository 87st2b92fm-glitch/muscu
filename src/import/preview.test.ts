import { describe, expect, it } from 'vitest'
import { DEFAULT_EXERCISES } from '../data/exercises'
import type { HevyExercise, HevySet, HevyWorkout } from './hevy'
import { buildPreview, guessNewExercise, hevyWorkoutKey } from './preview'

const set = (kg: number | null, reps: number | null): HevySet => ({
  type: 'normal',
  kg,
  reps,
  rpe: null,
  durationSec: null,
  distanceKm: null,
})
const exercise = (name: string, sets: HevySet[]): HevyExercise => ({
  name,
  supersetId: null,
  notes: '',
  sets,
})
const workout = (title: string, startedAt: number, exercises: HevyExercise[]): HevyWorkout => ({
  title,
  startedAt,
  endedAt: startedAt + 3_600_000,
  description: '',
  exercises,
})

const WORKOUTS = [
  workout('Legs', 2000, [
    exercise('Extension Jambes', [set(75, 8), set(75, 7)]),
    exercise('Kawaï Curl', [set(20, 10)]),
    exercise('Vélo Machine', [{ ...set(null, null), durationSec: 600 }]),
  ]),
  workout('Upper', 1000, [
    exercise('Tirage Machine Convergente', [set(59, 107)]),
    exercise('Tractions', [set(null, 8)]),
    exercise('extension jambes (machine)', [set(70, 10)]),
  ]),
]

describe('buildPreview', () => {
  const preview = buildPreview(WORKOUTS, DEFAULT_EXERCISES, [], new Set())

  it('compte séances, séries importables et séries ignorées', () => {
    expect(preview.workouts).toHaveLength(2)
    expect(preview.setCount).toBe(6)
    expect(preview.skippedSets).toBe(1)
    expect([preview.firstAt, preview.lastAt]).toEqual([1000, 2000])
  })

  it('reconnaît les noms Hevy par les alias, sans tenir compte de la casse', () => {
    const byName = new Map(preview.names.map((n) => [n.sourceName, n]))
    expect(byName.get('Extension Jambes')?.resolution).toEqual({
      kind: 'existing',
      exerciseId: 'leg-extension',
    })
    expect(byName.get('extension jambes (machine)')?.resolution).toEqual({
      kind: 'existing',
      exerciseId: 'leg-extension',
    })
    expect(byName.get('Tractions')?.recognized).toBe(true)
  })

  it('propose de créer les exercices inconnus et les liste en premier', () => {
    expect(preview.names[0]).toMatchObject({ sourceName: 'Kawaï Curl', recognized: false })
    expect(preview.names.map((n) => n.sourceName)).not.toContain('Vélo Machine')
  })

  it('signale les valeurs suspectes', () => {
    expect(preview.anomalies).toEqual([
      expect.objectContaining({ id: '1:0:0', exerciseName: 'Tirage Machine Convergente' }),
    ])
  })

  it('reprend les correspondances choisies lors d’un import précédent', () => {
    const remembered = buildPreview(
      WORKOUTS,
      DEFAULT_EXERCISES,
      [{ sourceName: 'Kawaï Curl', exerciseId: 'cable-curl' }],
      new Set(),
    )
    expect(remembered.names.find((n) => n.sourceName === 'Kawaï Curl')).toMatchObject({
      recognized: true,
      resolution: { kind: 'existing', exerciseId: 'cable-curl' },
    })
  })

  it('écarte les séances déjà importées', () => {
    const again = buildPreview(
      WORKOUTS,
      DEFAULT_EXERCISES,
      [],
      new Set([hevyWorkoutKey('Upper', 1000)]),
    )
    expect(again.workouts.map((w) => w.title)).toEqual(['Legs'])
    expect(again.alreadyImported).toBe(1)
  })
})

describe('guessNewExercise', () => {
  it('devine machine ou poids libre d’après le nom', () => {
    expect(guessNewExercise('Curl Poulie Basse')).toMatchObject({
      category: 'machine',
      equipment: 'cable',
    })
    expect(guessNewExercise('Pull (machine)')).toMatchObject({
      category: 'machine',
      equipment: 'machine',
    })
    expect(guessNewExercise('Hammer Curl (Haltère)')).toMatchObject({
      category: 'free',
      equipment: 'dumbbell',
    })
    expect(guessNewExercise('Sam Sulek Forearm')).toMatchObject({ category: 'free' })
  })
})
