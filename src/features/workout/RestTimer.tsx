import { useEffect } from 'react'
import { Timer } from 'lucide-react'
import type { Workout } from '../../db/types'
import { adjustRest, setRestEndsAt } from '../../db/workouts'
import { formatClock } from './format'
import { playRestEndSound } from './sound'
import { useNow } from './useNow'

/** Combien de temps « Repos terminé » reste affiché après la fin. */
const DONE_DISPLAY_MS = 4000

/**
 * Chrono de repos calculé à partir de l'heure de fin enregistrée : il reste juste si l'app passe
 * en arrière-plan ou est rouverte. Bip à la fin si l'app est au premier plan et le son activé.
 */
export default function RestTimer({
  workout,
  soundEnabled,
}: {
  workout: Workout
  soundEnabled: boolean
}) {
  const { id, restEndsAt, restDurationSec } = workout
  const now = useNow(250, restEndsAt !== null)

  useEffect(() => {
    if (restEndsAt === null) return
    const delay = restEndsAt - Date.now()
    if (delay < -DONE_DISPLAY_MS) return
    const beep =
      delay > 0
        ? window.setTimeout(() => {
            if (soundEnabled && document.visibilityState === 'visible') playRestEndSound()
          }, delay)
        : undefined
    const hide = window.setTimeout(
      () => void setRestEndsAt(id, null),
      Math.max(0, delay) + DONE_DISPLAY_MS,
    )
    return () => {
      window.clearTimeout(beep)
      window.clearTimeout(hide)
    }
  }, [restEndsAt, soundEnabled, id])

  if (restEndsAt === null || now - restEndsAt > DONE_DISPLAY_MS) return null
  const remaining = Math.max(0, restEndsAt - now)
  const finished = remaining === 0
  const totalMs = (restDurationSec ?? 0) * 1000
  const progress = finished || totalMs === 0 ? 1 : Math.min(1, 1 - remaining / totalMs)
  const button = 'min-h-12 flex-1 rounded-2xl bg-surface-2 font-semibold active:opacity-70'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <section
        aria-live="polite"
        className={`pointer-events-auto mx-auto flex max-w-md flex-col gap-3 overflow-hidden rounded-3xl border p-3 shadow-xl shadow-black/40 backdrop-blur-xl ${
          finished ? 'border-accent bg-accent/20' : 'border-border/70 bg-surface/90'
        }`}
      >
        <div className="flex items-center gap-3 px-1">
          <Timer size={22} className="text-accent" aria-hidden />
          <span className="flex-1 font-semibold">{finished ? 'Repos terminé' : 'Repos'}</span>
          <span className="text-3xl font-extrabold tabular-nums">{formatClock(remaining)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {!finished && (
          <div className="flex gap-2">
            <button type="button" className={button} onClick={() => void adjustRest(workout, -15)}>
              −15 s
            </button>
            <button type="button" className={button} onClick={() => void adjustRest(workout, 15)}>
              +15 s
            </button>
            <button
              type="button"
              className={`${button} text-accent`}
              onClick={() => void setRestEndsAt(id, null)}
            >
              Passer
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
