import { describe, expect, it } from 'vitest'
import type { HevySet, HevyWorkout } from './hevy'
import { routineCandidates } from './routines'

const set = (reps: number | null): HevySet => ({
  type: 'normal',
  kg: 50,
  reps,
  rpe: null,
  durationSec: null,
  distanceKm: null,
})
const workout = (title: string, startedAt: number, exercises: [string, number][]): HevyWorkout => ({
  title,
  startedAt,
  endedAt: startedAt + 1,
  description: '',
  exercises: exercises.map(([name, n]) => ({
    name,
    supersetId: null,
    notes: '',
    sets: Array.from({ length: n }, () => set(10)),
  })),
})

describe('routineCandidates', () => {
  const workouts = [
    workout('Legs', 100, [
      ['Hack Squat', 3],
      ['Fentes', 3],
    ]),
    workout('Legs', 300, [
      ['Hack Squat', 2],
      ['Leg Curl', 3],
    ]),
    workout('Pull', 200, [
      ['Tractions', 2],
      ['Vélo', 0],
    ]),
    workout('Bras', 10, [['Curl', 3]]),
  ]

  it('prend la séance la plus récente de chaque nom, plus récentes d’abord', () => {
    const candidates = routineCandidates(workouts, 50)
    expect(candidates.map((c) => [c.title, c.sessions, c.lastAt])).toEqual([
      ['Legs', 2, 300],
      ['Pull', 1, 200],
    ])
    expect(candidates[0]?.exercises).toEqual([
      { name: 'Hack Squat', sets: 2, supersetId: null },
      { name: 'Leg Curl', sets: 3, supersetId: null },
    ])
  })

  it('ignore les exercices sans série importable', () => {
    expect(routineCandidates(workouts, 50)[1]?.exercises.map((e) => e.name)).toEqual(['Tractions'])
  })

  it('écarte les séances trop anciennes', () => {
    expect(routineCandidates(workouts, 0).map((c) => c.title)).toContain('Bras')
    expect(routineCandidates(workouts, 50).map((c) => c.title)).not.toContain('Bras')
  })
})
