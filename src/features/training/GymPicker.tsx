import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import GymBadge from '../../components/GymBadge'
import Sheet from '../../components/Sheet'
import { DEFAULT_GYM_ID, type GymLook } from '../../data/defaultGyms'

/** Puce « salle du jour » qui ouvre la liste des salles. */
export default function GymPicker({
  gyms,
  value,
  onChange,
}: {
  gyms: GymLook[]
  value: string
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
        className="bg-surface flex min-h-11 items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 font-semibold active:opacity-80"
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
                className="active:bg-surface-2 flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left"
              >
                <GymBadge gym={gym} />
                <span className="flex-1">
                  <span className="block font-semibold">{gym.name}</span>
                  {gym.id === DEFAULT_GYM_ID && (
                    <span className="text-muted block text-sm">Salle par défaut</span>
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
