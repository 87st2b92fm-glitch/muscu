import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, Sparkles } from 'lucide-react'
import Button from '../../components/Button'
import GymFilter from '../../components/GymFilter'
import PageHeader from '../../components/PageHeader'
import SectionHeader from '../../components/SectionHeader'
import { useGyms } from '../../db/hooks'
import { formatKg } from '../../domain/format'
import BackupReminder from '../backup/BackupReminder'
import { DEMO_WORKOUTS } from './demoWorkouts'
import type { WorkoutSummary } from './types'
import { useWorkoutSummaries } from './useWorkoutSummaries'
import WorkoutCard from './WorkoutCard'

const WEEK_MS = 7 * 86_400_000
const PAGE_SIZE = 15

const countRecords = (w: WorkoutSummary) => w.exercises.reduce((n, e) => n + e.records.length, 0)

function WeekSummary({ workouts }: { workouts: WorkoutSummary[] }) {
  const items = [
    { label: 'Séances', value: String(workouts.length) },
    {
      label: 'Volume',
      value: formatKg(Math.round(workouts.reduce((sum, w) => sum + w.volumeKg, 0))),
    },
    { label: 'Records', value: String(workouts.reduce((sum, w) => sum + countRecords(w), 0)) },
  ]
  return (
    <section className="rounded-3xl bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-muted">7 derniers jours</h2>
      <dl className="grid grid-cols-3 gap-2">
        {items.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function HomePage() {
  const gyms = useGyms()
  const summaries = useWorkoutSummaries()
  const [gymId, setGymId] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [now] = useState(() => Date.now())

  // Tant qu'aucune séance n'existe, des exemples montrent à quoi ressemblera le fil.
  const isDemo = summaries !== undefined && summaries.length === 0
  const all = isDemo ? DEMO_WORKOUTS : (summaries ?? [])
  const workouts = all.filter((w) => gymId === null || w.gym.id === gymId)
  const lastWeek = workouts.filter((w) => now - w.startedAt < WEEK_MS)

  return (
    <>
      <PageHeader
        title="Accueil"
        action={
          <Link
            to="/entrainement"
            aria-label="Nouvelle séance"
            className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-contrast active:opacity-80"
          >
            <Plus size={24} strokeWidth={2.5} aria-hidden />
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4">
        <BackupReminder hasWorkouts={(summaries?.length ?? 0) > 0} />
        {isDemo && (
          <p className="flex items-start gap-2.5 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span>
              Aperçu avec des séances d’exemple : elles disparaîtront dès ta première vraie séance,
              ou{' '}
              <Link to="/import-hevy" className="font-semibold text-accent">
                importe ton historique Hevy
              </Link>
              .
            </span>
          </p>
        )}

        {gyms && (
          <GymFilter
            gyms={gyms}
            value={gymId}
            onChange={(id) => {
              setGymId(id)
              setVisible(PAGE_SIZE)
            }}
          />
        )}

        {summaries !== undefined && <WeekSummary workouts={lastWeek} />}

        <SectionHeader title="Dernières séances" />
        {summaries !== undefined && workouts.length === 0 && (
          <p className="py-10 text-center text-muted">Aucune séance dans cette salle.</p>
        )}
        {workouts.slice(0, visible).map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
        {workouts.length > visible && (
          <Button variant="secondary" onClick={() => setVisible(visible + PAGE_SIZE)}>
            Voir plus ({workouts.length - visible} séances restantes)
          </Button>
        )}
      </div>
    </>
  )
}
