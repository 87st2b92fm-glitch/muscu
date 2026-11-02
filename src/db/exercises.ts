import { categoryOf } from '../data/exercises'
import { linkMachine } from '../domain/machineLinks'
import { db, newId } from './db'
import type { Equipment, Exercise, MachineSetup } from './types'

export async function createExercise(name: string, equipment: Equipment): Promise<string> {
  const id = newId()
  await db.exercises.add({
    id,
    name,
    category: categoryOf(equipment),
    equipment,
    primaryMuscles: [],
    secondaryMuscles: [],
    loadMode: 'external',
    repRange: null,
    restSec: null,
    standardKey: null,
    aliases: [],
    custom: true,
    archived: false,
  })
  return id
}

export function updateExercise(id: string, changes: Partial<Omit<Exercise, 'id'>>) {
  return db.exercises.update(id, changes)
}

/** Change l'équipement ; la catégorie (records communs ou par salle) en découle. */
export function setEquipment(exercise: Exercise, equipment: Equipment) {
  return updateExercise(exercise.id, {
    equipment,
    category: categoryOf(equipment),
    // « Lest + poids du corps » n'a de sens qu'au poids du corps.
    loadMode: equipment === 'bodyweight' ? exercise.loadMode : 'external',
  })
}

/**
 * Supprime un exercice perso jamais utilisé ; sinon le masque (son historique est conservé).
 * Renvoie ce qui a été fait.
 */
export async function removeExercise(exercise: Exercise): Promise<'deleted' | 'archived'> {
  const used = (await db.sets.where('exerciseId').equals(exercise.id).count()) > 0
  if (exercise.custom && !used) {
    await db.transaction('rw', db.exercises, db.machineSetups, db.importMappings, async () => {
      await db.machineSetups.filter((s) => s.exerciseId === exercise.id).delete()
      await db.importMappings.filter((m) => m.exerciseId === exercise.id).delete()
      await db.exercises.delete(exercise.id)
    })
    return 'deleted'
  }
  await updateExercise(exercise.id, { archived: true })
  return 'archived'
}

function blankSetup(exerciseId: string, gymId: string): MachineSetup {
  return { id: newId(), exerciseId, gymId, brandModel: null, incrementKg: null, linkGroupId: null }
}

export async function updateMachineSetup(
  exerciseId: string,
  gymId: string,
  changes: Partial<Pick<MachineSetup, 'brandModel' | 'incrementKg'>>,
) {
  const existing = await db.machineSetups
    .where('[exerciseId+gymId]')
    .equals([exerciseId, gymId])
    .first()
  await db.machineSetups.put({ ...(existing ?? blankSetup(exerciseId, gymId)), ...changes })
}

/** Lie la machine de cette salle à celle d'une autre salle (null pour délier). */
export async function setMachineLink(
  exerciseId: string,
  gymId: string,
  targetGymId: string | null,
) {
  await db.transaction('rw', db.machineSetups, async () => {
    const setups = await db.machineSetups.filter((s) => s.exerciseId === exerciseId).toArray()
    const changed = linkMachine(setups, gymId, targetGymId, (g) => blankSetup(exerciseId, g), newId)
    await db.machineSetups.bulkPut(changed)
  })
}
