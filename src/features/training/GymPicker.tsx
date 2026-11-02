import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import GymBadge from '../../components/GymBadge'
import Sheet from '../../components/Sheet'
import type { GymLook } from '../../data/defaultGyms'

/** Puce « salle du jour » qui ouvre la liste des salles. */
export default function GymPicker({
  gyms,
  value,
  defaultGymId,
  onChange,
}: {
  gyms: GymLook[]
  value: string
  defaultGymId?: string
  onChange: (gymId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = gyms.find((g) => g.id === value) ?? gyms[0]
  if (!current) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Salle : ${current.name}. Changer de salle`}
        className="flex min-h-11 items-center gap-2 rounded-full bg-surface py-1.5 pr-3 pl-1.5 font-semibold active:opacity-80"
      >
        <GymBadge gym={current} size="sm" />
        {current.name}
        <ChevronDown size={18} className="text-muted" aria-hidden />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Salle du jour">
        <ul role="radiogroup" aria-label="Salles" className="flex flex-col gap-1">
          {gyms.map((gym) => (
            <li key={gym.id}>
              <button
                type="button"
                role="radio"
                aria-checked={gym.id === value}
                onClick={() => {
                  onChange(gym.id)
                  setOpen(false)
                }}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left active:bg-surface-2"
              >
                <GymBadge gym={gym} />
                <span className="flex-1">
                  <span className="block font-semibold">{gym.name}</span>
                  {gym.id === defaultGymId && (
                    <span className="block text-sm text-muted">Salle par défaut</span>
                  )}
                </span>
                {gym.id === value && <Check size={22} className="text-accent" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  )
}
