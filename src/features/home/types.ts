import type { GymLook } from '../../data/defaultGyms'
import type { RecordKind } from '../../domain/types'

/** Ce qu'affiche une carte du fil d'accueil pour une séance terminée. */
export interface WorkoutSummary {
  id: string
  title: string
  startedAt: Date
  durationMin: number
  gym: GymLook
  volumeKg: number
  exercises: {
    name: string
    sets: number
    best: { kg: number; reps: number }
    records: RecordKind[]
  }[]
}
