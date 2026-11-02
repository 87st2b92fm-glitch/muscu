import type { ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { formatNumber } from '../domain/format'
import { parseDecimal } from '../domain/units'

const inputClass =
  'min-h-12 w-full min-w-0 rounded-2xl bg-surface-2 px-4 outline-none placeholder:text-muted focus:ring-2 focus:ring-accent'

export function FieldLabel({
  label,
  hint,
  hideLabel = false,
  children,
}: {
  label: string
  hint?: string
  hideLabel?: boolean
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={hideLabel ? 'sr-only' : 'text-sm font-semibold text-muted'}>{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

/**
 * Champ texte enregistré à la sortie du champ (pas de bouton « Enregistrer »).
 * Un champ obligatoire vidé reprend sa valeur précédente.
 */
export function TextField({
  label,
  value,
  onCommit,
  placeholder,
  required = false,
  hint,
}: {
  label: string
  value: string
  onCommit: (value: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
}) {
  return (
    <FieldLabel label={label} hint={hint}>
      <input
        key={value}
        defaultValue={value}
        placeholder={placeholder}
        className={inputClass}
        onBlur={(e) => {
          const next = e.target.value.trim()
          if (required && next === '') e.target.value = value
          else if (next !== value) onCommit(next)
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </FieldLabel>
  )
}

/** Champ numérique (virgule acceptée), enregistré à la sortie ; vide = null si `allowEmpty`. */
export function NumberField({
  label,
  value,
  onCommit,
  suffix,
  placeholder,
  allowEmpty = true,
  integer = false,
  hint,
  hideLabel = false,
}: {
  label: string
  value: number | null
  onCommit: (value: number | null) => void
  suffix?: string
  placeholder?: string
  allowEmpty?: boolean
  integer?: boolean
  hint?: string
  hideLabel?: boolean
}) {
  const shown = value === null ? '' : formatNumber(value)
  return (
    <FieldLabel label={label} hint={hint} hideLabel={hideLabel}>
      <span className="flex items-center gap-2 rounded-2xl bg-surface-2 pr-4 focus-within:ring-2 focus-within:ring-accent">
        <input
          key={shown}
          defaultValue={shown}
          inputMode={integer ? 'numeric' : 'decimal'}
          placeholder={placeholder}
          className="min-h-12 w-full min-w-0 bg-transparent pl-4 font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted"
          onBlur={(e) => {
            const text = e.target.value.trim()
            if (text === '' && allowEmpty) {
              if (value !== null) onCommit(null)
              return
            }
            const parsed = parseDecimal(text)
            if (parsed === null) {
              e.target.value = shown
              return
            }
            const next = integer ? Math.round(parsed) : parsed
            if (next !== value) onCommit(next)
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {suffix && <span className="shrink-0 text-sm text-muted">{suffix}</span>}
      </span>
    </FieldLabel>
  )
}

/** − valeur + avec de grosses zones tactiles. */
export function Stepper({
  value,
  onChange,
  min = 0,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  label: string
}) {
  const button =
    'flex size-11 items-center justify-center rounded-full bg-surface-2 active:opacity-70 disabled:opacity-30'
  return (
    <span className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        className={button}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={`${label} : moins`}
      >
        <Minus size={18} aria-hidden />
      </button>
      <span className="w-6 text-center font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        aria-label={`${label} : plus`}
      >
        <Plus size={18} aria-hidden />
      </button>
    </span>
  )
}

/** Carte de section avec titre, comme dans les réglages iOS. */
export function FormSection({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-semibold text-muted">{title}</h2>
      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-4">{children}</div>
      {hint && <p className="px-1 text-xs text-muted">{hint}</p>}
    </section>
  )
}

/** Puces à choix multiple ou unique. */
export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${
        selected ? 'bg-accent text-accent-contrast' : 'bg-surface-2 text-text'
      }`}
    >
      {children}
    </button>
  )
}
