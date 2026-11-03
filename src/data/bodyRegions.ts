import type { MuscleId } from './muscles'

// Régions de body-muscles (gauche et droite) → muscles de l'app. Les autres régions (tête, mains,
// genoux, colonne, dentelés, tibial…) sont dessinées en neutre et ne sont pas cliquables.
const PREFIXES: [string, MuscleId][] = [
  ['chest-', 'chest'],
  ['shoulder-front-', 'front_delts'],
  ['shoulder-side-', 'side_delts'],
  ['deltoid-rear-', 'rear_delts'],
  ['biceps-', 'biceps'],
  ['triceps-', 'triceps'],
  ['forearm-', 'forearms'],
  ['abs-', 'abs'],
  ['obliques-', 'obliques'],
  ['traps-', 'traps'],
  ['lats-', 'lats'],
  ['lower-back-', 'lower_back'],
  ['gluteus-', 'glutes'],
  ['quads-', 'quads'],
  ['hamstrings-', 'hamstrings'],
  ['calves-', 'calves'],
  ['adductors-', 'adductors'],
]

export function muscleOfRegion(regionId: string): MuscleId | null {
  return PREFIXES.find(([prefix]) => regionId.startsWith(prefix))?.[1] ?? null
}
