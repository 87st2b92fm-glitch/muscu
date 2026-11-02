import type { MuscleId } from '../data/muscles'
import type { PlateStock } from '../domain/plates'
import type { ExerciseCategory, LoadMode, RepRange, SetType } from '../domain/types'

export type Sex = 'male' | 'female'

export const PROFILE_ID = 'me'

/** Profil et réglages (une seule ligne, id `me`). Thème et accent sont en localStorage. */
export interface Profile {
  id: typeof PROFILE_ID
  sex: Sex | null
  /** AAAA-MM-JJ */
  birthDate: string | null
  defaultGymId: string
  rirEnabled: boolean
  restSoundEnabled: boolean
  defaultRestSec: number
  lastBackupAt: number | null
}

export interface BodyweightRow {
  id: string
  at: number
  kg: number
}

export const MEASUREMENT_KEYS = {
  fatPercent: 'Masse grasse (%)',
  neckCm: 'Cou',
  shoulderCm: 'Épaules',
  chestCm: 'Poitrine',
  leftBicepCm: 'Biceps gauche',
  rightBicepCm: 'Biceps droit',
  leftForearmCm: 'Avant-bras gauche',
  rightForearmCm: 'Avant-bras droit',
  abdomenCm: 'Abdomen',
  waistCm: 'Taille',
  hipsCm: 'Hanches',
  leftThighCm: 'Cuisse gauche',
  rightThighCm: 'Cuisse droite',
  leftCalfCm: 'Mollet gauche',
  rightCalfCm: 'Mollet droit',
} as const

export type MeasurementKey = keyof typeof MEASUREMENT_KEYS

/** Mensurations prises à une date (tous les champs sont facultatifs). */
export interface MeasurementRow {
  id: string
  at: number
  values: Partial<Record<MeasurementKey, number>>
}

export interface Bar {
  id: string
  name: string
  kg: number
}

export interface Gym {
  id: string
  name: string
  order: number
  /** Couleur de la pastille quand il n'y a pas de logo. */
  color: string
  /** Logo en data URL (image réduite à l'import depuis la pellicule). */
  logo?: string
  plates: PlateStock[]
  bars: Bar[]
  dumbbellIncrementKg: number | null
}

export type Equipment =
  'barbell' | 'dumbbell' | 'kettlebell' | 'bodyweight' | 'machine' | 'cable' | 'smith'

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  kettlebell: 'Kettlebell',
  bodyweight: 'Poids du corps',
  machine: 'Machine',
  cable: 'Poulie',
  smith: 'Smith',
}

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  equipment: Equipment
  primaryMuscles: MuscleId[]
  secondaryMuscles: MuscleId[]
  loadMode: LoadMode
  repRange: RepRange | null
  restSec: number | null
  /** Clé dans strengthStandards.json, pour les poids libres qui ont des standards. */
  standardKey: string | null
  /** Autres noms (ex. noms Hevy) pour retrouver l'exercice à l'import. */
  aliases: string[]
  custom: boolean
  archived: boolean
}

/** Réglages d'une machine dans une salle. */
export interface MachineSetup {
  id: string
  exerciseId: string
  gymId: string
  brandModel: string | null
  incrementKg: number | null
  /** Même identifiant dans deux salles = même machine, records fusionnés. */
  linkGroupId: string | null
}

/** Dossier de modèles ; en mode programme, l'app propose le prochain modèle de la rotation. */
export interface Folder {
  id: string
  name: string
  order: number
  isProgram: boolean
  nextTemplateId: string | null
}

export interface TemplateBlock {
  exerciseId: string
  supersetId: string | null
  sets: number
  repRange: RepRange | null
  restSec: number | null
}

export interface Template {
  id: string
  folderId: string | null
  name: string
  order: number
  notes: string
  blocks: TemplateBlock[]
}

export interface WorkoutBlock {
  id: string
  exerciseId: string
  supersetId: string | null
  notes: string
  restSec: number | null
  /** Fourchette du modèle d'origine, prioritaire sur celle de l'exercice. */
  repRange?: RepRange | null
}

export interface Workout {
  id: string
  title: string
  gymId: string
  templateId: string | null
  startedAt: number
  endedAt: number | null
  notes: string
  status: 'active' | 'done'
  blocks: WorkoutBlock[]
  /** Fin du repos en cours (ms) : le chrono se calcule à partir de l'heure, pas d'un compteur. */
  restEndsAt: number | null
  /** Durée du repos en cours (s), pour la barre de progression. */
  restDurationSec?: number
  source: 'app' | 'hevy'
}

export interface SetRow {
  id: string
  workoutId: string
  blockId: string
  exerciseId: string
  /** Copie de la salle de la séance, pour interroger les séries par exercice et salle. */
  gymId: string
  order: number
  type: SetType
  reps: number
  /** Charge saisie (le lest seul pour un exercice au poids du corps). */
  kg: number
  rir: number | null
  /** Horodatage de validation, ou de création tant que la série n'est pas validée. */
  at: number
  done: boolean
}

/** Correspondance retenue lors d'un import Hevy : nom Hevy → exercice. */
export interface ImportMapping {
  sourceName: string
  exerciseId: string
}
