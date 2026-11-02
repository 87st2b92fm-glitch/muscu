import { useNavigate, useParams } from 'react-router'
import { PartyPopper, Trophy } from 'lucide-react'
import Button from '../../components/Button'
import RecordBadge from '../../components/RecordBadge'
import { formatBodyweightSet, formatSet } from '../../domain/format'
import { useWorkoutSummaries } from '../home/useWorkoutSummaries'
import WorkoutCard from '../home/WorkoutCard'

/** Bilan affiché à la fin d'une séance, avec les nouveaux records mis en avant. */
export default function WorkoutDonePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const summaries = useWorkoutSummaries()
  const summary = summaries?.find((s) => s.id === id)
  if (!summary) return null
  const withRecords = summary.exercises.filter((e) => e.records.length > 0)

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent/15">
          <PartyPopper size={32} className="text-accent" aria-hidden />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">Séance terminée</h1>
        <p className="text-muted">Bien joué !</p>
      </div>

      {withRecords.length > 0 && (
        <section className="flex flex-col gap-3 rounded-3xl border border-gold/40 bg-gold-soft p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gold">
            <Trophy size={22} aria-hidden />
            {withRecords.length > 1 ? `${withRecords.length} nouveaux records` : 'Nouveau record'}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {withRecords.map((exercise) => (
              <li key={exercise.key} className="flex flex-col gap-1">
                <span className="font-semibold">{exercise.name}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="tabular-nums">
                    {exercise.bodyweight
                      ? formatBodyweightSet(exercise.best.kg, exercise.best.reps)
                      : formatSet(exercise.best.kg, exercise.best.reps)}
                  </span>
                  {exercise.records.map((kind) => (
                    <RecordBadge key={kind} kind={kind} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <WorkoutCard workout={summary} />
      <Button className="min-h-14 text-lg" onClick={() => navigate('/', { replace: true })}>
        Retour à l’accueil
      </Button>
    </div>
  )
}
