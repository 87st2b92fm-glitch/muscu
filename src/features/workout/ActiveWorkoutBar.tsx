import { Link } from 'react-router'
import { useConfirm } from '../../components/confirmContext'
import { Dumbbell, X } from 'lucide-react'
import type { Workout } from '../../db/types'
import { confirmAbandon } from './abandon'
import { formatClock } from './format'
import { useNow } from './useNow'

/** Rappel de la séance en cours, au-dessus de la barre d'onglets : y revenir d'un tap, ou l'abandonner. */
export default function ActiveWorkoutBar({ workout }: { workout: Workout }) {
  const confirm = useConfirm()
  const now = useNow(1000)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-20 flex justify-center px-5">
      <div className="pointer-events-auto flex min-h-12 w-full max-w-md items-center rounded-full bg-accent text-accent-contrast shadow-lg shadow-black/30">
        <Link
          to="/seance"
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 pl-4 font-semibold active:opacity-90"
        >
          <Dumbbell size={20} aria-hidden />
          <span className="min-w-0 flex-1 truncate">En cours · {workout.title}</span>
          <span className="tabular-nums">{formatClock(now - workout.startedAt)}</span>
        </Link>
        <button
          type="button"
          onClick={() => void confirmAbandon(workout, confirm)}
          aria-label="Abandonner la séance"
          className="mx-1 flex size-11 shrink-0 items-center justify-center rounded-full active:bg-black/15"
        >
          <X size={20} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  )
}
