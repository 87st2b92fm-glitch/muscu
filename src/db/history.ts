import { db, newId } from './db'
import type { SetRow, Template } from './types'

/**
 * Change le début et la durée d'une séance passée. Les séries sont décalées d'autant : l'ordre
 * chronologique (et donc les records) suit la nouvelle date.
 */
export async function updateWorkoutTimes(
  workoutId: string,
  startedAt: number,
  durationMin: number,
) {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    const workout = await db.workouts.get(workoutId)
    if (!workout) return
    const delta = startedAt - workout.startedAt
    await db.workouts.update(workoutId, {
      startedAt,
      endedAt: startedAt + Math.max(1, Math.round(durationMin)) * 60_000,
    })
    if (delta !== 0) {
      await db.sets
        .where('workoutId')
        .equals(workoutId)
        .modify((s: SetRow) => {
          s.at += delta
        })
    }
  })
}

/** Ajoute une série validée à la fin d'un exercice d'une séance passée (copie de la dernière). */
export async function addPastSet(workoutId: string, blockId: string) {
  const workout = await db.workouts.get(workoutId)
  const block = workout?.blocks.find((b) => b.id === blockId)
  if (!workout || !block) return
  const sets = await db.sets.where('workoutId').equals(workoutId).toArray()
  const own = sets.filter((s) => s.blockId === blockId).sort((a, b) => a.order - b.order)
  const last = own[own.length - 1]
  const at = last ? last.at + 1 : (workout.endedAt ?? workout.startedAt)
  await db.sets.add({
    id: newId(),
    workoutId,
    blockId,
    exerciseId: block.exerciseId,
    gymId: workout.gymId,
    order: (last?.order ?? -1) + 1,
    type: 'normal',
    reps: last?.reps ?? 0,
    kg: last?.kg ?? 0,
    rir: null,
    at,
    done: true,
  })
}

/** Ajoute un exercice oublié à une séance passée, avec une série à compléter. */
export async function addPastExercise(workoutId: string, exerciseId: string) {
  const workout = await db.workouts.get(workoutId)
  if (!workout) return
  const block = { id: newId(), exerciseId, supersetId: null, notes: '', restSec: null }
  await db.workouts.update(workoutId, { blocks: [...workout.blocks, block] })
  await addPastSet(workoutId, block.id)
}

/** Crée un modèle (hors dossier) reprenant les exercices et le nombre de séries d'une séance. */
export async function saveAsTemplate(workoutId: string): Promise<string | null> {
  const workout = await db.workouts.get(workoutId)
  if (!workout) return null
  const sets = await db.sets.where('workoutId').equals(workoutId).toArray()
  const loose = await db.templates.filter((t) => t.folderId === null).toArray()
  const supersets = new Map<string, string>()
  const template: Template = {
    id: newId(),
    folderId: null,
    name: workout.title,
    order: loose.reduce((max, t) => Math.max(max, t.order + 1), 0),
    notes: '',
    blocks: workout.blocks.flatMap((block) => {
      const count = sets.filter((s) => s.blockId === block.id).length
      if (count === 0) return []
      let supersetId: string | null = null
      if (block.supersetId) {
        supersetId = supersets.get(block.supersetId) ?? newId()
        supersets.set(block.supersetId, supersetId)
      }
      return [
        {
          exerciseId: block.exerciseId,
          supersetId,
          sets: count,
          repRange: null,
          restSec: block.restSec,
        },
      ]
    }),
  }
  await db.templates.add(template)
  return template.id
}
