import { Link } from 'react-router'
import { useConfirm } from '../../components/confirmContext'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../../components/Button'
import RecordBadge from '../../components/RecordBadge'
import type { Exercise, SetRow, Workout, WorkoutBlock } from '../../db/types'
import { addPastSet } from '../../db/history'
import { removeBlock } from '../../db/workouts'
import { formatNumber } from '../../domain/format'
import type { RecordKind } from '../../domain/types'
import type { EditTarget } from '../workout/ValueSheet'

const TYPE_LABELS = { warmup: 'É', drop: 'D', failure: 'F' } as const

function load(kg: number, bodyweight: boolean): string {
  if (bodyweight) return kg > 0 ? `PDC + ${formatNumber(kg)} kg` : 'PDC'
  return `${formatNumber(kg)} kg`
}

/** Un exercice d'une séance passée : lecture, ou modification série par série. */
export default function PastBlock({
  workout,
  block,
  exercise,
  sets,
  flags,
  supersetColor,
  editing,
  onEdit,
  onSetMenu,
}: {
  workout: Workout
  block: WorkoutBlock
  exercise: Exercise | undefined
  sets: SetRow[]
  flags: ReadonlyMap<string, RecordKind[]>
  supersetColor: string | null
  editing: boolean
  onEdit: (target: EditTarget) => void
  onSetMenu: (set: SetRow) => void
}) {
  const confirm = useConfirm()
  const bodyweight = exercise?.loadMode === 'bodyweight'
  const cell =
    'flex min-h-11 items-center justify-center rounded-xl bg-surface-2 px-3 font-bold tabular-nums active:opacity-70'
  let workingIndex = 0

  return (
    <article
      className="flex flex-col gap-3 rounded-3xl bg-surface p-4"
      style={supersetColor ? { boxShadow: `inset 4px 0 0 ${supersetColor}` } : undefined}
    >
      <header>
        {supersetColor && (
          <p className="text-xs font-bold tracking-wide uppercase" style={{ color: supersetColor }}>
            Superset
          </p>
        )}
        {exercise && !editing ? (
          <Link to={`/exercices/${exercise.id}`} className="text-lg leading-tight font-bold">
            {exercise.name}
          </Link>
        ) : (
          <h2 className="text-lg leading-tight font-bold">
            {exercise?.name ?? 'Exercice supprimé'}
          </h2>
        )}
        {block.notes && (
          <p className="mt-1 text-sm whitespace-pre-line text-muted">{block.notes}</p>
        )}
      </header>

      <ul className="flex flex-col gap-1.5">
        {sets.map((set) => {
          if (set.type !== 'warmup') workingIndex++
          const label = set.type === 'normal' ? String(workingIndex) : TYPE_LABELS[set.type]
          const records = flags.get(set.id) ?? []
          return (
            <li key={set.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => onSetMenu(set)}
                    aria-label={`Série ${label} : type et options`}
                    className={`${cell} w-11 px-0 ${set.type === 'warmup' ? 'text-gold' : ''}`}
                  >
                    {label}
                  </button>
                  <button
                    type="button"
                    aria-label="Charge"
                    className={`${cell} min-w-20`}
                    onClick={() =>
                      onEdit({
                        setId: set.id,
                        field: 'kg',
                        title: bodyweight ? 'Lest' : 'Charge',
                        unit: 'kg',
                        step: 2.5,
                        integer: false,
                      })
                    }
                  >
                    {bodyweight && set.kg > 0 ? '+' : ''}
                    {formatNumber(set.kg)} kg
                  </button>
                  <span className="text-muted">×</span>
                  <button
                    type="button"
                    aria-label="Répétitions"
                    className={`${cell} min-w-14`}
                    onClick={() =>
                      onEdit({
                        setId: set.id,
                        field: 'reps',
                        title: 'Répétitions',
                        unit: 'reps',
                        step: 1,
                        integer: true,
                      })
                    }
                  >
                    {set.reps}
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`w-6 text-center font-bold ${set.type === 'warmup' ? 'text-gold' : 'text-muted'}`}
                  >
                    {label}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {load(set.kg, bodyweight)} × {set.reps}
                  </span>
                  {set.rir !== null && (
                    <span className="text-sm text-muted">RIR {formatNumber(set.rir)}</span>
                  )}
                </>
              )}
              {records.map((kind) => (
                <RecordBadge key={kind} kind={kind} />
              ))}
            </li>
          )
        })}
        {sets.length === 0 && <li className="text-sm text-muted">Aucune série.</li>}
      </ul>

      {editing && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => void addPastSet(workout.id, block.id)}
          >
            <Plus size={18} aria-hidden />
            Série
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={async () => {
              const ok = await confirm({
                title: `Retirer « ${exercise?.name ?? 'cet exercice'} » ?`,
                message: 'Ses séries seront supprimées de cette séance.',
                confirmLabel: 'Retirer',
                danger: true,
              })
              if (ok) void removeBlock(workout, block.id)
            }}
          >
            <Trash2 size={18} aria-hidden />
            Retirer
          </Button>
        </div>
      )}
    </article>
  )
}
