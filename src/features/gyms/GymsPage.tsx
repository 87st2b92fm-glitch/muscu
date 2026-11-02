import { Link, useNavigate } from 'react-router'
import { ChevronRight, Plus } from 'lucide-react'
import GymBadge from '../../components/GymBadge'
import PageHeader from '../../components/PageHeader'
import { addGym } from '../../db/gyms'
import { useGyms, useProfile } from '../../db/hooks'

export default function GymsPage() {
  const gyms = useGyms()
  const profile = useProfile()
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Salles"
        back
        action={
          <button
            type="button"
            aria-label="Ajouter une salle"
            onClick={async () => navigate(`/salles/${await addGym()}`)}
            className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-contrast active:opacity-80"
          >
            <Plus size={24} strokeWidth={2.5} aria-hidden />
          </button>
        }
      />
      <div className="flex flex-col gap-4 px-4">
        <ul className="overflow-hidden rounded-3xl bg-surface">
          {gyms?.map((gym) => (
            <li key={gym.id} className="border-b border-border last:border-b-0">
              <Link
                to={`/salles/${gym.id}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-2"
              >
                <GymBadge gym={gym} />
                <span className="flex-1">
                  <span className="block font-semibold">{gym.name}</span>
                  {gym.id === profile?.defaultGymId && (
                    <span className="block text-sm text-muted">Salle par défaut</span>
                  )}
                </span>
                <ChevronRight size={20} className="text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <p className="px-1 text-sm text-muted">
          Chaque salle a ses disques et ses barres (calculateur de disques), et ses propres records
          pour les machines.
        </p>
      </div>
    </>
  )
}
