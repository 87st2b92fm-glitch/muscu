import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppDB } from './db'

const testDb = vi.hoisted(() => ({ current: null as unknown as AppDB }))
vi.mock('./db', async (importOriginal) => {
  const original = await importOriginal<typeof import('./db')>()
  return {
    ...original,
    get db() {
      return testDb.current
    },
  }
})

const t = await import('./templates')
const db = () => testDb.current

beforeEach(() => {
  testDb.current = new AppDB(`test-${crypto.randomUUID()}`)
})
afterEach(async () => {
  await testDb.current.delete()
})

async function namesIn(folderId: string | null) {
  return (
    await db()
      .templates.filter((x) => x.folderId === folderId)
      .sortBy('order')
  ).map((x) => x.name)
}

describe('dossiers et modèles', () => {
  it('crée des modèles à la suite dans un dossier et les réordonne', async () => {
    const folder = await t.createFolder('🍂')
    const legs = await t.createTemplate(folder, 'Legs')
    await t.createTemplate(folder, 'Push')
    const pull = await t.createTemplate(folder, 'Pull')
    expect(await namesIn(folder)).toEqual(['Legs', 'Push', 'Pull'])
    await t.moveTemplate(pull, -1)
    await t.moveTemplate(legs, -1) // déjà en tête : rien ne change
    expect(await namesIn(folder)).toEqual(['Legs', 'Pull', 'Push'])
  })

  it('choisit le premier modèle comme prochaine séance en passant en programme', async () => {
    const folder = await t.createFolder('PPL')
    const push = await t.createTemplate(folder, 'Push')
    await t.createTemplate(folder, 'Pull')
    await t.updateFolder(folder, { isProgram: true })
    expect(await db().folders.get(folder)).toMatchObject({ isProgram: true, nextTemplateId: push })
  })

  it('garde les modèles d’un dossier supprimé, hors dossier', async () => {
    const folder = await t.createFolder('Vieux')
    await t.createTemplate(folder, 'Full body')
    await t.deleteFolder(folder)
    expect(await namesIn(null)).toEqual(['Full body'])
  })

  it('reporte la prochaine séance si son modèle est supprimé ou déplacé', async () => {
    const folder = await t.createFolder('UL')
    const upper = await t.createTemplate(folder, 'Upper')
    const lower = await t.createTemplate(folder, 'Lower')
    await t.updateFolder(folder, { isProgram: true, nextTemplateId: lower })
    await t.deleteTemplate(lower)
    expect((await db().folders.get(folder))?.nextTemplateId).toBe(upper)
    await t.setTemplateFolder(upper, null)
    expect((await db().folders.get(folder))?.nextTemplateId).toBeNull()
  })

  it('duplique un modèle avec ses exercices', async () => {
    const id = await t.createTemplate(null, 'Legs')
    await t.addTemplateExercise(id, 'squat')
    const copy = await t.duplicateTemplate(id)
    expect(await db().templates.get(copy!)).toMatchObject({ name: 'Legs (copie)', order: 1 })
    expect((await db().templates.get(copy!))?.blocks.map((b) => b.exerciseId)).toEqual(['squat'])
  })
})

describe('exercices d’un modèle', () => {
  it('ajoute, règle, déplace et retire des exercices', async () => {
    const id = await t.createTemplate(null)
    await t.addTemplateExercise(id, 'squat')
    await t.addTemplateExercise(id, 'leg-press')
    await t.updateTemplateBlock(id, 0, { sets: 5, repRange: { min: 3, max: 5 }, restSec: 180 })
    await t.moveTemplateBlock(id, 1, -1)
    let blocks = (await db().templates.get(id))!.blocks
    expect(blocks.map((b) => b.exerciseId)).toEqual(['leg-press', 'squat'])
    expect(blocks[1]).toMatchObject({ sets: 5, repRange: { min: 3, max: 5 }, restSec: 180 })
    await t.removeTemplateBlock(id, 0)
    blocks = (await db().templates.get(id))!.blocks
    expect(blocks.map((b) => b.exerciseId)).toEqual(['squat'])
  })

  it('forme et défait un superset, et dissout un superset devenu seul', async () => {
    const id = await t.createTemplate(null)
    for (const e of ['db-lateral-raise', 'db-reverse-fly', 'db-curl'])
      await t.addTemplateExercise(id, e)
    await t.toggleTemplateSuperset(id, 0)
    let blocks = (await db().templates.get(id))!.blocks
    expect(blocks[0]!.supersetId).not.toBeNull()
    expect(blocks[0]!.supersetId).toBe(blocks[1]!.supersetId)
    await t.removeTemplateBlock(id, 1)
    blocks = (await db().templates.get(id))!.blocks
    expect(blocks.map((b) => b.supersetId)).toEqual([null, null])
  })
})
