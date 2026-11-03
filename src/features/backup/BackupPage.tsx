import { useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, CircleCheck, FileDown, FileUp, Sheet as SheetIcon } from 'lucide-react'
import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import { useConfirm } from '../../components/confirmContext'
import { FormSection } from '../../components/form'
import {
  createBackup,
  parseBackup,
  restoreBackup,
  summarizeBackup,
  type Backup,
} from '../../backup/backup'
import { workoutsToCsv } from '../../backup/csv'
import { db } from '../../db/db'
import { updateProfile, useProfile } from '../../db/hooks'
import { formatDay } from '../../domain/format'
import { datedName, shareFile } from './share'

const numberFormatter = new Intl.NumberFormat('fr-FR')

/** Sauvegarde : export JSON complet, export CSV des séances, import (fusion ou remplacement). */
export default function BackupPage() {
  const profile = useProfile()
  const confirm = useConfirm()
  const workoutCount = useLiveQuery(() => db.workouts.where('status').equals('done').count())
  const [pending, setPending] = useState<Backup | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function exportJson() {
    const backup = await createBackup(db)
    const shared = await shareFile(
      JSON.stringify(backup),
      datedName('muscu-sauvegarde', 'json'),
      'application/json',
    )
    if (shared) {
      await updateProfile({ lastBackupAt: Date.now() })
      setMessage({
        ok: true,
        text: 'Sauvegarde exportée. Garde le fichier dans Fichiers ou iCloud Drive.',
      })
    }
  }

  async function exportCsv() {
    const [workouts, sets, exercises, gyms] = await Promise.all([
      db.workouts.toArray(),
      db.sets.toArray(),
      db.exercises.toArray(),
      db.gyms.toArray(),
    ])
    const csv = workoutsToCsv(
      workouts,
      sets,
      new Map(exercises.map((e) => [e.id, e])),
      new Map(gyms.map((g) => [g.id, g])),
    )
    await shareFile(csv, datedName('muscu-seances', 'csv'), 'text/csv')
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setPending(parseBackup(await file.text(), db.verno))
      setMessage(null)
    } catch (error) {
      setPending(null)
      setMessage({ ok: false, text: error instanceof Error ? error.message : String(error) })
    }
  }

  async function restore(mode: 'merge' | 'replace') {
    if (!pending) return
    const ok = await confirm(
      mode === 'replace'
        ? {
            title: 'Remplacer toutes tes données ?',
            message:
              'Tout ce qui est dans l’app sera effacé et remplacé par la sauvegarde. Exporte d’abord une sauvegarde si tu as un doute.',
            confirmLabel: 'Remplacer',
            danger: true,
          }
        : {
            title: 'Fusionner la sauvegarde ?',
            message:
              'Ce qui manque dans l’app sera ajouté ; rien de ce qui existe ne sera modifié.',
            confirmLabel: 'Fusionner',
          },
    )
    if (!ok) return
    try {
      const added = await restoreBackup(db, pending, mode)
      setPending(null)
      setMessage({
        ok: true,
        text:
          mode === 'replace'
            ? 'Données remplacées par la sauvegarde.'
            : `${numberFormatter.format(added)} élément(s) ajouté(s).`,
      })
    } catch (error) {
      setMessage({ ok: false, text: `L’import a échoué, rien n’a été modifié. ${String(error)}` })
    }
  }

  const last = profile?.lastBackupAt ?? null
  const summary = pending ? summarizeBackup(pending) : null

  return (
    <>
      <PageHeader title="Sauvegarde" back />
      <div className="flex flex-col gap-6 px-4">
        <p className="rounded-3xl bg-surface p-4 text-[15px] text-muted">
          Tes données ne sont que sur ce téléphone. iOS peut les effacer si l’app n’est pas utilisée
          longtemps : exporte une sauvegarde régulièrement et garde-la dans Fichiers ou iCloud
          Drive.
        </p>

        <FormSection title="Exporter">
          <p className="text-sm">
            Dernière sauvegarde :{' '}
            <span className="font-semibold">{last ? formatDay(new Date(last)) : 'jamais'}</span>
            {workoutCount !== undefined &&
              ` · ${numberFormatter.format(workoutCount)} séances dans l’app`}
          </p>
          <Button className="min-h-14" onClick={() => void exportJson()}>
            <FileDown size={20} aria-hidden />
            Exporter une sauvegarde complète
          </Button>
          <Button variant="secondary" onClick={() => void exportCsv()}>
            <SheetIcon size={20} aria-hidden />
            Exporter les séances en CSV
          </Button>
          <p className="text-xs text-muted">
            La sauvegarde (JSON) contient tout et peut être réimportée. Le CSV (une ligne par série)
            s’ouvre dans Excel ou Numbers.
          </p>
        </FormSection>

        <FormSection title="Importer une sauvegarde">
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-surface-2 font-semibold active:opacity-80">
            <FileUp size={20} aria-hidden />
            Choisir un fichier .json
            <input
              type="file"
              accept=".json,application/json"
              onChange={onFile}
              className="sr-only"
            />
          </label>
          {summary && (
            <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4">
              <p className="font-semibold">
                Sauvegarde du {formatDay(new Date(summary.exportedAt))}
              </p>
              <p className="text-sm text-muted">
                {numberFormatter.format(summary.workouts)} séances ·{' '}
                {numberFormatter.format(summary.sets)} séries · {summary.templates} modèles ·{' '}
                {summary.customExercises} exercices perso · {summary.bodyweights} pesées
              </p>
              <Button onClick={() => void restore('merge')}>Fusionner avec mes données</Button>
              <Button variant="danger" onClick={() => void restore('replace')}>
                Remplacer toutes mes données
              </Button>
            </div>
          )}
        </FormSection>

        {message && (
          <p
            className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${
              message.ok ? 'bg-accent/10 text-accent' : 'bg-gold-soft text-gold'
            }`}
          >
            {message.ok ? (
              <CircleCheck size={18} className="mt-0.5 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
            )}
            {message.text}
          </p>
        )}
      </div>
    </>
  )
}
