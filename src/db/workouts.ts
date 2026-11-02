import { plannedSets } from '../domain/session'
import type { RepRange, SetEntry } from '../domain/types'
import { db, newId } from './db'
import { buildContext, loadContextData } from './exerciseContext'
import { PROFILE_ID, type SetRow, type Workout, type WorkoutBlock } from './types'

const DEFAULT_SET_COUNT = 3

export function getActiveWorkout() {
  return db.workouts.where('status').equals('active').first()
}

function setRow(workout: Workout, block: WorkoutBlock, order: number, entry: SetEntry): SetRow {
  return {
    id: newId(),
    workoutId: workout.id,
    blockId: block.id,
    exerciseId: block.exerciseId,
    gymId: workout.gymId,
    order,
    type: entry.type,
    reps: entry.reps,
    kg: entry.kg,
    rir: null,
    at: Date.now() + order,
    done: false,
  }
}

/** Séries préremplies d'après la dernière perf et la suggestion, dans la salle de la séance. */
async function planBlocks(
  workout: Workout,
  blocks: { block: WorkoutBlock; count: number | null; repRange: RepRange | null }[],
): Promise<SetRow[]> {
  const data = await loadContextData(
    blocks.map((b) => b.block.exerciseId),
    workout.gymId,
  )
  return blocks.flatMap(({ block, count, repRange }) => {
    const context = data ? buildContext(data, block.exerciseId, repRange) : null
    const previous = context?.previous ?? []
    const n = count ?? (previous.length || DEFAULT_SET_COUNT)
    return plannedSets(n, previous, context?.suggestion ?? null).map((entry, i) =>
      setRow(workout, block, i, entry),
    )
  })
}

/**
 * Démarre une séance (vide ou depuis un modèle) dans la salle choisie. S'il y a déjà une séance
 * en cours, la renvoie au lieu d'en créer une seconde.
 */
export async function startWorkout(options: {
  templateId: string | null
  gymId: string
}): Promise<string> {
  const active = await getActiveWorkout()
  if (active) return active.id

  const template = options.templateId ? await db.templates.get(options.templateId) : undefined
  const workout: Workout = {
    id: newId(),
    title: template?.name ?? 'Séance libre',
    gymId: options.gymId,
    templateId: template?.id ?? null,
    startedAt: Date.now(),
    endedAt: null,
    notes: '',
    status: 'active',
    blocks: [],
    restEndsAt: null,
    source: 'app',
  }
  const planned = (template?.blocks ?? []).map((b) => ({
    block: {
      id: newId(),
      exerciseId: b.exerciseId,
      supersetId: b.supersetId,
      notes: '',
      restSec: b.restSec,
      repRange: b.repRange,
    },
    count: b.sets,
    repRange: b.repRange,
  }))
  workout.blocks = planned.map((p) => p.block)
  const sets = await planBlocks(workout, planned)
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.workouts.add(workout)
    await db.sets.bulkAdd(sets)
  })
  return workout.id
}

export async function addExercises(workoutId: string, exerciseIds: readonly string[]) {
  const workout = await db.workouts.get(workoutId)
  if (!workout) return
  const planned = exerciseIds.map((exerciseId) => ({
    block: { id: newId(), exerciseId, supersetId: null, notes: '', restSec: null },
    count: null,
    repRange: null,
  }))
  const sets = await planBlocks(workout, planned)
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.workouts.update(workoutId, {
      blocks: [...workout.blocks, ...planned.map((p) => p.block)],
    })
    await db.sets.bulkAdd(sets)
  })
}

/** Ajoute une série qui reprend la charge et les reps de la dernière série du bloc. */
export async function addSet(workout: Workout, blockId: string) {
  const block = workout.blocks.find((b) => b.id === blockId)
  if (!block) return
  const sets = await db.sets
    .where('workoutId')
    .equals(workout.id)
    .filter((s) => s.blockId === blockId)
    .sortBy('order')
  const last = sets[sets.length - 1]
  await db.sets.add(
    setRow(workout, block, (last?.order ?? -1) + 1, {
      type: 'normal',
      kg: last?.kg ?? 0,
      reps: last?.reps ?? 0,
    }),
  )
}

export function updateSet(
  id: string,
  changes: Partial<Pick<SetRow, 'kg' | 'reps' | 'rir' | 'type'>>,
) {
  return db.sets.update(id, changes)
}

export function deleteSet(id: string) {
  return db.sets.delete(id)
}

/**
 * Valide (ou dévalide) une série. Valider la date et lance le repos : l'heure de fin est stockée,
 * le chrono se calcule à partir de l'horloge et reste juste en arrière-plan.
 */
export async function toggleSetDone(workout: Workout, set: SetRow): Promise<void> {
  if (set.done) {
    await db.sets.update(set.id, { done: false })
    return
  }
  const block = workout.blocks.find((b) => b.id === set.blockId)
  const [exercise, profile] = await Promise.all([
    db.exercises.get(set.exerciseId),
    db.profile.get(PROFILE_ID),
  ])
  const restSec = block?.restSec ?? exercise?.restSec ?? profile?.defaultRestSec ?? 120
  const now = Date.now()
  await db.transaction('rw', db.sets, db.workouts, async () => {
    await db.sets.update(set.id, { done: true, at: now })
    await db.workouts.update(workout.id, {
      restEndsAt: now + restSec * 1000,
      restDurationSec: restSec,
    })
  })
}

export function setRestEndsAt(workoutId: string, restEndsAt: number | null) {
  return db.workouts.update(workoutId, { restEndsAt })
}

/** Rallonge ou raccourcit le repos en cours (jamais avant maintenant). */
export async function adjustRest(workout: Workout, deltaSec: number) {
  if (workout.restEndsAt === null) return
  const restEndsAt = Math.max(Date.now(), workout.restEndsAt + deltaSec * 1000)
  await db.workouts.update(workout.id, {
    restEndsAt,
    restDurationSec: Math.max(1, (workout.restDurationSec ?? 0) + deltaSec),
  })
}

export function updateWorkout(id: string, changes: Partial<Pick<Workout, 'title' | 'notes'>>) {
  return db.workouts.update(id, changes)
}

function updateBlocks(workout: Workout, blocks: WorkoutBlock[]) {
  return db.workouts.update(workout.id, { blocks })
}

export function updateBlock(
  workout: Workout,
  blockId: string,
  changes: Partial<Pick<WorkoutBlock, 'notes' | 'restSec'>>,
) {
  return updateBlocks(
    workout,
    workout.blocks.map((b) => (b.id === blockId ? { ...b, ...changes } : b)),
  )
}

export function moveBlock(workout: Workout, blockId: string, direction: -1 | 1) {
  const blocks = [...workout.blocks]
  const i = blocks.findIndex((b) => b.id === blockId)
  const j = i + direction
  if (i < 0 || j < 0 || j >= blocks.length) return
  ;[blocks[i], blocks[j]] = [blocks[j]!, blocks[i]!]
  return updateBlocks(workout, blocks)
}

/** Groupe le bloc avec le suivant dans un superset, ou le retire de son superset. */
export function toggleSupersetWithNext(workout: Workout, blockId: string) {
  const i = workout.blocks.findIndex((b) => b.id === blockId)
  const block = workout.blocks[i]
  const next = workout.blocks[i + 1]
  if (!block) return
  if (block.supersetId) {
    const remaining = workout.blocks.filter(
      (b) => b.supersetId === block.supersetId && b.id !== blockId,
    )
    return updateBlocks(
      workout,
      workout.blocks.map((b) => {
        if (b.id === blockId) return { ...b, supersetId: null }
        // Un superset d'un seul exercice n'en est plus un.
        if (remaining.length === 1 && b.id === remaining[0]!.id) return { ...b, supersetId: null }
        return b
      }),
    )
  }
  if (!next) return
  const supersetId = next.supersetId ?? newId()
  return updateBlocks(
    workout,
    workout.blocks.map((b) => (b.id === blockId || b.id === next.id ? { ...b, supersetId } : b)),
  )
}

export async function removeBlock(workout: Workout, blockId: string) {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.sets
      .where('workoutId')
      .equals(workout.id)
      .filter((s) => s.blockId === blockId)
      .delete()
    await updateBlocks(
      workout,
      workout.blocks.filter((b) => b.id !== blockId),
    )
  })
}

/** Change la salle de la séance (et de ses séries : les records machines en dépendent). */
export async function changeWorkoutGym(workoutId: string, gymId: string) {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.workouts.update(workoutId, { gymId })
    await db.sets.where('workoutId').equals(workoutId).modify({ gymId })
  })
}

/**
 * Termine la séance : les séries non validées sont supprimées, ainsi que les exercices restés vides.
 * Sans aucune série validée, la séance est abandonnée (renvoie false). Dans un dossier programme,
 * le modèle suivant devient la prochaine séance.
 */
export async function finishWorkout(workoutId: string): Promise<boolean> {
  return db.transaction('rw', [db.workouts, db.sets, db.templates, db.folders], async () => {
    const workout = await db.workouts.get(workoutId)
    if (!workout) return false
    const sets = await db.sets.where('workoutId').equals(workoutId).toArray()
    const done = sets.filter((s) => s.done && s.reps > 0)
    await db.sets.bulkDelete(sets.filter((s) => !done.includes(s)).map((s) => s.id))
    if (done.length === 0) {
      await db.workouts.delete(workoutId)
      return false
    }
    const usedBlocks = new Set(done.map((s) => s.blockId))
    await db.workouts.update(workoutId, {
      status: 'done',
      endedAt: Date.now(),
      restEndsAt: null,
      blocks: workout.blocks.filter((b) => usedBlocks.has(b.id)),
    })
    await advanceProgram(workout.templateId)
    return true
  })
}

async function advanceProgram(templateId: string | null) {
  const template = templateId ? await db.templates.get(templateId) : undefined
  if (!template?.folderId) return
  const folder = await db.folders.get(template.folderId)
  if (!folder?.isProgram) return
  const siblings = await db.templates.where('folderId').equals(folder.id).sortBy('order')
  const i = siblings.findIndex((t) => t.id === template.id)
  const next = siblings[(i + 1) % siblings.length]
  await db.folders.update(folder.id, { nextTemplateId: next?.id ?? null })
}

export async function discardWorkout(workoutId: string) {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.sets.where('workoutId').equals(workoutId).delete()
    await db.workouts.delete(workoutId)
  })
}
