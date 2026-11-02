/** Record battu par une série : charge la plus lourde, ou meilleur charge × reps sur une série. */
export type RecordKind = 'weight' | 'volume'

export type SetType = 'warmup' | 'normal' | 'drop' | 'failure'

/** Poids libres : records communs à toutes les salles. Machines : records propres à chaque salle. */
export type ExerciseCategory = 'free' | 'machine'

/**
 * `external` : la charge saisie est la charge soulevée.
 * `bodyweight` : la charge saisie est un lest, ajouté au poids du corps (tractions, dips…).
 */
export type LoadMode = 'external' | 'bodyweight'

export interface RepRange {
  min: number
  max: number
}

/** Une série telle que saisie : `kg` est le lest pour un exercice au poids du corps. */
export interface SetEntry {
  type: SetType
  reps: number
  kg: number
}

/** Série prête pour les records : `kg` est la charge effective (poids du corps inclus). */
export interface ScoredSet extends SetEntry {
  id: string
  /** Horodatage de validation de la série (ms). */
  at: number
}
