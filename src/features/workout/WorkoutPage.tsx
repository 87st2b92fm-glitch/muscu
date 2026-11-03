import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/Button'
import ExerciseSearchList from '../../components/ExerciseSearchList'
import Sheet from '../../components/Sheet'
import { useExercises, useGyms, useProfile } from '../../db/hooks'
import type { SetRow } from '../../db/types'
import {
  addExercises,
  changeWorkoutGym,
  finishWorkout,
  updateSet,
  updateWorkout,
} from '../../db/workouts'
import { effectiveKg } from '../../domain/load'
import { recordsInWorkout } from '../../domain/records'
import type { RecordKind } from '../../domain/types'
import GymPicker from '../training/GymPicker'
import { confirmAbandon } from './abandon'
import ExerciseBlock from './ExerciseBlock'
import { formatClock } from './format'
import RestTimer from './RestTimer'
import { useNow } from './useNow'
import { useWakeLock } from './useWakeLock'
import { useActiveWorkout, useExerciseContexts } from './useWorkout'
import ValueSheet, { type EditTarget } from './ValueSheet'

const SUPERSET_COLORS = ['#38bdf8', '#f472b6', '#facc15', '#a78bfa', '#34d399']

/** Écran de séance (« mode salle ») : plein écran, gros boutons, écran maintenu allumé. */
export default function WorkoutPage() {
  const navigate = useNavigate()
  const active = useActiveWorkout()
  const contexts = useExerciseContexts(active?.workout)
  const gyms = useGyms()
  const profile = useProfile()
  const library = useExercises()
  const now = useNow(1000)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [adding, setAdding] = useState(false)
  useWakeLock()

  if (active === null) return <Navigate to="/entrainement" replace />
  if (active === undefined) return null
  const { workout, sets } = active

  // Records battus en direct, exercice par exercice (même exercice dans deux blocs : un seul calcul).
  const records = new Map<string, RecordKind[]>()
  for (const [exerciseId, context] of contexts ?? []) {
    const current = sets
      .filter((s) => s.exerciseId === exerciseId && s.done)
      .map((s) => ({
        id: s.id,
        at: s.at,
        type: s.type,
        reps: s.reps,
        kg: effectiveKg(s.kg, context.exercise.loadMode, context.bodyweightKg) ?? s.kg,
      }))
    for (const [id, kinds] of recordsInWorkout(context.history, current)) records.set(id, kinds)
  }

  const setsByBlock = new Map<string, SetRow[]>()
  for (const set of sets)
    setsByBlock.set(set.blockId, [...(setsByBlock.get(set.blockId) ?? []), set])
  const supersetIds = [
    ...new Set(workout.blocks.flatMap((b) => (b.supersetId ? [b.supersetId] : []))),
  ]
  const editedSet = editTarget && sets.find((s) => s.id === editTarget.setId)
  const edit =
    editTarget && editedSet
      ? {
          ...editTarget,
          value: editedSet[editTarget.field],
          onChange: (value: number) =>
            void updateSet(editTarget.setId, { [editTarget.field]: value }),
        }
      : null
  const pending = sets.filter((s) => !s.done).length
  const done = sets.length - pending

  async function abandon() {
    if (await confirmAbandon(workout)) navigate('/entrainement', { replace: true })
  }

  async function finish() {
    const message =
      done === 0
        ? 'Aucune série validée : la séance sera abandonnée. Continuer ?'
        : pending > 0
          ? `${pending} série(s) non validée(s) seront supprimées. Terminer la séance ?`
          : 'Terminer la séance ?'
    if (!window.confirm(message)) return
    const saved = await finishWorkout(workout.id)
    navigate(saved ? `/seance/bilan/${workout.id}` : '/entrainement', { replace: true })
  }

  return (
    <div className="min-h-dvh pb-[calc(env(safe-area-inset-bottom)+12rem)]">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-bg/90 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/entrainement')}
            aria-label="Réduire la séance"
            className="flex size-11 items-center justify-center rounded-full active:bg-surface"
          >
            <ChevronDown size={26} aria-hidden />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-bold">{workout.title}</p>
            <p className="text-sm text-muted tabular-nums">
              {formatClock(now - workout.startedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void abandon()}
            aria-label="Abandonner la séance"
            className="flex size-11 items-center justify-center rounded-full text-danger active:bg-surface"
          >
            <Trash2 size={22} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => void finish()}
            className="min-h-11 rounded-full bg-accent px-4 font-semibold text-accent-contrast active:opacity-80"
          >
            Terminer
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 px-3 pt-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <input
            key={workout.title}
            defaultValue={workout.title}
            aria-label="Nom de la séance"
            onBlur={(e) => {
              const title = e.target.value.trim()
              if (title && title !== workout.title) void updateWorkout(workout.id, { title })
              else e.target.value = workout.title
            }}
            className="min-h-11 min-w-0 flex-1 bg-transparent text-2xl font-extrabold outline-none"
          />
          {gyms && (
            <GymPicker
              gyms={gyms}
              value={workout.gymId}
              defaultGymId={profile?.defaultGymId}
              onChange={(gymId) => void changeWorkoutGym(workout.id, gymId)}
            />
          )}
        </div>
        <p className="px-1 text-sm text-muted">
          {done} série{done > 1 ? 's' : ''} validée{done > 1 ? 's' : ''}
          {pending > 0 ? ` · ${pending} à faire` : ''}
        </p>

        {workout.blocks.map((block, i) => (
          <ExerciseBlock
            key={block.id}
            workout={workout}
            block={block}
            sets={setsByBlock.get(block.id) ?? []}
            context={contexts?.get(block.exerciseId)}
            records={records}
            supersetColor={
              block.supersetId
                ? SUPERSET_COLORS[supersetIds.indexOf(block.supersetId) % SUPERSET_COLORS.length]!
                : null
            }
            isFirst={i === 0}
            isLast={i === workout.blocks.length - 1}
            showRir={profile?.rirEnabled ?? true}
            onEdit={setEditTarget}
          />
        ))}

        <Button className="min-h-14 text-lg" onClick={() => setAdding(true)}>
          <Plus size={22} aria-hidden />
          Ajouter un exercice
        </Button>

        <label className="flex flex-col gap-1.5 pt-2">
          <span className="px-1 text-sm font-semibold text-muted">Notes de séance</span>
          <textarea
            defaultValue={workout.notes}
            rows={3}
            onBlur={(e) => void updateWorkout(workout.id, { notes: e.target.value.trim() })}
            className="rounded-2xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <Button variant="ghost" className="text-danger" onClick={() => void abandon()}>
          <Trash2 size={18} aria-hidden />
          Abandonner la séance
        </Button>
      </div>

      <RestTimer workout={workout} soundEnabled={profile?.restSoundEnabled ?? true} />
      <ValueSheet edit={edit} onClose={() => setEditTarget(null)} />
      <Sheet open={adding} onClose={() => setAdding(false)} title="Ajouter un exercice">
        <ExerciseSearchList
          exercises={library ?? []}
          onPick={(exerciseId) => {
            void addExercises(workout.id, [exerciseId])
            setAdding(false)
          }}
        />
      </Sheet>
    </div>
  )
}
