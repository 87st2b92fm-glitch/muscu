import { Trophy } from 'lucide-react'
import GymBadge from '../../components/GymBadge'
import {
  formatBodyweightSet,
  formatDay,
  formatDuration,
  formatKg,
  formatSet,
} from '../../domain/format'
import type { WorkoutSummary } from './types'

const VISIBLE_EXERCISES = 4

function Stat({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span
        className={`flex items-center gap-1 font-semibold tabular-nums ${gold ? 'text-gold' : ''}`}
      >
        {gold && <Trophy size={15} strokeWidth={2.5} aria-hidden />}
        {value}
      </span>
    </div>
  )
}

export default function WorkoutCard({ workout }: { workout: WorkoutSummary }) {
  const records = workout.exercises.reduce((n, e) => n + e.records.length, 0)
  const hidden = workout.exercises.length - VISIBLE_EXERCISES

  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-surface p-4">
      <header className="flex items-center gap-3">
        <GymBadge gym={workout.gym} />
        <div className="min-w-0">
          <h3 className="truncate text-lg leading-tight font-bold">{workout.title}</h3>
          <p className="text-sm text-muted">
            {formatDay(new Date(workout.startedAt))} · {workout.gym.name}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Durée" value={formatDuration(workout.durationMin)} />
        <Stat label="Volume" value={formatKg(workout.volumeKg)} />
        {records > 0 ? (
          <Stat label="Records" value={String(records)} gold />
        ) : (
          <Stat label="Exercices" value={String(workout.exercises.length)} />
        )}
      </div>

      <ul className="flex flex-col gap-2.5 border-t border-border pt-3.5">
        {workout.exercises.slice(0, VISIBLE_EXERCISES).map((exercise) => {
          const isRecord = exercise.records.length > 0
          return (
            <li key={exercise.key} className="flex items-center justify-between gap-3 text-[15px]">
              <span className="min-w-0 truncate">
                <span className="text-muted tabular-nums">{exercise.sets} × </span>
                {exercise.name}
              </span>
              <span
                className={`flex shrink-0 items-center gap-1 font-medium tabular-nums ${
                  isRecord ? 'text-gold' : 'text-muted'
                }`}
              >
                {isRecord && (
                  <Trophy size={14} strokeWidth={2.5} aria-label="Record battu" role="img" />
                )}
                {exercise.bodyweight
                  ? formatBodyweightSet(exercise.best.kg, exercise.best.reps)
                  : formatSet(exercise.best.kg, exercise.best.reps)}
              </span>
            </li>
          )
        })}
        {hidden > 0 && (
          <li className="text-sm text-muted">
            + {hidden} autre{hidden > 1 ? 's' : ''} exercice{hidden > 1 ? 's' : ''}
          </li>
        )}
      </ul>
    </article>
  )
}
