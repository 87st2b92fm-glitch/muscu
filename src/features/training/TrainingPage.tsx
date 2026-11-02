import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ClipboardPlus, FolderPlus, Library, Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SectionHeader from '../../components/SectionHeader'
import { useGyms, useProfile } from '../../db/hooks'
import { startWorkout } from '../../db/workouts'
import { useActiveWorkout } from '../workout/useWorkout'
import { DEMO_FOLDERS } from './demoTemplates'
import { useFolders } from './useFolders'
import GymPicker from './GymPicker'
import TemplateFolder from './TemplateFolder'

const tile =
  'flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-surface px-2 text-[15px] font-semibold whitespace-nowrap active:opacity-80'

export default function TrainingPage() {
  const gyms = useGyms()
  const profile = useProfile()
  // Salle du jour : la salle par défaut tant que l'utilisateur n'en a pas choisi une autre.
  const [chosenGymId, setGymId] = useState<string | null>(null)
  const gymId = chosenGymId ?? profile?.defaultGymId ?? null
  const folders = useFolders()
  const active = useActiveWorkout()
  const navigate = useNavigate()
  const isDemo = folders !== undefined && folders.every((f) => f.templates.length === 0)

  async function start(templateId: string | null) {
    if (!gymId) return
    if (
      active &&
      !window.confirm(`La séance « ${active.workout.title} » est en cours : la reprendre ?`)
    )
      return
    await startWorkout({ templateId, gymId })
    navigate('/seance')
  }

  return (
    <>
      <PageHeader
        title="Entraînement"
        action={
          gyms &&
          gymId && (
            <GymPicker
              gyms={gyms}
              value={gymId}
              defaultGymId={profile?.defaultGymId}
              onChange={setGymId}
            />
          )
        }
      />
      <div className="flex flex-col gap-4 px-4">
        <button
          type="button"
          className={`${tile} justify-start px-5 text-lg`}
          onClick={() => void start(null)}
        >
          <Plus size={26} className="text-accent" aria-hidden />
          Démarrer une séance vide
        </button>

        <SectionHeader
          title="Modèles"
          action={
            <button
              type="button"
              aria-label="Nouveau dossier"
              className="flex size-11 items-center justify-center rounded-full text-text active:bg-surface"
            >
              <FolderPlus size={24} aria-hidden />
            </button>
          }
        />
        <div className="flex gap-3">
          <button type="button" className={tile}>
            <ClipboardPlus size={20} className="text-accent" aria-hidden />
            Nouveau modèle
          </button>
          <Link to="/exercices" className={tile}>
            <Library size={20} className="text-accent" aria-hidden />
            Exercices
          </Link>
        </div>

        {isDemo && (
          <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted">
            Modèles d’exemple. Crée les tiens depuis l’import Hevy (Profil → Données) ; la création
            à la main arrive à l’étape suivante.
          </p>
        )}
        {(isDemo ? DEMO_FOLDERS : (folders ?? [])).map((folder) => (
          <TemplateFolder
            key={folder.id}
            folder={folder}
            onStart={isDemo ? undefined : (templateId) => void start(templateId)}
          />
        ))}
      </div>
    </>
  )
}
