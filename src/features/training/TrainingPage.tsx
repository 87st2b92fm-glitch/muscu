import { useState } from 'react'
import { Link } from 'react-router'
import { ClipboardPlus, FolderPlus, Library, Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SectionHeader from '../../components/SectionHeader'
import { useGyms, useProfile } from '../../db/hooks'
import { DEMO_FOLDERS } from './demoTemplates'
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
        <button type="button" className={`${tile} justify-start px-5 text-lg`}>
          <Plus size={26} className="text-accent" aria-hidden />
          Démarrer une séance vide
        </button>

        <SectionHeader
          title="Modèles"
          action={
            <button
              type="button"
              aria-label="Nouveau dossier"
              className="text-text active:bg-surface flex size-11 items-center justify-center rounded-full"
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

        {DEMO_FOLDERS.map((folder) => (
          <TemplateFolder key={folder.id} folder={folder} />
        ))}
      </div>
    </>
  )
}
