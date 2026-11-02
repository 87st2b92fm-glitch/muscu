import { Link } from 'react-router'
import { Dumbbell } from 'lucide-react'
import { formatClock } from './format'
import { useNow } from './useNow'
import type { Workout } from '../../db/types'

/** Rappel de la séance en cours, au-dessus de la barre d'onglets, pour y revenir d'un tap. */
export default function ActiveWorkoutBar({ workout }: { workout: Workout }) {
  const now = useNow(1000)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-20 flex justify-center px-5">
      <Link
        to="/seance"
        className="pointer-events-auto flex min-h-12 w-full max-w-md items-center gap-3 rounded-full bg-accent px-4 font-semibold text-accent-contrast shadow-lg shadow-black/30 active:opacity-90"
      >
        <Dumbbell size={20} aria-hidden />
        <span className="min-w-0 flex-1 truncate">Séance en cours · {workout.title}</span>
        <span className="tabular-nums">{formatClock(now - workout.startedAt)}</span>
      </Link>
    </div>
  )
}
