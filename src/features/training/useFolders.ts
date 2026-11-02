import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { FolderSummary } from './demoTemplates'

const NO_FOLDER = 'Mes modèles'

/** Dossiers et modèles enregistrés (avec le nom de leurs exercices), dans l'ordre choisi. */
export function useFolders(): FolderSummary[] | undefined {
  return useLiveQuery(async () => {
    const [folders, templates, exercises] = await Promise.all([
      db.folders.orderBy('order').toArray(),
      db.templates.orderBy('order').toArray(),
      db.exercises.toArray(),
    ])
    const names = new Map(exercises.map((e) => [e.id, e.name]))
    const summarize = (folderId: string | null) =>
      templates
        .filter((t) => t.folderId === folderId)
        .map((t) => ({
          id: t.id,
          name: t.name,
          exercises: t.blocks.map((b) => names.get(b.exerciseId) ?? '?'),
        }))
    const result: FolderSummary[] = folders.map((f) => ({
      id: f.id,
      name: f.name,
      nextTemplateId: f.isProgram ? (f.nextTemplateId ?? undefined) : undefined,
      templates: summarize(f.id),
    }))
    const loose = summarize(null)
    if (loose.length > 0) result.push({ id: 'none', name: NO_FOLDER, templates: loose })
    return result
  })
}
