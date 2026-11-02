import { db, newId } from './db'
import { PROFILE_ID, type Gym } from './types'

export const GYM_COLORS = [
  '#e11d48',
  '#f97316',
  '#eab308',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#db2777',
]

/** Ajoute une salle avec une barre olympique et le stock de disques de la salle par défaut. */
export async function addGym(): Promise<string> {
  const gyms = await db.gyms.orderBy('order').toArray()
  const model = gyms[0]
  const id = newId()
  await db.gyms.add({
    id,
    name: 'Nouvelle salle',
    order: (gyms[gyms.length - 1]?.order ?? -1) + 1,
    color: GYM_COLORS[gyms.length % GYM_COLORS.length]!,
    plates: model ? model.plates.map((p) => ({ ...p })) : [],
    bars: [{ id: newId(), name: 'Barre olympique', kg: 20 }],
    dumbbellIncrementKg: null,
  })
  return id
}

export function updateGym(id: string, changes: Partial<Omit<Gym, 'id'>>) {
  return db.gyms.update(id, changes)
}

/** Raison pour laquelle la salle ne peut pas être supprimée, ou null si c'est possible. */
export async function gymDeletionBlocker(id: string): Promise<string | null> {
  if ((await db.gyms.count()) <= 1) return 'Il faut garder au moins une salle.'
  if ((await db.profile.get(PROFILE_ID))?.defaultGymId === id) {
    return 'C’est ta salle par défaut : choisis-en une autre avant de la supprimer.'
  }
  const workouts = await db.workouts.where('gymId').equals(id).count()
  if (workouts > 0) {
    return `${workouts} séance${workouts > 1 ? 's sont rattachées' : ' est rattachée'} à cette salle : supprimer la salle effacerait leur contexte.`
  }
  return null
}

export async function deleteGym(id: string): Promise<void> {
  await db.transaction('rw', db.gyms, db.machineSetups, async () => {
    await db.machineSetups.filter((s) => s.gymId === id).delete()
    await db.gyms.delete(id)
  })
}
