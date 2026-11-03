import { Check } from 'lucide-react'
import RecordBadge from '../../components/RecordBadge'
import type { SetRow } from '../../db/types'
import { formatNumber } from '../../domain/format'
import type { RecordKind } from '../../domain/types'

const TYPE_LABELS = { warmup: 'É', drop: 'D', failure: 'F' } as const

export const SET_GRID =
  'grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_3.75rem_3rem_auto_2.75rem] items-center gap-1'

function formatLoad(kg: number, bodyweight: boolean): string {
  if (bodyweight) return kg > 0 ? `+${formatNumber(kg)}` : 'PDC'
  return kg > 0 ? formatNumber(kg) : '–'
}

/** Charge × reps sur deux lignes (colonnes « Préc. » et « Meill. »), touchable pour la reprendre. */
function PastCell({
  set,
  bodyweight,
  label,
  onCopy,
  className,
}: {
  set: SetRow | null | undefined
  bodyweight: boolean
  label: string
  onCopy: () => void
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={!set}
      aria-label={set ? `Reprendre ${label}` : `Pas de ${label}`}
      className={`flex min-h-12 min-w-0 flex-col justify-center text-left text-xs leading-tight tabular-nums ${className}`}
    >
      {set ? (
        <>
          <span className="truncate">{formatLoad(set.kg, bodyweight)}</span>
          <span>× {set.reps}</span>
        </>
      ) : (
        '—'
      )}
    </button>
  )
}

/** Une ligne de série : numéro/type, perf précédente, meilleure série, charge, reps, RIR, validation. */
export default function SetRowView({
  set,
  label,
  previous,
  best,
  bodyweight,
  showRir,
  records,
  onType,
  onCopyPrevious,
  onCopyBest,
  onKg,
  onReps,
  onRir,
  onToggleDone,
}: {
  set: SetRow
  label: string
  previous: SetRow | undefined
  /** Série la plus lourde faite dans la fourchette de reps conseillée (même valeur sur chaque ligne). */
  best: SetRow | null
  bodyweight: boolean
  showRir: boolean
  records: RecordKind[]
  onType: () => void
  onCopyPrevious: () => void
  onCopyBest: () => void
  onKg: () => void
  onReps: () => void
  onRir: () => void
  onToggleDone: () => void
}) {
  const cell =
    'flex min-h-12 items-center justify-center rounded-xl font-bold tabular-nums active:opacity-70'
  const typeLabel = set.type === 'normal' ? label : TYPE_LABELS[set.type]

  return (
    <div className={`rounded-2xl px-1.5 py-1 transition-colors ${set.done ? 'bg-accent/12' : ''}`}>
      <div className={SET_GRID}>
        <button
          type="button"
          onClick={onType}
          aria-label={`Série ${label} : type et options`}
          className={`${cell} ${set.type === 'warmup' ? 'text-gold' : set.type === 'normal' ? '' : 'text-accent'}`}
        >
          {typeLabel}
        </button>
        <PastCell
          set={previous}
          bodyweight={bodyweight}
          label="la perf précédente"
          onCopy={onCopyPrevious}
          className="text-muted"
        />
        <PastCell
          set={best}
          bodyweight={bodyweight}
          label="ta meilleure série"
          onCopy={onCopyBest}
          className="text-gold"
        />
        <button
          type="button"
          onClick={onKg}
          aria-label="Charge"
          className={`${cell} bg-surface-2 text-lg`}
        >
          {formatLoad(set.kg, bodyweight)}
        </button>
        <button
          type="button"
          onClick={onReps}
          aria-label="Répétitions"
          className={`${cell} bg-surface-2 text-lg`}
        >
          {set.reps > 0 ? set.reps : '–'}
        </button>
        {showRir ? (
          <button
            type="button"
            onClick={onRir}
            aria-label="RIR"
            className={`${cell} w-10 bg-surface-2 text-sm`}
          >
            {set.rir === null ? '–' : formatNumber(set.rir)}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onToggleDone}
          aria-pressed={set.done}
          aria-label={set.done ? 'Série validée, annuler' : 'Valider la série'}
          disabled={!set.done && set.reps <= 0}
          className={`flex size-11 items-center justify-center rounded-xl transition-colors disabled:opacity-30 ${
            set.done ? 'bg-accent text-accent-contrast' : 'bg-surface-2 text-muted'
          }`}
        >
          <Check size={24} strokeWidth={3} aria-hidden />
        </button>
      </div>
      {records.length > 0 && (
        <div className="flex justify-end gap-1.5 pt-1 pr-1">
          {records.map((kind) => (
            <RecordBadge key={kind} kind={kind} />
          ))}
        </div>
      )}
    </div>
  )
}
