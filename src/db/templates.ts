import { db, newId } from './db'
import type { Folder, Template, TemplateBlock } from './types'

const DEFAULT_SETS = 3

// Dossiers

export async function createFolder(name: string): Promise<string> {
  const folders = await db.folders.toArray()
  const id = newId()
  await db.folders.add({
    id,
    name,
    order: folders.reduce((max, f) => Math.max(max, f.order + 1), 0),
    isProgram: false,
    nextTemplateId: null,
  })
  return id
}

/** En passant en programme, la prochaine séance est le premier modèle du dossier. */
export async function updateFolder(id: string, changes: Partial<Omit<Folder, 'id'>>) {
  if (changes.isProgram) {
    const folder = await db.folders.get(id)
    if (folder && !folder.nextTemplateId) {
      const first = (await db.templates.where('folderId').equals(id).sortBy('order'))[0]
      changes = { ...changes, nextTemplateId: first?.id ?? null }
    }
  }
  await db.folders.update(id, changes)
}

/** Supprime le dossier ; ses modèles sont conservés, hors dossier. */
export async function deleteFolder(id: string) {
  await db.transaction('rw', db.folders, db.templates, async () => {
    await db.templates.where('folderId').equals(id).modify({ folderId: null })
    await db.folders.delete(id)
  })
}

async function swapOrder<T extends { id: string; order: number }>(
  items: T[],
  id: string,
  direction: -1 | 1,
  save: (id: string, order: number) => Promise<unknown>,
) {
  const sorted = [...items].sort((a, b) => a.order - b.order)
  const i = sorted.findIndex((x) => x.id === id)
  const j = i + direction
  if (i < 0 || j < 0 || j >= sorted.length) return
  // Ordres renumérotés pour rester propres même après des suppressions.
  ;[sorted[i], sorted[j]] = [sorted[j]!, sorted[i]!]
  await Promise.all(sorted.map((x, k) => (x.order === k ? null : save(x.id, k))))
}

export async function moveFolder(id: string, direction: -1 | 1) {
  await db.transaction('rw', db.folders, async () => {
    await swapOrder(await db.folders.toArray(), id, direction, (fid, order) =>
      db.folders.update(fid, { order }),
    )
  })
}

// Modèles

async function nextOrder(folderId: string | null): Promise<number> {
  const siblings = await db.templates.filter((t) => t.folderId === folderId).toArray()
  return siblings.reduce((max, t) => Math.max(max, t.order + 1), 0)
}

export async function createTemplate(
  folderId: string | null,
  name = 'Nouveau modèle',
): Promise<string> {
  const id = newId()
  await db.templates.add({
    id,
    folderId,
    name,
    order: await nextOrder(folderId),
    notes: '',
    blocks: [],
  })
  return id
}

export function updateTemplate(id: string, changes: Partial<Pick<Template, 'name' | 'notes'>>) {
  return db.templates.update(id, changes)
}

export async function duplicateTemplate(id: string): Promise<string | null> {
  const template = await db.templates.get(id)
  if (!template) return null
  const copyId = newId()
  await db.templates.add({
    ...template,
    id: copyId,
    name: `${template.name} (copie)`,
    order: await nextOrder(template.folderId),
    blocks: template.blocks.map((b) => ({ ...b })),
  })
  return copyId
}

/** Supprime le modèle ; s'il était la prochaine séance d'un programme, on passe au premier. */
export async function deleteTemplate(id: string) {
  await db.transaction('rw', db.templates, db.folders, async () => {
    await db.templates.delete(id)
    const folders = await db.folders.filter((f) => f.nextTemplateId === id).toArray()
    for (const folder of folders) {
      const first = (await db.templates.where('folderId').equals(folder.id).sortBy('order'))[0]
      await db.folders.update(folder.id, { nextTemplateId: first?.id ?? null })
    }
  })
}

export async function moveTemplate(id: string, direction: -1 | 1) {
  await db.transaction('rw', db.templates, async () => {
    const template = await db.templates.get(id)
    if (!template) return
    const siblings = await db.templates.filter((t) => t.folderId === template.folderId).toArray()
    await swapOrder(siblings, id, direction, (tid, order) => db.templates.update(tid, { order }))
  })
}

/** Range le modèle dans un autre dossier (à la fin). */
export async function setTemplateFolder(id: string, folderId: string | null) {
  await db.transaction('rw', db.templates, db.folders, async () => {
    const template = await db.templates.get(id)
    if (!template || template.folderId === folderId) return
    await db.templates.update(id, { folderId, order: await nextOrder(folderId) })
    if (template.folderId) {
      const old = await db.folders.get(template.folderId)
      if (old?.nextTemplateId === id) await db.folders.update(old.id, { nextTemplateId: null })
    }
  })
}

// Exercices d'un modèle (repérés par leur position)

async function editBlocks(id: string, edit: (blocks: TemplateBlock[]) => TemplateBlock[]) {
  await db.transaction('rw', db.templates, async () => {
    const template = await db.templates.get(id)
    if (template) await db.templates.update(id, { blocks: edit([...template.blocks]) })
  })
}

export function addTemplateExercise(id: string, exerciseId: string) {
  return editBlocks(id, (blocks) => [
    ...blocks,
    { exerciseId, supersetId: null, sets: DEFAULT_SETS, repRange: null, restSec: null },
  ])
}

export function updateTemplateBlock(
  id: string,
  index: number,
  changes: Partial<Pick<TemplateBlock, 'sets' | 'repRange' | 'restSec'>>,
) {
  return editBlocks(id, (blocks) => blocks.map((b, i) => (i === index ? { ...b, ...changes } : b)))
}

export function moveTemplateBlock(id: string, index: number, direction: -1 | 1) {
  return editBlocks(id, (blocks) => {
    const j = index + direction
    if (j < 0 || j >= blocks.length) return blocks
    ;[blocks[index], blocks[j]] = [blocks[j]!, blocks[index]!]
    return blocks
  })
}

/** Retire l'exercice ; un superset réduit à un seul exercice est dissous. */
export function removeTemplateBlock(id: string, index: number) {
  return editBlocks(id, (blocks) => dissolveLoneSupersets(blocks.filter((_, i) => i !== index)))
}

/** Groupe l'exercice avec le suivant dans un superset, ou le retire de son superset. */
export function toggleTemplateSuperset(id: string, index: number) {
  return editBlocks(id, (blocks) => {
    const block = blocks[index]
    const next = blocks[index + 1]
    if (!block) return blocks
    if (block.supersetId) {
      blocks[index] = { ...block, supersetId: null }
      return dissolveLoneSupersets(blocks)
    }
    if (!next) return blocks
    const supersetId = next.supersetId ?? newId()
    blocks[index] = { ...block, supersetId }
    blocks[index + 1] = { ...next, supersetId }
    return blocks
  })
}

function dissolveLoneSupersets(blocks: TemplateBlock[]): TemplateBlock[] {
  const counts = new Map<string, number>()
  for (const b of blocks)
    if (b.supersetId) counts.set(b.supersetId, (counts.get(b.supersetId) ?? 0) + 1)
  return blocks.map((b) =>
    b.supersetId && counts.get(b.supersetId) === 1 ? { ...b, supersetId: null } : b,
  )
}
