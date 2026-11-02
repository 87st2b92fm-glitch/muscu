import { useLiveQuery } from 'dexie-react-hooks'
import type { GymLook } from '../data/defaultGyms'
import { db } from './db'
import { PROFILE_ID, type Profile } from './types'

/** Profil, mis à jour en direct ; undefined pendant le chargement. */
export function useProfile(): Profile | undefined {
  return useLiveQuery(() => db.profile.get(PROFILE_ID))
}

export function updateProfile(changes: Partial<Omit<Profile, 'id'>>) {
  return db.profile.update(PROFILE_ID, changes)
}

/** Salles dans l'ordre choisi, prêtes à afficher (pastille ou logo). */
export function useGyms(): GymLook[] | undefined {
  return useLiveQuery(async () =>
    (await db.gyms.orderBy('order').toArray()).map(({ id, name, color, logo }) => ({
      id,
      name,
      color,
      logo,
    })),
  )
}

export function useExercises() {
  return useLiveQuery(() =>
    db.exercises
      .orderBy('name')
      .filter((e) => !e.archived)
      .toArray(),
  )
}

/** Pesées de la plus récente à la plus ancienne. */
export function useBodyweights() {
  return useLiveQuery(() => db.bodyweights.orderBy('at').reverse().toArray())
}
