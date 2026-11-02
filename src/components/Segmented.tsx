import type { LucideIcon } from 'lucide-react'

/** Choix exclusif en pastilles (thème, sexe…). */
export default function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string; icon?: LucideIcon }[]
  value: T | null
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-2xl bg-surface-2 p-1">
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
        <button
          key={optionValue}
          type="button"
          role="radio"
          aria-checked={value === optionValue}
          onClick={() => onChange(optionValue)}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${
            value === optionValue ? 'bg-surface text-text shadow-sm' : 'text-muted'
          }`}
        >
          {Icon && <Icon size={18} aria-hidden />}
          {optionLabel}
        </button>
      ))}
    </div>
  )
}
