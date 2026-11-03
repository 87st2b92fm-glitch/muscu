import { useState } from 'react'
import { useConfirm } from '../../components/confirmContext'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import Segmented from '../../components/Segmented'
import { Chip, FormSection, NumberField, TextField } from '../../components/form'
import { db } from '../../db/db'
import { removeExercise, setEquipment, updateExercise } from '../../db/exercises'
import { EQUIPMENT_LABELS, type Equipment } from '../../db/types'
import type { LoadMode } from '../../domain/types'
import MachineSetupsSection from './MachineSetupsSection'
import MuscleChips from './MuscleChips'
import RepRangeField from './RepRangeField'

const EQUIPMENTS = Object.keys(EQUIPMENT_LABELS) as Equipment[]

const LOAD_MODES: { value: LoadMode; label: string }[] = [
  { value: 'bodyweight', label: 'Lest + poids du corps' },
  { value: 'external', label: 'Charge seule' },
]

export default function ExerciseEditPage() {
  const confirm = useConfirm()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const exercise = useLiveQuery(() => db.exercises.get(id), [id])
  const [message, setMessage] = useState<string | null>(null)

  if (exercise === undefined) return <PageHeader title="Exercice" back />

  async function remove() {
    const action = exercise!.custom ? 'Supprimer' : 'Masquer'
    const ok = await confirm({
      title: `${action} « ${exercise!.name} » ?`,
      message: exercise!.custom
        ? 'S’il a déjà servi, il sera seulement masqué et son historique conservé.'
        : 'Son historique et ses records sont conservés.',
      confirmLabel: action,
      danger: exercise!.custom,
    })
    if (!ok) return
    const result = await removeExercise(exercise!)
    if (result === 'deleted') navigate('/exercices', { replace: true })
    else setMessage('Exercice masqué : son historique et ses records sont conservés.')
  }

  return (
    <>
      <PageHeader title={exercise.name} back />
      <div className="flex flex-col gap-6 px-4">
        {exercise.archived && (
          <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold">
            Exercice masqué : il n’apparaît plus dans la bibliothèque.
          </p>
        )}

        <FormSection
          title="Exercice"
          hint={
            exercise.category === 'machine'
              ? 'Machine, poulie ou Smith : records propres à chaque salle.'
              : 'Poids libre : records communs à toutes les salles.'
          }
        >
          <TextField
            label="Nom"
            value={exercise.name}
            required
            onCommit={(name) => updateExercise(exercise.id, { name })}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-muted">Équipement</span>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENTS.map((equipment) => (
                <Chip
                  key={equipment}
                  selected={exercise.equipment === equipment}
                  onClick={() => setEquipment(exercise, equipment)}
                >
                  {EQUIPMENT_LABELS[equipment]}
                </Chip>
              ))}
            </div>
          </div>
          {exercise.equipment === 'bodyweight' && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-muted">Charge comptée</span>
              <Segmented
                label="Charge comptée"
                options={LOAD_MODES}
                value={exercise.loadMode}
                onChange={(loadMode) => updateExercise(exercise.id, { loadMode })}
              />
              <span className="text-xs text-muted">
                « Lest + poids du corps » pour les tractions, dips… : tu saisis le lest, l’app
                ajoute ton poids.
              </span>
            </div>
          )}
        </FormSection>

        <FormSection
          title="Muscles principaux"
          hint="Ils déterminent la couleur de la carte du corps."
        >
          <MuscleChips
            value={exercise.primaryMuscles}
            onChange={(primaryMuscles) =>
              updateExercise(exercise.id, {
                primaryMuscles,
                secondaryMuscles: exercise.secondaryMuscles.filter(
                  (m) => !primaryMuscles.includes(m),
                ),
              })
            }
          />
        </FormSection>

        <FormSection title="Muscles secondaires">
          <MuscleChips
            value={exercise.secondaryMuscles}
            excluded={exercise.primaryMuscles}
            onChange={(secondaryMuscles) => updateExercise(exercise.id, { secondaryMuscles })}
          />
        </FormSection>

        <FormSection
          title="Progression"
          hint="Double progression : quand toutes tes séries atteignent le haut de la fourchette, l’app te propose de monter la charge."
        >
          <RepRangeField
            key={exercise.id}
            value={exercise.repRange}
            onCommit={(repRange) => updateExercise(exercise.id, { repRange })}
          />
          <NumberField
            label="Temps de repos"
            integer
            suffix="s"
            placeholder="Réglage par défaut"
            value={exercise.restSec}
            onCommit={(restSec) => updateExercise(exercise.id, { restSec })}
          />
        </FormSection>

        {exercise.category === 'machine' && <MachineSetupsSection exercise={exercise} />}

        {message && (
          <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold">{message}</p>
        )}
        {exercise.archived ? (
          <Button
            variant="secondary"
            onClick={() => updateExercise(exercise.id, { archived: false })}
          >
            <Eye size={20} aria-hidden />
            Remettre dans la bibliothèque
          </Button>
        ) : (
          <Button variant="ghost" className="text-muted" onClick={() => void remove()}>
            {exercise.custom ? <Trash2 size={18} aria-hidden /> : <EyeOff size={18} aria-hidden />}
            {exercise.custom ? 'Supprimer l’exercice' : 'Masquer de la bibliothèque'}
          </Button>
        )}
      </div>
    </>
  )
}
