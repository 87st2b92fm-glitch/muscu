import type { Exercise, Gym, SetRow, Workout } from '../db/types'

const TYPE_LABELS: Record<SetRow['type'], string> = {
  normal: 'normale',
  warmup: 'échauffement',
  drop: 'dégressive',
  failure: 'échec',
}

const pad = (n: number) => String(n).padStart(2, '0')
const date = (at: number) => {
  const d = new Date(at)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const time = (at: number) => {
  const d = new Date(at)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
/** Nombre à la française pour Excel : virgule décimale. */
const decimal = (n: number | null) => (n === null ? '' : String(n).replace('.', ','))

/** Champ CSV : entre guillemets si besoin (point-virgule, guillemet, retour à la ligne). */
function field(value: string): string {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Séances terminées en CSV, une ligne par série, pour Excel ou Numbers en français
 * (séparateur « ; », virgule décimale, BOM pour les accents). Plus anciennes d'abord.
 */
export function workoutsToCsv(
  workouts: readonly Workout[],
  sets: readonly SetRow[],
  exercises: ReadonlyMap<string, Exercise>,
  gyms: ReadonlyMap<string, Gym>,
): string {
  const header = [
    'Date',
    'Heure',
    'Séance',
    'Salle',
    'Exercice',
    'Série',
    'Type',
    'Charge (kg)',
    'Reps',
    'RIR',
    'Notes exercice',
  ]
  const lines = [header.join(';')]
  const done = [...workouts]
    .filter((w) => w.status === 'done')
    .sort((a, b) => a.startedAt - b.startedAt)
  for (const workout of done) {
    const own = sets.filter((s) => s.workoutId === workout.id && s.done)
    for (const block of workout.blocks) {
      const blockSets = own.filter((s) => s.blockId === block.id).sort((a, b) => a.order - b.order)
      blockSets.forEach((set, i) => {
        lines.push(
          [
            date(workout.startedAt),
            time(workout.startedAt),
            workout.title,
            gyms.get(workout.gymId)?.name ?? '',
            exercises.get(set.exerciseId)?.name ?? '',
            String(i + 1),
            TYPE_LABELS[set.type],
            decimal(set.kg),
            String(set.reps),
            decimal(set.rir),
            i === 0 ? block.notes : '',
          ]
            .map(field)
            .join(';'),
        )
      })
    }
  }
  return '﻿' + lines.join('\r\n') + '\r\n'
}
