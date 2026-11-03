import { BACK_REGIONS, FRONT_REGIONS } from '../data/bodyMapPaths'
import { muscleOfRegion } from '../data/bodyRegions'
import { MUSCLES, type MuscleId } from '../data/muscles'

const VIEW_BOX = { front: '0 0 35 93', back: '37 0 35 93' } as const

/**
 * Silhouette SVG (face ou dos), chaque muscle coloré par `fill` et cliquable.
 * Les parties du corps qui ne sont pas des muscles suivis restent neutres.
 */
export default function BodyMap({
  view,
  fill,
  describe,
  selected,
  onSelect,
}: {
  view: 'front' | 'back'
  fill: (muscle: MuscleId) => string
  /** Texte lu par les lecteurs d'écran pour chaque muscle (ex. niveau). */
  describe: (muscle: MuscleId) => string
  selected: MuscleId | null
  onSelect: (muscle: MuscleId) => void
}) {
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS
  return (
    <svg
      viewBox={VIEW_BOX[view]}
      className="h-auto w-full"
      role="group"
      aria-label={view === 'front' ? 'Face' : 'Dos'}
    >
      {regions.map((region) => {
        const muscle = muscleOfRegion(region.id)
        if (!muscle) {
          return (
            <path
              key={region.id}
              d={region.path}
              className="fill-surface-2 stroke-surface"
              strokeWidth={0.2}
            />
          )
        }
        const isSelected = muscle === selected
        return (
          <path
            key={region.id}
            d={region.path}
            role="button"
            tabIndex={0}
            aria-label={`${MUSCLES[muscle]} : ${describe(muscle)}`}
            onClick={() => onSelect(muscle)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(muscle)}
            style={{ fill: fill(muscle) }}
            className={`cursor-pointer outline-none ${isSelected ? 'stroke-text' : 'stroke-surface'}`}
            strokeWidth={isSelected ? 0.45 : 0.2}
            strokeLinejoin="round"
          />
        )
      })}
    </svg>
  )
}
