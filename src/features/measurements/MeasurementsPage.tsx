import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2 } from 'lucide-react'
import LineChart from '../../components/charts/LineChart'
import PageHeader from '../../components/PageHeader'
import { useConfirm } from '../../components/confirmContext'
import { db } from '../../db/db'
import { useBodyweights } from '../../db/hooks'
import { MEASUREMENT_KEYS, type MeasurementKey } from '../../db/types'
import { formatDay, formatNumber } from '../../domain/format'
import { formatDelta, latestChange, measurementSeries, type Point } from '../../domain/measurements'
import BodyweightSection from '../profile/BodyweightSection'
import AddMeasurementSheet from './AddMeasurementSheet'

const KEYS = Object.keys(MEASUREMENT_KEYS) as MeasurementKey[]
const unitOf = (key: MeasurementKey) => (key === 'fatPercent' ? '%' : 'cm')

function Chart({ points, label }: { points: Point[]; label: string }) {
  return (
    <LineChart
      points={points.map((p) => ({ x: p.at, y: p.value }))}
      label={label}
      formatValue={(v) => formatNumber(Math.round(v * 10) / 10)}
    />
  )
}

/** Poids de corps et mensurations : dernières valeurs, évolution, courbes et relevés. */
export default function MeasurementsPage() {
  const confirm = useConfirm()
  const bodyweights = useBodyweights()
  const rows = useLiveQuery(() => db.measurements.orderBy('at').reverse().toArray())
  const [adding, setAdding] = useState(false)
  const [chosen, setChosen] = useState<MeasurementKey | null>(null)

  const weightSeries = [...(bodyweights ?? [])].reverse().map((b) => ({ at: b.at, value: b.kg }))
  const measured = KEYS.filter((key) => (rows ?? []).some((r) => r.values[key] !== undefined))
  const selected = chosen && measured.includes(chosen) ? chosen : (measured[0] ?? null)
  const selectedSeries = selected ? measurementSeries(rows ?? [], selected) : []

  return (
    <>
      <PageHeader
        title="Mensurations"
        back
        action={
          <button
            type="button"
            aria-label="Nouveau relevé"
            onClick={() => setAdding(true)}
            className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-contrast active:opacity-80"
          >
            <Plus size={24} strokeWidth={2.5} aria-hidden />
          </button>
        }
      />
      <div className="flex flex-col gap-4 px-4">
        <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
          <BodyweightSection />
          {weightSeries.length > 1 && <Chart points={weightSeries} label="Poids de corps" />}
          {weightSeries.length > 1 && <p className="text-xs text-muted">Valeurs en kg.</p>}
        </section>

        <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
          <h2 className="font-semibold">Mensurations</h2>
          {measured.length === 0 ? (
            <p className="text-sm text-muted">
              Aucun relevé. Touche + pour ajouter tour de taille, bras, cuisses… Tes relevés Hevy
              apparaissent ici après l’import.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {measured.map((key) => {
                  const last = latestChange(measurementSeries(rows ?? [], key))!
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={key === selected}
                      onClick={() => setChosen(key)}
                      className={`flex flex-col items-start rounded-2xl px-3 py-2.5 text-left ${
                        key === selected ? 'bg-accent/15 ring-2 ring-accent' : 'bg-surface-2'
                      }`}
                    >
                      <span className="text-xs text-muted">{MEASUREMENT_KEYS[key]}</span>
                      <span className="font-bold tabular-nums">
                        {formatNumber(last.value)} {unitOf(key)}
                        {last.delta !== null && (
                          <span className="ml-1.5 text-xs font-semibold text-muted">
                            {formatDelta(last.delta)}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
              {selected && (
                <div className="flex flex-col gap-2 pt-1">
                  <p className="text-sm font-semibold">
                    {MEASUREMENT_KEYS[selected]}{' '}
                    <span className="font-normal text-muted">
                      · {selectedSeries.length} relevé(s)
                    </span>
                  </p>
                  {selectedSeries.length > 1 ? (
                    <Chart points={selectedSeries} label={MEASUREMENT_KEYS[selected]} />
                  ) : (
                    <p className="text-sm text-muted">
                      Un seul relevé : la courbe apparaîtra au prochain.
                    </p>
                  )}
                  <p className="text-xs text-muted">Valeurs en {unitOf(selected)}.</p>
                </div>
              )}
            </>
          )}
        </section>

        {rows && rows.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="px-1 text-sm font-semibold text-muted">Relevés</h2>
            <ul className="overflow-hidden rounded-3xl bg-surface">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{formatDay(new Date(row.at))}</span>
                    <span className="block truncate text-sm text-muted">
                      {(Object.keys(row.values) as MeasurementKey[])
                        .map((k) => `${MEASUREMENT_KEYS[k]} ${formatNumber(row.values[k]!)}`)
                        .join(' · ')}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Supprimer le relevé du ${formatDay(new Date(row.at))}`}
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Supprimer ce relevé ?',
                        message: `Relevé du ${formatDay(new Date(row.at))}.`,
                        confirmLabel: 'Supprimer',
                        danger: true,
                      })
                      if (ok) await db.measurements.delete(row.id)
                    }}
                    className="flex size-11 shrink-0 items-center justify-center text-muted active:text-text"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <AddMeasurementSheet open={adding} onClose={() => setAdding(false)} />
    </>
  )
}
