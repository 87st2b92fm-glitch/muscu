import ExerciseSearchList from '../../components/ExerciseSearchList'
import Sheet from '../../components/Sheet'
import { categoryOf } from '../../data/exercises'
import { EQUIPMENT_LABELS, type Equipment, type Exercise } from '../../db/types'
import type { NameEntry, Resolution } from '../../import/preview'

const EQUIPMENTS = Object.keys(EQUIPMENT_LABELS) as Equipment[]

/** Choisit ce que devient un nom Hevy : nouvel exercice (avec son équipement) ou exercice existant. */
export default function ExerciseChoiceSheet({
  entry,
  resolution,
  exercises,
  onChange,
  onClose,
}: {
  entry: NameEntry | null
  resolution: Resolution | null
  exercises: readonly Exercise[]
  onChange: (resolution: Resolution) => void
  onClose: () => void
}) {
  function choose(next: Resolution) {
    onChange(next)
    onClose()
  }

  return (
    <Sheet open={entry !== null} onClose={onClose} title={entry?.sourceName ?? ''}>
      {entry && (
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h3 className="font-semibold">Créer un nouvel exercice</h3>
            <p className="text-sm text-muted">
              Choisis l’équipement : poulies, machines et Smith ont des records séparés par salle.
            </p>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENTS.map((equipment) => {
                const selected = resolution?.kind === 'create' && resolution.equipment === equipment
                return (
                  <button
                    key={equipment}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      choose({ kind: 'create', category: categoryOf(equipment), equipment })
                    }
                    className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
                      selected ? 'bg-accent text-accent-contrast' : 'bg-surface-2'
                    }`}
                  >
                    {EQUIPMENT_LABELS[equipment]}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="font-semibold">Ou l’associer à un exercice existant</h3>
            <ExerciseSearchList
              exercises={exercises}
              selectedId={resolution?.kind === 'existing' ? resolution.exerciseId : undefined}
              onPick={(exerciseId) => choose({ kind: 'existing', exerciseId })}
            />
          </section>
        </div>
      )}
    </Sheet>
  )
}
