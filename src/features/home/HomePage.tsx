import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, Sparkles } from 'lucide-react'
import GymFilter from '../../components/GymFilter'
import PageHeader from '../../components/PageHeader'
import SectionHeader from '../../components/SectionHeader'
import { useGyms } from '../../db/hooks'
import { formatKg } from '../../domain/format'
import { DEMO_WORKOUTS } from './demoWorkouts'
import WorkoutCard from './WorkoutCard'

const WEEK_MS = 7 * 86_400_000

function WeekSummary({
  sessions,
  volumeKg,
  records,
}: {
  sessions: number
  volumeKg: number
  records: number
}) {
  const items = [
    { label: 'Séances', value: String(sessions) },
    { label: 'Volume', value: formatKg(volumeKg) },
    { label: 'Records', value: String(records) },
  ]
  return (
    <section className="bg-surface rounded-3xl p-4">
      <h2 className="text-muted mb-3 text-sm font-semibold">7 derniers jours</h2>
      <dl className="grid grid-cols-3 gap-2">
        {items.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-muted text-xs">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function HomePage() {
  const gyms = useGyms()
  const [gymId, setGymId] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  const workouts = DEMO_WORKOUTS.filter((w) => gymId === null || w.gym.id === gymId)
  const lastWeek = workouts.filter((w) => now - w.startedAt.getTime() < WEEK_MS)

  return (
    <>
      <PageHeader
        title="Accueil"
        action={
          <Link
            to="/entrainement"
            aria-label="Nouvelle séance"
            className="bg-accent text-accent-contrast flex size-11 items-center justify-center rounded-full active:opacity-80"
          >
            <Plus size={24} strokeWidth={2.5} aria-hidden />
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4">
        <p className="border-border text-muted flex items-start gap-2.5 rounded-2xl border border-dashed px-4 py-3 text-sm">
          <Sparkles size={18} className="text-accent mt-0.5 shrink-0" aria-hidden />
          Aperçu avec des séances d’exemple : elles disparaîtront dès ta première vraie séance.
        </p>

        {gyms && <GymFilter gyms={gyms} value={gymId} onChange={setGymId} />}

        <WeekSummary
          sessions={lastWeek.length}
          volumeKg={lastWeek.reduce((sum, w) => sum + w.volumeKg, 0)}
          records={lastWeek.reduce(
            (sum, w) => sum + w.exercises.reduce((n, e) => n + e.records.length, 0),
            0,
          )}
        />

        <SectionHeader title="Dernières séances" />
        {workouts.length > 0 ? (
          workouts.map((w) => <WorkoutCard key={w.id} workout={w} />)
        ) : (
          <p className="text-muted py-10 text-center">Aucune séance dans cette salle.</p>
        )}
      </div>
    </>
  )
}
