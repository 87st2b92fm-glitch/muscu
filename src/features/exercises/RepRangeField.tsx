import { useState } from 'react'
import { FieldLabel } from '../../components/form'
import type { RepRange } from '../../domain/types'
import { normalizeRepRange, parseDecimal } from '../../domain/units'

const inputClass =
  'min-h-12 w-full min-w-0 rounded-2xl bg-surface-2 px-4 text-center font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted focus:ring-2 focus:ring-accent'

/**
 * Fourchette de reps « min – max ». Garde la saisie en cours tant qu'une seule borne est remplie,
 * et n'enregistre que les fourchettes complètes (ou l'absence de fourchette si tout est vidé).
 */
export default function RepRangeField({
  value,
  onCommit,
}: {
  value: RepRange | null
  onCommit: (value: RepRange | null) => void
}) {
  const [min, setMin] = useState(value ? String(value.min) : '')
  const [max, setMax] = useState(value ? String(value.max) : '')

  function commit() {
    if (min.trim() === '' && max.trim() === '') {
      if (value !== null) onCommit(null)
      return
    }
    const range = normalizeRepRange(parseDecimal(min), parseDecimal(max))
    if (!range) return
    setMin(String(range.min))
    setMax(String(range.max))
    if (range.min !== value?.min || range.max !== value?.max) onCommit(range)
  }

  return (
    <FieldLabel
      label="Fourchette de reps"
      hint={min.trim() && max.trim() ? undefined : 'Renseigne les deux bornes, ex. 8 et 12.'}
    >
      <span className="flex items-center gap-3">
        <input
          inputMode="numeric"
          value={min}
          placeholder="8"
          aria-label="Reps minimum"
          onChange={(e) => setMin(e.target.value)}
          onBlur={commit}
          className={inputClass}
        />
        <span className="text-muted">à</span>
        <input
          inputMode="numeric"
          value={max}
          placeholder="12"
          aria-label="Reps maximum"
          onChange={(e) => setMax(e.target.value)}
          onBlur={commit}
          className={inputClass}
        />
      </span>
    </FieldLabel>
  )
}
