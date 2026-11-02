import { Minus, Plus } from 'lucide-react'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { formatNumber } from '../../domain/format'
import { parseDecimal, round2 } from '../../domain/units'

/** Ce qu'on modifie : la charge ou les reps d'une série (la valeur est relue à chaque rendu). */
export interface EditTarget {
  setId: string
  field: 'kg' | 'reps'
  title: string
  unit: string
  /** Pas des boutons − / + (incrément de la machine pour une charge, 1 pour les reps). */
  step: number
  integer: boolean
}

export interface ValueEdit extends EditTarget {
  value: number
  onChange: (value: number) => void
}

/** Saisie au pouce : très gros chiffres, − / + rapides, ou frappe directe au clavier. */
export default function ValueSheet({
  edit,
  onClose,
}: {
  edit: ValueEdit | null
  onClose: () => void
}) {
  const round = (v: number) => Math.max(0, edit?.integer ? Math.round(v) : round2(v))
  const big =
    'flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-2 active:opacity-70'

  return (
    <Sheet open={edit !== null} onClose={onClose} title={edit?.title ?? ''}>
      {edit && (
        <div className="flex flex-col gap-5 pb-2">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className={big}
              aria-label={`Moins ${formatNumber(edit.step)}`}
              onClick={() => edit.onChange(round(edit.value - edit.step))}
            >
              <Minus size={28} aria-hidden />
            </button>
            <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
              <input
                key={edit.value}
                defaultValue={formatNumber(edit.value)}
                inputMode={edit.integer ? 'numeric' : 'decimal'}
                aria-label={edit.title}
                onBlur={(e) => {
                  const parsed = parseDecimal(e.target.value)
                  if (parsed !== null) edit.onChange(round(parsed))
                  else e.target.value = formatNumber(edit.value)
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full min-w-0 bg-transparent text-center text-6xl font-extrabold tabular-nums outline-none"
              />
              <span className="text-xl text-muted">{edit.unit}</span>
            </label>
            <button
              type="button"
              className={big}
              aria-label={`Plus ${formatNumber(edit.step)}`}
              onClick={() => edit.onChange(round(edit.value + edit.step))}
            >
              <Plus size={28} aria-hidden />
            </button>
          </div>
          <p className="text-center text-sm text-muted">
            − / + : {formatNumber(edit.step)} {edit.unit}
          </p>
          <Button className="min-h-14 text-lg" onClick={onClose}>
            OK
          </Button>
        </div>
      )}
    </Sheet>
  )
}
