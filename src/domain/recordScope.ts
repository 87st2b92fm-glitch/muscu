import type { ExerciseCategory } from './types'

/** Lie la même machine (même marque, même modèle) dans plusieurs salles pour fusionner leurs records. */
export interface MachineLink {
  exerciseId: string
  gymId: string
  linkGroupId: string
}

/**
 * Clé qui regroupe les séries comparables entre elles pour les records, l'historique et la progression :
 * - poids libre : l'exercice, toutes salles confondues ;
 * - machine : l'exercice dans cette salle, ou le groupe de machines liées.
 */
export function recordScope(
  exercise: { id: string; category: ExerciseCategory },
  gymId: string,
  links: readonly MachineLink[] = [],
): string {
  if (exercise.category === 'free') return `ex:${exercise.id}`
  const link = links.find((l) => l.exerciseId === exercise.id && l.gymId === gymId)
  return link ? `link:${link.linkGroupId}` : `ex:${exercise.id}@${gymId}`
}
