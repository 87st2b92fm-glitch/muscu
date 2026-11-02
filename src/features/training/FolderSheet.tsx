import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { FieldLabel, TextField, Toggle } from '../../components/form'
import { db } from '../../db/db'
import { deleteFolder, moveFolder, updateFolder } from '../../db/templates'

/** Options d'un dossier : nom, mode programme et prochaine séance, ordre, suppression. */
export default function FolderSheet({
  folderId,
  onClose,
}: {
  folderId: string | null
  onClose: () => void
}) {
  const folder = useLiveQuery(
    async () => (folderId ? db.folders.get(folderId) : undefined),
    [folderId],
  )
  const templates = useLiveQuery(
    async () => (folderId ? db.templates.where('folderId').equals(folderId).sortBy('order') : []),
    [folderId],
  )

  return (
    <Sheet open={folderId !== null} onClose={onClose} title="Dossier">
      {folder && (
        <div className="flex flex-col gap-4">
          <TextField
            label="Nom"
            value={folder.name}
            required
            onCommit={(name) => void updateFolder(folder.id, { name })}
          />
          <Toggle
            label="Programme"
            hint="Les modèles s’enchaînent dans l’ordre : l’app te propose la prochaine séance."
            checked={folder.isProgram}
            onChange={(isProgram) => void updateFolder(folder.id, { isProgram })}
          />
          {folder.isProgram && templates && templates.length > 0 && (
            <FieldLabel label="Prochaine séance">
              <select
                value={folder.nextTemplateId ?? ''}
                onChange={(e) =>
                  void updateFolder(folder.id, { nextTemplateId: e.target.value || null })
                }
                className="min-h-12 rounded-2xl bg-surface-2 px-4 outline-none"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FieldLabel>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void moveFolder(folder.id, -1)}>
              <ArrowUp size={18} aria-hidden />
              Monter
            </Button>
            <Button variant="secondary" onClick={() => void moveFolder(folder.id, 1)}>
              <ArrowDown size={18} aria-hidden />
              Descendre
            </Button>
          </div>
          <Button
            variant="ghost"
            className="text-muted"
            onClick={async () => {
              if (
                !window.confirm(
                  `Supprimer le dossier « ${folder.name} » ? Ses modèles sont conservés.`,
                )
              )
                return
              await deleteFolder(folder.id)
              onClose()
            }}
          >
            <Trash2 size={18} aria-hidden />
            Supprimer le dossier
          </Button>
        </div>
      )}
    </Sheet>
  )
}
