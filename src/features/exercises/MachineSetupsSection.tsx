import { useLiveQuery } from 'dexie-react-hooks'
import GymBadge from '../../components/GymBadge'
import { FieldLabel, FormSection, NumberField, TextField } from '../../components/form'
import { db } from '../../db/db'
import { setMachineLink, updateMachineSetup } from '../../db/exercises'
import { useGyms } from '../../db/hooks'
import type { Exercise } from '../../db/types'
import { linkedGymId } from '../../domain/machineLinks'

/** Marque/modèle, incrément et lien entre salles pour une machine, salle par salle. */
export default function MachineSetupsSection({ exercise }: { exercise: Exercise }) {
  const gyms = useGyms()
  const setups = useLiveQuery(
    () => db.machineSetups.filter((s) => s.exerciseId === exercise.id).toArray(),
    [exercise.id],
  )
  if (!gyms || !setups) return null

  return (
    <FormSection
      title="Par salle"
      hint="Une même machine n’a pas la même charge réelle d’une marque à l’autre : les records sont séparés par salle, sauf si tu lies deux machines identiques."
    >
      {gyms.map((gym, i) => {
        const setup = setups.find((s) => s.gymId === gym.id)
        const linked = linkedGymId(setups, gym.id)
        return (
          <div
            key={gym.id}
            className={`flex flex-col gap-3 ${i > 0 ? 'border-t border-border pt-4' : ''}`}
          >
            <p className="flex items-center gap-2 font-bold">
              <GymBadge gym={gym} size="sm" />
              {gym.name}
            </p>
            <TextField
              label="Marque / modèle"
              placeholder="ex. Panatta, Gym80…"
              value={setup?.brandModel ?? ''}
              onCommit={(brandModel) =>
                updateMachineSetup(exercise.id, gym.id, { brandModel: brandModel || null })
              }
            />
            <NumberField
              label="Plus petit incrément"
              suffix="kg"
              placeholder="ex. 2,5"
              value={setup?.incrementKg ?? null}
              hint="Pour la suggestion de charge : décimales acceptées (ex. 2,27)."
              onCommit={(incrementKg) => updateMachineSetup(exercise.id, gym.id, { incrementKg })}
            />
            {gyms.length > 1 && (
              <FieldLabel label="Même machine que…">
                <select
                  value={linked ?? ''}
                  onChange={(e) => setMachineLink(exercise.id, gym.id, e.target.value || null)}
                  className="min-h-12 rounded-2xl bg-surface-2 px-4 outline-none"
                >
                  <option value="">Aucune autre salle</option>
                  {gyms
                    .filter((g) => g.id !== gym.id)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} (records fusionnés)
                      </option>
                    ))}
                </select>
              </FieldLabel>
            )}
          </div>
        )
      })}
    </FormSection>
  )
}
