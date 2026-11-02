import { Chip } from '../../components/form'
import { MUSCLES, MUSCLE_IDS, type MuscleId } from '../../data/muscles'

/** Sélection multiple de muscles ; ceux de `excluded` (déjà choisis ailleurs) sont masqués. */
export default function MuscleChips({
  value,
  excluded = [],
  onChange,
}: {
  value: MuscleId[]
  excluded?: MuscleId[]
  onChange: (value: MuscleId[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MUSCLE_IDS.filter((m) => !excluded.includes(m)).map((muscle) => {
        const selected = value.includes(muscle)
        return (
          <Chip
            key={muscle}
            selected={selected}
            onClick={() =>
              onChange(selected ? value.filter((m) => m !== muscle) : [...value, muscle])
            }
          >
            {MUSCLES[muscle]}
          </Chip>
        )
      })}
    </div>
  )
}
