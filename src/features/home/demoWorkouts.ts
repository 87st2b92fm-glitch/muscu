import { DEFAULT_GYMS, type GymLook } from '../../data/defaultGyms'
import type { WorkoutSummary } from './types'

// Séances d'exemple affichées tant que la base de données n'existe pas (étape 2).
const [onAir, suaps, basic] = DEFAULT_GYMS as [GymLook, GymLook, GymLook]

function daysAgo(days: number, hour: number): number {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.getTime()
}

type DemoExercise = Omit<WorkoutSummary['exercises'][number], 'key' | 'bodyweight'>

function withKeys(exercises: DemoExercise[]): WorkoutSummary['exercises'] {
  return exercises.map((e) => ({ ...e, key: e.name, bodyweight: false }))
}

export const DEMO_WORKOUTS: WorkoutSummary[] = [
  {
    id: 'demo-1',
    title: 'Upper 2',
    startedAt: daysAgo(1, 18),
    durationMin: 72,
    gym: onAir,
    volumeKg: 9840,
    exercises: withKeys([
      {
        name: 'Développé incliné (Smith)',
        sets: 3,
        best: { kg: 70, reps: 8 },
        records: ['weight'],
      },
      { name: 'Écartés poulie assis', sets: 3, best: { kg: 22.5, reps: 12 }, records: [] },
      {
        name: 'Tirage vertical prise serrée',
        sets: 4,
        best: { kg: 75, reps: 10 },
        records: ['volume'],
      },
      { name: 'Élévations latérales haltères', sets: 4, best: { kg: 12, reps: 15 }, records: [] },
      { name: 'Curl incliné haltères', sets: 3, best: { kg: 14, reps: 10 }, records: [] },
      { name: 'Extension triceps poulie', sets: 3, best: { kg: 30, reps: 12 }, records: [] },
    ]),
  },
  {
    id: 'demo-2',
    title: 'Lower 2',
    startedAt: daysAgo(3, 12),
    durationMin: 58,
    gym: basic,
    volumeKg: 12450,
    exercises: withKeys([
      {
        name: 'Leg curl allongé (machine)',
        sets: 3,
        best: { kg: 45.4, reps: 10 },
        records: ['weight', 'volume'],
      },
      { name: 'Adduction (machine)', sets: 3, best: { kg: 68, reps: 12 }, records: [] },
      { name: 'Presse à cuisses', sets: 4, best: { kg: 180, reps: 10 }, records: [] },
      { name: 'Extension jambes (machine)', sets: 3, best: { kg: 59, reps: 12 }, records: [] },
    ]),
  },
  {
    id: 'demo-3',
    title: 'Upper 1',
    startedAt: daysAgo(5, 17),
    durationMin: 64,
    gym: suaps,
    volumeKg: 10320,
    exercises: withKeys([
      { name: 'Développé couché barre', sets: 4, best: { kg: 85, reps: 6 }, records: ['weight'] },
      { name: 'Rowing barre', sets: 4, best: { kg: 70, reps: 8 }, records: [] },
      { name: 'Développé militaire haltères', sets: 3, best: { kg: 26, reps: 8 }, records: [] },
    ]),
  },
  {
    id: 'demo-4',
    title: 'Lower 1',
    startedAt: daysAgo(8, 18),
    durationMin: 70,
    gym: onAir,
    volumeKg: 13980,
    exercises: withKeys([
      { name: 'Squat barre', sets: 4, best: { kg: 110, reps: 5 }, records: [] },
      { name: 'Soulevé de terre roumain', sets: 3, best: { kg: 100, reps: 8 }, records: [] },
      { name: 'Fentes bulgares haltères', sets: 3, best: { kg: 20, reps: 10 }, records: [] },
      { name: 'Mollets debout (machine)', sets: 4, best: { kg: 90, reps: 12 }, records: [] },
    ]),
  },
]
