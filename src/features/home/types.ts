import type { GymLook } from '../../data/defaultGyms'
import type { RecordKind } from '../../domain/types'

/** Ce qu'affiche une carte du fil d'accueil pour une séance terminée. */
export interface WorkoutSummary {
  id: string
  title: string
  startedAt: number
  durationMin: number
  gym: GymLook
  volumeKg: number
  exercises: {
    key: string
    name: string
    /** Séries hors échauffement. */
    sets: number
    /** Meilleure série telle que saisie (le lest pour un exercice au poids du corps). */
    best: { kg: number; reps: number }
    bodyweight: boolean
    records: RecordKind[]
  }[]
}
