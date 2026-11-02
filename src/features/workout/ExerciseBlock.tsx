import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Link2,
  Link2Off,
  Lightbulb,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { Chip, NumberField } from '../../components/form'
import type { ExerciseContext } from '../../db/exerciseContext'
import type { SetRow, Workout, WorkoutBlock } from '../../db/types'
import {
  addSet,
  deleteSet,
  moveBlock,
  removeBlock,
  toggleSetDone,
  toggleSupersetWithNext,
  updateBlock,
  updateSet,
} from '../../db/workouts'
import { formatKg, formatNumber } from '../../domain/format'
import type { RecordKind, SetType } from '../../domain/types'
import SetRowView, { SET_GRID } from './SetRowView'
import { unlockAudio } from './sound'
import type { EditTarget } from './ValueSheet'

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'normal', label: 'Normale' },
  { value: 'warmup', label: 'Échauffement' },
  { value: 'drop', label: 'Dégressive' },
  { value: 'failure', label: 'Échec' },
]
const RIR_VALUES = [0, 1, 2, 3, 4, 5]
const DEFAULT_KG_STEP = 2.5

function suggestionText(context: ExerciseContext): string | null {
  const s = context.suggestion
  if (!s) return null
  if (s.action === 'increase') {
    return s.kg === null
      ? `Toutes tes séries ont atteint le haut de la fourchette : monte la charge (${s.reps} reps).`
      : `Suggestion : ${formatKg(s.kg)} × ${s.reps}`
  }
  return `Suggestion : ${formatKg(s.kg)}, vise ${s.reps.join(' / ')} reps`
}

export default function ExerciseBlock({
  workout,
  block,
  sets,
  context,
  records,
  supersetColor,
  isFirst,
  isLast,
  showRir,
  onEdit,
}: {
  workout: Workout
  block: WorkoutBlock
  sets: SetRow[]
  context: ExerciseContext | undefined
  records: ReadonlyMap<string, RecordKind[]>
  supersetColor: string | null
  isFirst: boolean
  isLast: boolean
  showRir: boolean
  onEdit: (target: EditTarget) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [setMenu, setSetMenu] = useState<SetRow | null>(null)
  const [rirFor, setRirFor] = useState<SetRow | null>(null)
  const exercise = context?.exercise
  const bodyweight = exercise?.loadMode === 'bodyweight'
  const kgStep = context?.incrementKg ?? DEFAULT_KG_STEP
  const suggestion = context ? suggestionText(context) : null
  let workingIndex = 0

  return (
    <article
      className="flex flex-col gap-3 rounded-3xl bg-surface p-3"
      style={supersetColor ? { boxShadow: `inset 4px 0 0 ${supersetColor}` } : undefined}
    >
      <header className="flex items-start gap-2 pl-1">
        <div className="min-w-0 flex-1 pt-1.5">
          {supersetColor && (
            <p
              className="text-xs font-bold tracking-wide uppercase"
              style={{ color: supersetColor }}
            >
              Superset
            </p>
          )}
          <h2 className="text-lg leading-tight font-bold">
            {exercise?.name ?? 'Exercice supprimé'}
          </h2>
          {block.notes && (
            <p className="mt-1 text-sm whitespace-pre-line text-muted">{block.notes}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Options de l’exercice"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2"
        >
          <MoreHorizontal size={24} aria-hidden />
        </button>
      </header>

      {suggestion && (
        <p className="flex items-start gap-2 rounded-2xl bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
          <Lightbulb size={16} className="mt-0.5 shrink-0" aria-hidden />
          {suggestion}
        </p>
      )}

      <div className={`${SET_GRID} px-1.5 text-xs font-semibold text-muted`}>
        <span className="text-center">Série</span>
        <span>Préc.</span>
        <span className="text-center">{bodyweight ? 'Lest' : 'kg'}</span>
        <span className="text-center">Reps</span>
        <span className={showRir ? 'w-10 text-center' : ''}>{showRir ? 'RIR' : ''}</span>
        <span />
      </div>

      <div className="flex flex-col gap-1">
        {sets.map((set, i) => {
          if (set.type !== 'warmup') workingIndex++
          return (
            <SetRowView
              key={set.id}
              set={set}
              label={String(workingIndex)}
              previous={context?.previous[i]}
              bodyweight={bodyweight}
              showRir={showRir}
              records={records.get(set.id) ?? []}
              onType={() => setSetMenu(set)}
              onCopyPrevious={() => {
                const previous = context?.previous[i]
                if (previous) void updateSet(set.id, { kg: previous.kg, reps: previous.reps })
              }}
              onKg={() =>
                onEdit({
                  setId: set.id,
                  field: 'kg',
                  title: bodyweight ? 'Lest' : 'Charge',
                  unit: 'kg',
                  step: kgStep,
                  integer: false,
                })
              }
              onReps={() =>
                onEdit({
                  setId: set.id,
                  field: 'reps',
                  title: 'Répétitions',
                  unit: 'reps',
                  step: 1,
                  integer: true,
                })
              }
              onRir={() => setRirFor(set)}
              onToggleDone={() => {
                unlockAudio()
                void toggleSetDone(workout, set)
              }}
            />
          )
        })}
      </div>

      <Button variant="ghost" onClick={() => void addSet(workout, block.id)}>
        <Plus size={20} aria-hidden />
        Ajouter une série
      </Button>

      <Sheet open={setMenu !== null} onClose={() => setSetMenu(null)} title="Type de série">
        {setMenu && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {SET_TYPES.map(({ value, label }) => (
                <Chip
                  key={value}
                  selected={setMenu.type === value}
                  onClick={() => {
                    void updateSet(setMenu.id, { type: value })
                    setSetMenu(null)
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-muted">
              Les échauffements ne comptent ni dans les records ni dans le volume.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                void deleteSet(setMenu.id)
                setSetMenu(null)
              }}
            >
              <Trash2 size={18} aria-hidden />
              Supprimer la série
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={rirFor !== null} onClose={() => setRirFor(null)} title="Reps en réserve (RIR)">
        {rirFor && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-6 gap-2">
              {RIR_VALUES.map((rir) => (
                <button
                  key={rir}
                  type="button"
                  aria-pressed={rirFor.rir === rir}
                  onClick={() => {
                    void updateSet(rirFor.id, { rir })
                    setRirFor(null)
                  }}
                  className={`min-h-14 rounded-2xl text-xl font-bold ${
                    rirFor.rir === rir ? 'bg-accent text-accent-contrast' : 'bg-surface-2'
                  }`}
                >
                  {rir === 5 ? '5+' : rir}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                void updateSet(rirFor.id, { rir: null })
                setRirFor(null)
              }}
            >
              Effacer
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={exercise?.name ?? 'Exercice'}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Notes</span>
            <textarea
              defaultValue={block.notes}
              rows={3}
              onBlur={(e) => void updateBlock(workout, block.id, { notes: e.target.value.trim() })}
              className="rounded-2xl bg-surface-2 px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <NumberField
            label="Repos pour cet exercice"
            suffix="s"
            integer
            placeholder={exercise?.restSec ? formatNumber(exercise.restSec) : 'Réglage par défaut'}
            value={block.restSec}
            onCommit={(restSec) => void updateBlock(workout, block.id, { restSec })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={isFirst}
              onClick={() => void moveBlock(workout, block.id, -1)}
            >
              <ArrowUp size={18} aria-hidden />
              Monter
            </Button>
            <Button
              variant="secondary"
              disabled={isLast}
              onClick={() => void moveBlock(workout, block.id, 1)}
            >
              <ArrowDown size={18} aria-hidden />
              Descendre
            </Button>
          </div>
          <Button
            variant="secondary"
            disabled={!block.supersetId && isLast}
            onClick={() => {
              void toggleSupersetWithNext(workout, block.id)
              setMenuOpen(false)
            }}
          >
            {block.supersetId ? (
              <Link2Off size={18} aria-hidden />
            ) : (
              <Link2 size={18} aria-hidden />
            )}
            {block.supersetId ? 'Retirer du superset' : 'Superset avec l’exercice suivant'}
          </Button>
          <Button
            variant="ghost"
            className="text-muted"
            onClick={() => {
              if (!window.confirm(`Retirer « ${exercise?.name ?? 'cet exercice'} » de la séance ?`))
                return
              void removeBlock(workout, block.id)
              setMenuOpen(false)
            }}
          >
            <Trash2 size={18} aria-hidden />
            Retirer de la séance
          </Button>
        </div>
      </Sheet>
    </article>
  )
}
