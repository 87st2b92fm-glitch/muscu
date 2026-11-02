import type { Transaction } from 'dexie'
import { DEFAULT_EXERCISES } from '../data/exercises'
import { DEFAULT_GYM_ID, DEFAULT_GYMS } from '../data/defaultGyms'
import { PROFILE_ID, type Gym, type Profile } from './types'

// Stock générique, à ajuster salle par salle dans les réglages.
const DEFAULT_PLATES = [
  { kg: 25, pairs: 4 },
  { kg: 20, pairs: 2 },
  { kg: 15, pairs: 2 },
  { kg: 10, pairs: 4 },
  { kg: 5, pairs: 4 },
  { kg: 2.5, pairs: 4 },
  { kg: 1.25, pairs: 2 },
]

export const DEFAULT_PROFILE: Profile = {
  id: PROFILE_ID,
  sex: null,
  birthDate: null,
  defaultGymId: DEFAULT_GYM_ID,
  rirEnabled: true,
  restSoundEnabled: true,
  defaultRestSec: 120,
  lastBackupAt: null,
}

export function defaultGyms(): Gym[] {
  return DEFAULT_GYMS.map((gym, order) => ({
    id: gym.id,
    name: gym.name,
    order,
    color: gym.color,
    plates: DEFAULT_PLATES.map((p) => ({ ...p })),
    bars: [{ id: 'olympic', name: 'Barre olympique', kg: 20 }],
    dumbbellIncrementKg: null,
  }))
}

/** Données du premier lancement (événement `populate` de Dexie). */
export async function seedDatabase(tx: Transaction): Promise<void> {
  await tx.table('profile').add(DEFAULT_PROFILE)
  await tx.table('gyms').bulkAdd(defaultGyms())
  await tx.table('exercises').bulkAdd(DEFAULT_EXERCISES)
}
