import { Play } from 'lucide-react'
import PageHeader from '../../components/PageHeader'

export default function WorkoutPage() {
  return (
    <>
      <PageHeader title="Séance" />
      <div className="flex flex-col gap-4 px-4 pb-6">
        <button
          type="button"
          disabled
          className="bg-accent text-accent-contrast flex min-h-14 items-center justify-center gap-2 rounded-2xl text-lg font-semibold disabled:opacity-50"
        >
          <Play size={22} aria-hidden />
          Démarrer une séance vide
        </button>
        <p className="text-muted text-center text-sm">La saisie des séances arrive à l’étape 4.</p>
      </div>
    </>
  )
}
