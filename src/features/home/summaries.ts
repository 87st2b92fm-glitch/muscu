import type { GymLook } from '../../data/defaultGyms'
import type { Exercise, SetRow, Workout } from '../../db/types'
import { bodyweightAt, type BodyweightEntry } from '../../domain/bodyweight'
import { recordFlags, type HistorySet } from '../../domain/history'
import { effectiveKg } from '../../domain/load'
import { recordScope, type MachineLink } from '../../domain/recordScope'
import { round2 } from '../../domain/units'
import type { RecordKind } from '../../domain/types'
import type { WorkoutSummary } from './types'

export interface SummaryInput {
  workouts: readonly Workout[]
  sets: readonly SetRow[]
  exercises: ReadonlyMap<string, Exercise>
  gyms: ReadonlyMap<string, GymLook>
  bodyweights: readonly BodyweightEntry[]
  links: readonly MachineLink[]
}

const UNKNOWN_GYM: GymLook = { id: '?', name: 'Salle supprimée', color: '#6b7280' }

/**
 * Résumés des séances terminées, de la plus récente à la plus ancienne : durée, volume
 * (charge effective), meilleure série par exercice et records battus.
 */
export function buildSummaries(input: SummaryInput): WorkoutSummary[] {
  const done = input.workouts.filter((w) => w.status === 'done')
  const doneIds = new Set(done.map((w) => w.id))

  // Charge effective et portée de chaque série, puis records sur tout l'historique.
  const history: HistorySet[] = []
  for (const set of input.sets) {
    const exercise = input.exercises.get(set.exerciseId)
    if (!set.done || !exercise || !doneIds.has(set.workoutId)) continue
    const kg =
      effectiveKg(set.kg, exercise.loadMode, bodyweightAt(set.at, input.bodyweights)) ?? set.kg
    history.push({
      id: set.id,
      workoutId: set.workoutId,
      scope: recordScope(exercise, set.gymId, input.links),
      at: set.at,
      type: set.type,
      reps: set.reps,
      kg,
    })
  }
  const flags = recordFlags(history)
  const effective = new Map(history.map((s) => [s.id, s.kg]))

  const setsByBlock = new Map<string, SetRow[]>()
  for (const set of input.sets) {
    if (effective.has(set.id))
      setsByBlock.set(set.blockId, [...(setsByBlock.get(set.blockId) ?? []), set])
  }

  return done
    .map((workout) => {
      let volumeKg = 0
      const exercises = workout.blocks.flatMap((block) => {
        const exercise = input.exercises.get(block.exerciseId)
        const working = (setsByBlock.get(block.id) ?? []).filter((s) => s.type !== 'warmup')
        if (!exercise || working.length === 0) return []

        let best = working[0]!
        const records = new Set<RecordKind>()
        for (const set of working) {
          const kg = effective.get(set.id)!
          volumeKg += kg * set.reps
          const bestKg = effective.get(best.id)!
          if (kg > bestKg || (kg === bestKg && set.reps > best.reps)) best = set
          for (const kind of flags.get(set.id) ?? []) records.add(kind)
        }
        return [
          {
            key: block.id,
            name: exercise.name,
            sets: working.length,
            best: { kg: best.kg, reps: best.reps },
            bodyweight: exercise.loadMode === 'bodyweight',
            records: (['weight', 'volume'] as const).filter((k) => records.has(k)),
          },
        ]
      })
      return {
        id: workout.id,
        title: workout.title,
        startedAt: workout.startedAt,
        durationMin: ((workout.endedAt ?? workout.startedAt) - workout.startedAt) / 60_000,
        gym: input.gyms.get(workout.gymId) ?? UNKNOWN_GYM,
        volumeKg: round2(volumeKg),
        exercises,
      }
    })
    .sort((a, b) => b.startedAt - a.startedAt)
}
