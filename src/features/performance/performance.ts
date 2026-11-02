import type { Exercise } from '../../db/types'
import { formatKg } from '../../domain/format'
import { sessionSeries, type SessionPoint } from '../../domain/progress'
import { recordScope } from '../../domain/recordScope'
import { computeRecords, type ExerciseRecords } from '../../domain/records'
import type { ScoredSet } from '../../domain/types'
import { scoreHistory, type SummaryInput } from '../home/summaries'

export interface ExercisePerformance {
  exercise: Exercise
  records: ExerciseRecords
  series: SessionPoint[]
  lastAt: number
}

/**
 * Performances de chaque exercice vu depuis une salle : un poids libre compte toutes ses séries,
 * une machine seulement celles de cette salle (ou des salles où la machine est liée).
 * Charges effectives (poids du corps inclus pour les exercices lestés). Plus récents d'abord.
 */
export function performancesForGym(input: SummaryInput, gymId: string): ExercisePerformance[] {
  const { effective } = scoreHistory(input)
  const byExercise = new Map<string, (ScoredSet & { workoutId: string })[]>()
  for (const set of input.sets) {
    const kg = effective.get(set.id)
    const exercise = input.exercises.get(set.exerciseId)
    if (kg === undefined || !exercise) continue
    if (recordScope(exercise, set.gymId, input.links) !== recordScope(exercise, gymId, input.links))
      continue
    byExercise.set(exercise.id, [
      ...(byExercise.get(exercise.id) ?? []),
      { id: set.id, workoutId: set.workoutId, at: set.at, type: set.type, reps: set.reps, kg },
    ])
  }

  const result: ExercisePerformance[] = []
  for (const [exerciseId, sets] of byExercise) {
    const series = sessionSeries(sets)
    if (series.length === 0) continue
    result.push({
      exercise: input.exercises.get(exerciseId)!,
      records: computeRecords(sets),
      series,
      lastAt: series[series.length - 1]!.at,
    })
  }
  return result.sort((a, b) => b.lastAt - a.lastAt)
}

const TREND_POINTS = 12

/** Chiffre clé d'un exercice : 1RM estimé, sinon charge max, sinon reps max. */
export function headline(p: ExercisePerformance): {
  label: string
  value: string
  trend: number[]
} {
  const recent = p.series.slice(-TREND_POINTS)
  if (p.records.estimatedOneRm) {
    return {
      label: '1RM est.',
      value: formatKg(Math.round(p.records.estimatedOneRm.value)),
      trend: recent.flatMap((s) => (s.e1rm === null ? [] : [s.e1rm])),
    }
  }
  if (p.records.maxWeight) {
    return {
      label: 'Max',
      value: formatKg(p.records.maxWeight.value),
      trend: recent.map((s) => s.maxKg),
    }
  }
  return {
    label: 'Reps max',
    value: String(p.records.maxReps?.value ?? 0),
    trend: recent.map((s) => s.best.reps),
  }
}
