import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Copy, Link2, Link2Off, Play, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/Button'
import ExerciseSearchList from '../../components/ExerciseSearchList'
import PageHeader from '../../components/PageHeader'
import Sheet from '../../components/Sheet'
import { FieldLabel, FormSection, NumberField, Stepper, TextField } from '../../components/form'
import { db } from '../../db/db'
import { useExercises, useProfile } from '../../db/hooks'
import {
  addTemplateExercise,
  deleteTemplate,
  duplicateTemplate,
  moveTemplate,
  moveTemplateBlock,
  removeTemplateBlock,
  setTemplateFolder,
  toggleTemplateSuperset,
  updateTemplate,
  updateTemplateBlock,
} from '../../db/templates'
import { startWorkout } from '../../db/workouts'
import { byName } from '../../domain/search'
import RepRangeField from '../exercises/RepRangeField'

const SUPERSET_COLORS = ['#38bdf8', '#f472b6', '#facc15', '#a78bfa', '#34d399']
const iconButton =
  'flex size-11 items-center justify-center rounded-full bg-surface-2 active:opacity-70 disabled:opacity-30'

export default function TemplateEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const template = useLiveQuery(() => db.templates.get(id), [id])
  const folders = useLiveQuery(async () =>
    (await db.folders.toArray()).sort((a, b) => a.order - b.order),
  )
  const exercises = useExercises()
  const allExercises = useLiveQuery(async () => (await db.exercises.toArray()).sort(byName))
  const profile = useProfile()
  const [adding, setAdding] = useState(false)

  if (template === undefined) return <PageHeader title="Modèle" back />
  const exerciseById = new Map((allExercises ?? []).map((e) => [e.id, e]))
  const supersetIds = [
    ...new Set(template.blocks.flatMap((b) => (b.supersetId ? [b.supersetId] : []))),
  ]

  async function start() {
    if (!profile) return
    await startWorkout({ templateId: template!.id, gymId: profile.defaultGymId })
    navigate('/seance')
  }

  return (
    <>
      <PageHeader title={template.name} back />
      <div className="flex flex-col gap-6 px-4">
        <Button
          className="min-h-14 text-lg"
          disabled={template.blocks.length === 0}
          onClick={() => void start()}
        >
          <Play size={20} aria-hidden />
          Commencer ce modèle
        </Button>

        <FormSection title="Modèle">
          <TextField
            label="Nom"
            value={template.name}
            required
            onCommit={(name) => void updateTemplate(template.id, { name })}
          />
          <FieldLabel label="Dossier">
            <select
              value={template.folderId ?? ''}
              onChange={(e) => void setTemplateFolder(template.id, e.target.value || null)}
              className="min-h-12 rounded-2xl bg-surface-2 px-4 outline-none"
            >
              <option value="">Aucun dossier</option>
              {folders?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void moveTemplate(template.id, -1)}>
              <ArrowUp size={18} aria-hidden />
              Monter
            </Button>
            <Button variant="secondary" onClick={() => void moveTemplate(template.id, 1)}>
              <ArrowDown size={18} aria-hidden />
              Descendre
            </Button>
          </div>
        </FormSection>

        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-sm font-semibold text-muted">
            Exercices ({template.blocks.length})
          </h2>
          {template.blocks.map((block, i) => {
            const exercise = exerciseById.get(block.exerciseId)
            const color = block.supersetId
              ? SUPERSET_COLORS[supersetIds.indexOf(block.supersetId) % SUPERSET_COLORS.length]
              : undefined
            return (
              <article
                key={`${i}-${block.exerciseId}`}
                className="flex flex-col gap-4 rounded-3xl bg-surface p-4"
                style={color ? { boxShadow: `inset 4px 0 0 ${color}` } : undefined}
              >
                <div>
                  {color && (
                    <p className="text-xs font-bold tracking-wide uppercase" style={{ color }}>
                      Superset
                    </p>
                  )}
                  <h3 className="text-lg leading-tight font-bold">
                    {exercise?.name ?? 'Exercice supprimé'}
                  </h3>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">Séries</span>
                  <Stepper
                    label="Séries"
                    value={block.sets}
                    min={1}
                    onChange={(sets) => void updateTemplateBlock(template.id, i, { sets })}
                  />
                </div>
                <RepRangeField
                  key={`${template.id}-${i}-${block.exerciseId}`}
                  value={block.repRange}
                  fallback={exercise?.repRange ?? null}
                  emptyHint={
                    exercise?.repRange
                      ? `Vide : fourchette de l’exercice (${exercise.repRange.min}–${exercise.repRange.max}).`
                      : 'Vide : pas de suggestion de progression.'
                  }
                  onCommit={(repRange) => void updateTemplateBlock(template.id, i, { repRange })}
                />
                <NumberField
                  label="Repos"
                  suffix="s"
                  integer
                  placeholder={String(exercise?.restSec ?? profile?.defaultRestSec ?? 120)}
                  value={block.restSec}
                  onCommit={(restSec) => void updateTemplateBlock(template.id, i, { restSec })}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={iconButton}
                    disabled={i === 0}
                    aria-label="Monter l’exercice"
                    onClick={() => void moveTemplateBlock(template.id, i, -1)}
                  >
                    <ArrowUp size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    disabled={i === template.blocks.length - 1}
                    aria-label="Descendre l’exercice"
                    onClick={() => void moveTemplateBlock(template.id, i, 1)}
                  >
                    <ArrowDown size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`${iconButton} w-auto flex-1 gap-2 px-3 text-sm font-semibold`}
                    disabled={!block.supersetId && i === template.blocks.length - 1}
                    onClick={() => void toggleTemplateSuperset(template.id, i)}
                  >
                    {block.supersetId ? (
                      <Link2Off size={18} aria-hidden />
                    ) : (
                      <Link2 size={18} aria-hidden />
                    )}
                    {block.supersetId ? 'Défaire le superset' : 'Superset'}
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    aria-label="Retirer l’exercice"
                    onClick={() => void removeTemplateBlock(template.id, i)}
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
              </article>
            )
          })}
          <Button
            variant={template.blocks.length === 0 ? 'primary' : 'secondary'}
            onClick={() => setAdding(true)}
          >
            <Plus size={20} aria-hidden />
            Ajouter un exercice
          </Button>
        </section>

        <FormSection title="Notes">
          <textarea
            key={template.notes}
            defaultValue={template.notes}
            rows={3}
            placeholder="Consignes, échauffement…"
            onBlur={(e) => void updateTemplate(template.id, { notes: e.target.value.trim() })}
            className="rounded-2xl bg-surface-2 px-4 py-3 outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
          />
        </FormSection>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const copy = await duplicateTemplate(template.id)
              if (copy) navigate(`/modeles/${copy}`, { replace: true })
            }}
          >
            <Copy size={18} aria-hidden />
            Dupliquer
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (
                !window.confirm(
                  `Supprimer le modèle « ${template.name} » ? Tes séances passées sont conservées.`,
                )
              )
                return
              await deleteTemplate(template.id)
              navigate('/entrainement', { replace: true })
            }}
          >
            <Trash2 size={18} aria-hidden />
            Supprimer
          </Button>
        </div>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Ajouter un exercice">
        <ExerciseSearchList
          exercises={exercises ?? []}
          onPick={(exerciseId) => {
            void addTemplateExercise(template.id, exerciseId)
            setAdding(false)
          }}
        />
      </Sheet>
    </>
  )
}
