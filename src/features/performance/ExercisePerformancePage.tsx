import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Info, Lightbulb, SquarePen } from 'lucide-react'
import GymFilter from '../../components/GymFilter'
import PageHeader from '../../components/PageHeader'
import Segmented from '../../components/Segmented'
import { Chip } from '../../components/form'
import LineChart from '../../components/charts/LineChart'
import { buildContext, loadContextData } from '../../db/exerciseContext'
import { useGyms } from '../../db/hooks'
import { describeSuggestion } from '../../domain/progression'
import { formatDay, formatKg, formatNumber, formatSet } from '../../domain/format'
import type { SessionPoint } from '../../domain/progress'
import type { RecordEntry } from '../../domain/records'
import { usePerformances, useSelectedGym } from './usePerformances'

type Metric = 'e1rm' | 'maxKg' | 'volume'
const METRICS: { value: Metric; label: string }[] = [
  { value: 'e1rm', label: '1RM est.' },
  { value: 'maxKg', label: 'Charge max' },
  { value: 'volume', label: 'Volume' },
]
const RANGES = [
  { label: '3 mois', days: 91 },
  { label: '6 mois', days: 183 },
  { label: '1 an', days: 365 },
  { label: 'Tout', days: null },
] as const
const DAY_MS = 86_400_000

const value = (p: SessionPoint, metric: Metric) => (metric === 'e1rm' ? p.e1rm : p[metric])
const kg = (v: number) => formatKg(Math.round(v * 10) / 10)

function Tile({
  label,
  entry,
  text,
  hero = false,
}: {
  label: string
  entry: RecordEntry | null
  text: string
  hero?: boolean
}) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-3xl bg-surface p-4 ${hero ? 'col-span-2' : ''}`}>
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`font-extrabold tracking-tight tabular-nums ${hero ? 'text-5xl' : 'text-2xl'}`}
      >
        {entry ? text : '—'}
      </span>
      {entry && <span className="text-xs text-muted">{formatDay(new Date(entry.at))}</span>}
    </div>
  )
}

export default function ExercisePerformancePage() {
  const { id = '' } = useParams()
  const gyms = useGyms()
  const { gymId, setGymId } = useSelectedGym()
  const performances = usePerformances(gymId)
  const [metric, setMetric] = useState<Metric>('e1rm')
  const [rangeDays, setRangeDays] = useState<number | null>(365)
  // Ce que proposera la prochaine séance dans la salle choisie (même calcul qu'en séance).
  const next = useLiveQuery(async () => {
    if (!gymId) return null
    const data = await loadContextData([id], gymId)
    return data ? buildContext(data, id, null) : null
  }, [id, gymId])

  const performance = performances?.find((p) => p.exercise.id === id)
  if (performances === undefined) return <PageHeader title="Performance" back />
  if (!performance) {
    return (
      <>
        <PageHeader title="Performance" back />
        <p className="px-4 text-muted">
          Aucune série enregistrée pour cet exercice dans cette salle.
        </p>
      </>
    )
  }

  const { exercise, records, series } = performance
  const bodyweight = exercise.loadMode === 'bodyweight'
  const since = rangeDays === null ? -Infinity : performance.lastAt - rangeDays * DAY_MS
  const inRange = series.filter((p) => p.at >= since)
  const points = inRange.flatMap((p) => {
    const y = value(p, metric)
    return y === null ? [] : [{ x: p.at, y }]
  })
  const metricLabel = METRICS.find((m) => m.value === metric)!.label

  return (
    <>
      <PageHeader title={exercise.name} back />
      <div className="flex flex-col gap-4 px-4">
        {exercise.category === 'machine' && gyms && gymId && (
          <GymFilter
            gyms={gyms}
            value={gymId}
            allowAll={false}
            onChange={(g) => g && setGymId(g)}
          />
        )}
        {bodyweight && (
          <p className="flex items-start gap-2 px-1 text-sm text-muted">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
            Charges avec ton poids du corps (lest + poids du corps à la date de la séance).
          </p>
        )}

        {next && next.previous.length > 0 && (
          <section className="flex flex-col gap-1.5 rounded-3xl bg-accent/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Lightbulb size={16} aria-hidden />
              Prochaine séance
            </p>
            <p className="font-semibold">
              {describeSuggestion(next.suggestion) ?? (
                <Link to={`/exercices/${exercise.id}`} className="text-accent">
                  Ajoute une fourchette de reps pour recevoir une suggestion
                </Link>
              )}
            </p>
            <p className="text-sm text-muted">
              Dernière fois :{' '}
              {next.previous
                .filter((s) => s.type !== 'warmup')
                .map((s) => `${formatNumber(s.kg)} × ${s.reps}`)
                .join(', ')}
            </p>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3" aria-label="Records">
          <Tile
            hero
            label="1RM estimé (Epley)"
            entry={records.estimatedOneRm}
            text={records.estimatedOneRm ? kg(records.estimatedOneRm.value) : ''}
          />
          <Tile
            label="1RM réel"
            entry={records.actualOneRm}
            text={records.actualOneRm ? kg(records.actualOneRm.value) : ''}
          />
          <Tile
            label="Charge max"
            entry={records.maxWeight}
            text={records.maxWeight ? kg(records.maxWeight.value) : ''}
          />
          <Tile
            label="Meilleure série"
            entry={records.bestSetVolume}
            text={
              records.bestSetVolume
                ? formatSet(records.bestSetVolume.kg, records.bestSetVolume.reps)
                : ''
            }
          />
          <Tile
            label="Reps max"
            entry={records.maxReps}
            text={records.maxReps ? `${records.maxReps.value} reps` : ''}
          />
        </section>

        <section className="flex flex-col gap-3">
          <Segmented label="Mesure" options={METRICS} value={metric} onChange={setMetric} />
          <div role="group" aria-label="Période" className="flex gap-2">
            {RANGES.map((r) => (
              <Chip
                key={r.label}
                selected={rangeDays === r.days}
                onClick={() => setRangeDays(r.days)}
              >
                {r.label}
              </Chip>
            ))}
          </div>
          <div className="rounded-3xl bg-surface p-4">
            <h2 className="mb-2 font-semibold">
              {metricLabel}{' '}
              <span className="font-normal text-muted">
                · {points.length} séance{points.length > 1 ? 's' : ''}
              </span>
            </h2>
            {points.length > 0 ? (
              <LineChart
                points={points}
                label={`${metricLabel} de ${exercise.name}`}
                formatValue={(v) =>
                  metric === 'volume'
                    ? `${formatNumber(Math.round(v))}`
                    : formatNumber(Math.round(v * 10) / 10)
                }
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted">
                Aucune donnée sur cette période.
              </p>
            )}
            <p className="mt-1 text-xs text-muted">Valeurs en kg.</p>
          </div>
        </section>

        {records.repsByWeight.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="px-1 text-sm font-semibold text-muted">Record de reps par charge</h2>
            <table className="overflow-hidden rounded-3xl bg-surface text-left">
              <tbody>
                {records.repsByWeight.map((entry) => (
                  <tr key={entry.kg} className="border-b border-border last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 font-semibold tabular-nums">
                      {kg(entry.kg)}
                    </th>
                    <td className="px-2 py-2.5 tabular-nums">{entry.value} reps</td>
                    <td className="px-4 py-2.5 text-right text-sm text-muted">
                      {formatDay(new Date(entry.at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-semibold text-muted">Séances ({inRange.length})</h2>
          <ul className="overflow-hidden rounded-3xl bg-surface">
            {[...inRange].reverse().map((p) => (
              <li key={p.workoutId} className="border-b border-border last:border-b-0">
                <Link
                  to={`/seances/${p.workoutId}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-2.5 active:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold tabular-nums">
                      {formatSet(p.best.kg, p.best.reps)}
                    </span>
                    <span className="block text-sm text-muted">
                      {formatDay(new Date(p.at))}
                      {p.e1rm !== null ? ` · 1RM est. ${kg(p.e1rm)}` : ''} ·{' '}
                      {formatNumber(Math.round(p.volume))} kg de volume
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Link
          to={`/exercices/${exercise.id}`}
          className="flex min-h-12 items-center justify-center gap-2 font-semibold text-accent"
        >
          <SquarePen size={18} aria-hidden />
          Fiche de l’exercice
        </Link>
      </div>
    </>
  )
}
