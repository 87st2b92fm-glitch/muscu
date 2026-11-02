import Dexie, { type EntityTable } from 'dexie'
import { seedDatabase } from './seed'
import type {
  BodyweightRow,
  Exercise,
  Folder,
  Gym,
  ImportMapping,
  MachineSetup,
  MeasurementRow,
  Profile,
  SetRow,
  Template,
  Workout,
} from './types'

export class AppDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  bodyweights!: EntityTable<BodyweightRow, 'id'>
  measurements!: EntityTable<MeasurementRow, 'id'>
  gyms!: EntityTable<Gym, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  machineSetups!: EntityTable<MachineSetup, 'id'>
  folders!: EntityTable<Folder, 'id'>
  templates!: EntityTable<Template, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  sets!: EntityTable<SetRow, 'id'>
  importMappings!: EntityTable<ImportMapping, 'sourceName'>

  constructor(name = 'muscu') {
    super(name)

    // Ne jamais modifier une version publiée : ajouter db.version(n + 1) avec un .upgrade()
    // pour transformer les données existantes. Seuls les champs indexés figurent ici.
    this.version(1).stores({
      profile: 'id',
      bodyweights: 'id, at',
      measurements: 'id, at',
      gyms: 'id, order',
      exercises: 'id, name',
      machineSetups: 'id, [exerciseId+gymId], linkGroupId',
      folders: 'id, order',
      templates: 'id, folderId, order',
      workouts: 'id, startedAt, gymId, status',
      sets: 'id, workoutId, exerciseId, [exerciseId+gymId], at',
      importMappings: 'sourceName',
    })

    // Premier lancement uniquement : salles, bibliothèque d'exercices et profil par défaut.
    this.on('populate', (tx) => seedDatabase(tx))
  }
}

export const db = new AppDB()

/** Identifiant pour les lignes créées par l'utilisateur. */
export function newId(): string {
  return crypto.randomUUID()
}

/**
 * Demande à Safari de ne pas purger les données de l'app (iOS peut le faire pour une PWA
 * peu utilisée). Renvoie true si le stockage est protégé.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
