/** Réglage d'une machine dans une salle, réduit à ce qui compte pour les liens. */
export interface LinkableSetup {
  gymId: string
  linkGroupId: string | null
}

/**
 * Lie la machine de `gymId` à celle de `targetGymId` (même marque, même modèle) pour fusionner
 * leurs records, ou la délie si `targetGymId` est null. Rejoint le groupe de la cible si elle en a
 * un, sinon crée un groupe pour les deux. Renvoie les réglages à enregistrer (créés si absents).
 */
export function linkMachine<T extends LinkableSetup>(
  setups: readonly T[],
  gymId: string,
  targetGymId: string | null,
  create: (gymId: string) => T,
  newGroupId: () => string,
): T[] {
  const find = (id: string) => setups.find((s) => s.gymId === id) ?? create(id)
  const own = find(gymId)
  if (targetGymId === null || targetGymId === gymId) return [{ ...own, linkGroupId: null }]

  const target = find(targetGymId)
  const groupId = target.linkGroupId ?? newGroupId()
  return [
    { ...own, linkGroupId: groupId },
    { ...target, linkGroupId: groupId },
  ]
}

/** Salle avec laquelle la machine est liée (une autre salle du même groupe), ou null. */
export function linkedGymId(setups: readonly LinkableSetup[], gymId: string): string | null {
  const group = setups.find((s) => s.gymId === gymId)?.linkGroupId
  if (!group) return null
  return setups.find((s) => s.gymId !== gymId && s.linkGroupId === group)?.gymId ?? null
}
