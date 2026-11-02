import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ClipboardPlus, Pencil, Plus, Trash2, Trophy } from 'lucide-react'
import Button from '../../components/Button'
import ExerciseSearchList from '../../components/ExerciseSearchList'
import GymBadge from '../../components/GymBadge'
import PageHeader from '../../components/PageHeader'
import Sheet from '../../components/Sheet'
import { Chip, FieldLabel, FormSection, NumberField, TextField } from '../../components/form'
import { addPastExercise, saveAsTemplate, updateWorkoutTimes } from '../../db/history'
import { useExercises, useGyms, useProfile } from '../../db/hooks'
import type { SetRow } from '../../db/types'
import {
  changeWorkoutGym,
  deleteSet,
  discardWorkout,
  updateSet,
  updateWorkout,
} from '../../db/workouts'
import { formatDuration, formatKg } from '../../domain/format'
import type { SetType } from '../../domain/types'
import GymPicker from '../training/GymPicker'
import ValueSheet, { type EditTarget } from '../workout/ValueSheet'
import { useWorkoutDetail } from '../home/useWorkoutSummaries'
import { formatLongDate, fromDateTimeLocal, toDateTimeLocal } from './dates'
import PastBlock from './PastBlock'

const SUPERSET_COLORS = ['#38bdf8', '#f472b6', '#facc15', '#a78bfa', '#34d399']
const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'normal', label: 'Normale' },
  { value: 'warmup', label: 'Échauffement' },
  { value: 'drop', label: 'Dégressive' },
  { value: 'failure', label: 'Échec' },
]

/** Détail d'une séance passée, modifiable (les records sont recalculés automatiquement). */
export default function WorkoutDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const detail = useWorkoutDetail(id)
  const gyms = useGyms()
  const profile = useProfile()
  const library = useExercises()
  const [editing, setEditing] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [setMenu, setSetMenu] = useState<SetRow | null>(null)
  const [adding, setAdding] = useState(false)

  if (detail === undefined) return <PageHeader title="Séance" back />
  if (detail === null) {
    return (
      <>
        <PageHeader title="Séance" back />
        <p className="px-4 text-muted">Cette séance n’existe plus.</p>
      </>
    )
  }

  const { workout, summary, sets, exercises, flags } = detail
  const supersetIds = [
    ...new Set(workout.blocks.flatMap((b) => (b.supersetId ? [b.supersetId] : []))),
  ]
  const recordCount = summary?.exercises.reduce((n, e) => n + e.records.length, 0) ?? 0
  const durationMin = ((workout.endedAt ?? workout.startedAt) - workout.startedAt) / 60_000
  const editedSet = editTarget && sets.find((s) => s.id === editTarget.setId)

  return (
    <>
      <PageHeader
        title={workout.title}
        back
        action={
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className={`flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold ${
              editing ? 'bg-accent text-accent-contrast' : 'bg-surface'
            }`}
          >
            {!editing && <Pencil size={18} aria-hidden />}
            {editing ? 'Terminé' : 'Modifier'}
          </button>
        }
      />
      <div className="flex flex-col gap-4 px-4">
        <section className="flex flex-col gap-4 rounded-3xl bg-surface p-4">
          <div className="flex items-center gap-3">
            {summary && <GymBadge gym={summary.gym} />}
            <div className="min-w-0">
              <p className="font-semibold first-letter:uppercase">
                {formatLongDate(workout.startedAt)}
              </p>
              <p className="text-sm text-muted">{summary?.gym.name}</p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            <div>
              <dt className="text-xs text-muted">Durée</dt>
              <dd className="font-semibold tabular-nums">{formatDuration(durationMin)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Volume</dt>
              <dd className="font-semibold tabular-nums">
                {formatKg(Math.round(summary?.volumeKg ?? 0))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Records</dt>
              <dd
                className={`flex items-center gap-1 font-semibold ${recordCount > 0 ? 'text-gold' : ''}`}
              >
                {recordCount > 0 && <Trophy size={15} strokeWidth={2.5} aria-hidden />}
                {recordCount}
              </dd>
            </div>
          </dl>
          {!editing && workout.notes && (
            <p className="text-sm whitespace-pre-line text-muted">{workout.notes}</p>
          )}
        </section>

        {editing && (
          <FormSection
            title="Séance"
            hint="Les records sont recalculés automatiquement après chaque modification."
          >
            <TextField
              label="Nom"
              value={workout.title}
              required
              onCommit={(title) => void updateWorkout(workout.id, { title })}
            />
            {gyms && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-muted">Salle</span>
                <GymPicker
                  gyms={gyms}
                  value={workout.gymId}
                  defaultGymId={profile?.defaultGymId}
                  onChange={(gymId) => void changeWorkoutGym(workout.id, gymId)}
                />
              </div>
            )}
            <FieldLabel label="Début">
              <input
                type="datetime-local"
                key={workout.startedAt}
                defaultValue={toDateTimeLocal(workout.startedAt)}
                onBlur={(e) => {
                  const at = fromDateTimeLocal(e.target.value)
                  if (at !== null && at !== workout.startedAt)
                    void updateWorkoutTimes(workout.id, at, durationMin)
                }}
                className="min-h-12 rounded-2xl bg-surface-2 px-4 outline-none"
              />
            </FieldLabel>
            <NumberField
              label="Durée"
              suffix="min"
              integer
              allowEmpty={false}
              value={Math.round(durationMin)}
              onCommit={(minutes) =>
                minutes !== null && void updateWorkoutTimes(workout.id, workout.startedAt, minutes)
              }
            />
            <FieldLabel label="Notes">
              <textarea
                key={workout.notes}
                defaultValue={workout.notes}
                rows={3}
                onBlur={(e) => void updateWorkout(workout.id, { notes: e.target.value.trim() })}
                className="rounded-2xl bg-surface-2 px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
              />
            </FieldLabel>
          </FormSection>
        )}

        {workout.blocks.map((block) => (
          <PastBlock
            key={block.id}
            workout={workout}
            block={block}
            exercise={exercises.get(block.exerciseId)}
            sets={sets.filter((s) => s.blockId === block.id)}
            flags={flags}
            supersetColor={
              block.supersetId
                ? SUPERSET_COLORS[supersetIds.indexOf(block.supersetId) % SUPERSET_COLORS.length]!
                : null
            }
            editing={editing}
            onEdit={setEditTarget}
            onSetMenu={setSetMenu}
          />
        ))}

        {editing ? (
          <Button onClick={() => setAdding(true)}>
            <Plus size={20} aria-hidden />
            Ajouter un exercice
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={async () => {
              const templateId = await saveAsTemplate(workout.id)
              if (templateId) navigate(`/modeles/${templateId}`)
            }}
          >
            <ClipboardPlus size={20} aria-hidden />
            Enregistrer comme modèle
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-muted"
          onClick={async () => {
            if (
              !window.confirm(
                `Supprimer la séance « ${workout.title} » ? Ses records disparaîtront aussi.`,
              )
            )
              return
            await discardWorkout(workout.id)
            navigate('/', { replace: true })
          }}
        >
          <Trash2 size={18} aria-hidden />
          Supprimer la séance
        </Button>
      </div>

      <ValueSheet
        edit={
          editTarget && editedSet
            ? {
                ...editTarget,
                value: editedSet[editTarget.field],
                onChange: (value) =>
                  void updateSet(editTarget.setId, { [editTarget.field]: value }),
              }
            : null
        }
        onClose={() => setEditTarget(null)}
      />
      <Sheet open={setMenu !== null} onClose={() => setSetMenu(null)} title="Type de série">
        {setMenu && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {SET_TYPES.map(({ value, label }) => (
                <Chip
                  key={value}
                  selected={setMenu.type === value}
                  onClick={() => {
                    void updateSet(setMenu.id, { type: value })
                    setSetMenu(null)
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                void deleteSet(setMenu.id)
                setSetMenu(null)
              }}
            >
              <Trash2 size={18} aria-hidden />
              Supprimer la série
            </Button>
          </div>
        )}
      </Sheet>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Ajouter un exercice">
        <ExerciseSearchList
          exercises={library ?? []}
          onPick={(exerciseId) => {
            void addPastExercise(workout.id, exerciseId)
            setAdding(false)
          }}
        />
      </Sheet>
    </>
  )
}
