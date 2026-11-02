import GymBadge from './GymBadge'
import type { GymLook } from '../data/defaultGyms'

/** Puces horizontales « Toutes / On Air / SUAPS / … ». `null` = toutes les salles. */
export default function GymFilter({
  gyms,
  value,
  onChange,
}: {
  gyms: GymLook[]
  value: string | null
  onChange: (gymId: string | null) => void
}) {
  const chip = (selected: boolean) =>
    `flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
      selected ? 'bg-text text-bg' : 'bg-surface text-text'
    }`

  return (
    <div
      role="radiogroup"
      aria-label="Filtrer par salle"
      className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        onClick={() => onChange(null)}
        className={chip(value === null)}
      >
        Toutes
      </button>
      {gyms.map((gym) => (
        <button
          key={gym.id}
          type="button"
          role="radio"
          aria-checked={value === gym.id}
          onClick={() => onChange(gym.id)}
          className={`${chip(value === gym.id)} pl-2.5`}
        >
          <GymBadge gym={gym} size="sm" />
          {gym.name}
        </button>
      ))}
    </div>
  )
}
