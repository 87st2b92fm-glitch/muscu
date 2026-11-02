import { useState, type ChangeEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  FileUp,
  LoaderCircle,
} from 'lucide-react'
import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import { db } from '../../db/db'
import { useGyms, useProfile } from '../../db/hooks'
import { EQUIPMENT_LABELS } from '../../db/types'
import { formatSet } from '../../domain/format'
import { byName } from '../../domain/search'
import { parseDecimal } from '../../domain/units'
import {
  applyHevyImport,
  existingHevyKeys,
  type Correction,
  type ImportResult,
} from '../../import/apply'
import { parseCsv } from '../../import/csv'
import {
  detectHevyFile,
  parseHevyMeasurements,
  parseHevyWorkouts,
  type HevyMeasurement,
  type HevyWorkout,
} from '../../import/hevy'
import {
  buildPreview,
  type ImportPreview,
  type NameEntry,
  type Resolution,
} from '../../import/preview'
import GymPicker from '../training/GymPicker'
import ExerciseChoiceSheet from './ExerciseChoiceSheet'

type Stage =
  | { step: 'pick'; error: string | null }
  | { step: 'preview'; preview: ImportPreview; measurements: HevyMeasurement[] }
  | { step: 'importing' }
  | { step: 'done'; result: ImportResult }

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' })
const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const numberFormatter = new Intl.NumberFormat('fr-FR')

function Card({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4">{children}</section>
}

async function readFiles(files: FileList) {
  const workouts: HevyWorkout[] = []
  const measurements: HevyMeasurement[] = []
  for (const file of Array.from(files)) {
    const rows = parseCsv(await file.text())
    const kind = detectHevyFile(rows)
    if (kind === 'workouts') workouts.push(...parseHevyWorkouts(rows))
    else if (kind === 'measurements') measurements.push(...parseHevyMeasurements(rows))
    else throw new Error(`« ${file.name} » n’est pas un export Hevy reconnu.`)
  }
  return { workouts, measurements }
}

export default function ImportHevyPage() {
  const navigate = useNavigate()
  const profile = useProfile()
  const gyms = useGyms()
  const exercises = useLiveQuery(async () => (await db.exercises.toArray()).sort(byName))
  const [stage, setStage] = useState<Stage>({ step: 'pick', error: null })
  const [chosenGymId, setGymId] = useState<string | null>(null)
  const [resolutions, setResolutions] = useState(new Map<string, Resolution>())
  const [corrections, setCorrections] = useState(new Map<string, Correction>())
  const [editing, setEditing] = useState<NameEntry | null>(null)
  const [showRecognized, setShowRecognized] = useState(false)

  const gymId = chosenGymId ?? profile?.defaultGymId ?? null
  const exerciseById = new Map((exercises ?? []).map((e) => [e.id, e]))

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return
    try {
      const { workouts, measurements } = await readFiles(files)
      const preview = buildPreview(
        workouts,
        await db.exercises.toArray(),
        await db.importMappings.toArray(),
        existingHevyKeys(await db.workouts.toArray()),
      )
      setResolutions(new Map(preview.names.map((n) => [n.sourceName, n.resolution])))
      setCorrections(
        new Map(
          preview.anomalies.map((a) => [
            a.id,
            { skip: false, reps: a.set.reps ?? 0, kg: a.set.kg },
          ]),
        ),
      )
      setStage({ step: 'preview', preview, measurements })
    } catch (error) {
      setStage({ step: 'pick', error: error instanceof Error ? error.message : String(error) })
    }
    event.target.value = ''
  }

  async function runImport(preview: ImportPreview, measurements: HevyMeasurement[]) {
    if (!gymId) return
    setStage({ step: 'importing' })
    try {
      const result = await applyHevyImport(db, preview, measurements, {
        gymId,
        resolutions,
        corrections,
      })
      setStage({ step: 'done', result })
    } catch (error) {
      setStage({
        step: 'pick',
        error: `L’import a échoué, rien n’a été enregistré. ${String(error)}`,
      })
    }
  }

  function describe(resolution: Resolution | undefined): string {
    if (!resolution) return ''
    if (resolution.kind === 'existing') return exerciseById.get(resolution.exerciseId)?.name ?? '?'
    return `Nouvel exercice · ${EQUIPMENT_LABELS[resolution.equipment]}`
  }

  function nameRow(entry: NameEntry) {
    const resolution = resolutions.get(entry.sourceName)
    return (
      <li key={entry.sourceName}>
        <button
          type="button"
          onClick={() => setEditing(entry)}
          className="flex min-h-14 w-full items-center gap-3 border-b border-border py-2.5 text-left last:border-b-0"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{entry.sourceName}</span>
            <span
              className={`block text-sm ${resolution?.kind === 'create' ? 'text-gold' : 'text-accent'}`}
            >
              → {describe(resolution)}
            </span>
            <span className="block text-xs text-muted">
              {entry.workouts} séance{entry.workouts > 1 ? 's' : ''} · {entry.sets} séries
            </span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
        </button>
      </li>
    )
  }

  return (
    <>
      <PageHeader title="Import Hevy" back />
      <div className="flex flex-col gap-4 px-4">
        {stage.step === 'pick' && (
          <>
            <Card>
              <p className="font-semibold">Exporter depuis Hevy</p>
              <ol className="list-decimal space-y-1 pl-5 text-[15px] text-muted">
                <li>Dans Hevy : Profil → Réglages → Exporter et importer les données.</li>
                <li>Exporte les entraînements, et si tu veux les mensurations.</li>
                <li>Enregistre les fichiers .csv dans Fichiers, puis choisis-les ici.</li>
              </ol>
              <p className="text-sm text-muted">
                Tout reste sur ton téléphone. Les séances déjà importées sont ignorées : tu peux
                réimporter un export plus récent sans créer de doublons.
              </p>
            </Card>
            {stage.error && (
              <p className="flex items-start gap-2 rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
                {stage.error}
              </p>
            )}
            <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent text-lg font-semibold text-accent-contrast active:opacity-80">
              <FileUp size={22} aria-hidden />
              Choisir les fichiers CSV
              <input
                type="file"
                accept=".csv,text/csv"
                multiple
                onChange={onFiles}
                className="sr-only"
              />
            </label>
          </>
        )}

        {stage.step === 'preview' && (
          <>
            <Card>
              {stage.preview.workouts.length > 0 ? (
                <>
                  <p className="text-2xl font-bold tabular-nums">
                    {numberFormatter.format(stage.preview.workouts.length)} séances ·{' '}
                    {numberFormatter.format(stage.preview.setCount)} séries
                  </p>
                  <p className="text-muted">
                    De {monthFormatter.format(stage.preview.firstAt!)} à{' '}
                    {monthFormatter.format(stage.preview.lastAt!)}
                  </p>
                </>
              ) : (
                <p className="font-semibold">Aucune nouvelle séance à importer.</p>
              )}
              {stage.preview.alreadyImported > 0 && (
                <p className="text-sm text-muted">
                  {stage.preview.alreadyImported} séance(s) déjà importée(s), ignorée(s).
                </p>
              )}
              {stage.preview.skippedSets > 0 && (
                <p className="text-sm text-muted">
                  {stage.preview.skippedSets} série(s) sans reps (cardio) ignorée(s).
                </p>
              )}
              {stage.measurements.length > 0 && (
                <p className="text-sm text-muted">
                  {stage.measurements.length} date(s) de pesée et mensurations.
                </p>
              )}
              {gyms && gymId && stage.preview.workouts.length > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="text-sm text-muted">Salle de ces séances</span>
                  <GymPicker
                    gyms={gyms}
                    value={gymId}
                    defaultGymId={profile?.defaultGymId}
                    onChange={setGymId}
                  />
                </div>
              )}
            </Card>

            {stage.preview.names.some((n) => !n.recognized) && (
              <Card>
                <h2 className="text-lg font-bold">
                  Exercices à vérifier ({stage.preview.names.filter((n) => !n.recognized).length})
                </h2>
                <p className="text-sm text-muted">
                  Non reconnus : ils seront créés comme exercices perso, sauf si tu les associes à
                  un exercice existant. Touche une ligne pour choisir.
                </p>
                <ul>{stage.preview.names.filter((n) => !n.recognized).map(nameRow)}</ul>
              </Card>
            )}

            {stage.preview.names.some((n) => n.recognized) && (
              <Card>
                <button
                  type="button"
                  onClick={() => setShowRecognized(!showRecognized)}
                  aria-expanded={showRecognized}
                  className="flex min-h-11 items-center justify-between gap-3 text-left"
                >
                  <span>
                    <span className="block text-lg font-bold">
                      Exercices reconnus ({stage.preview.names.filter((n) => n.recognized).length})
                    </span>
                    <span className="block text-sm text-muted">
                      Plusieurs noms Hevy peuvent aller vers le même exercice : vérifie que ça te
                      convient.
                    </span>
                  </span>
                  <ChevronDown
                    size={22}
                    className={`shrink-0 text-muted transition-transform ${showRecognized ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {showRecognized && (
                  <ul>{stage.preview.names.filter((n) => n.recognized).map(nameRow)}</ul>
                )}
              </Card>
            )}

            {stage.preview.anomalies.length > 0 && (
              <Card>
                <h2 className="text-lg font-bold">
                  Valeurs suspectes ({stage.preview.anomalies.length})
                </h2>
                {stage.preview.anomalies.map((anomaly) => {
                  const correction = corrections.get(anomaly.id)!
                  const update = (changes: Partial<Correction>) =>
                    setCorrections(
                      new Map(corrections).set(anomaly.id, { ...correction, ...changes }),
                    )
                  return (
                    <div
                      key={anomaly.id}
                      className="flex flex-col gap-2 border-t border-border pt-3"
                    >
                      <p className="font-semibold">{anomaly.exerciseName}</p>
                      <p className="text-sm text-muted">
                        {anomaly.workoutTitle} · {dayFormatter.format(anomaly.startedAt)} ·{' '}
                        {formatSet(anomaly.set.kg ?? 0, anomaly.set.reps ?? 0)}
                      </p>
                      <p className="text-sm text-gold">{anomaly.reason}</p>
                      <div className="flex gap-2">
                        <label className="flex flex-1 items-center gap-2 rounded-2xl bg-surface-2 px-3">
                          <input
                            inputMode="numeric"
                            defaultValue={correction.reps}
                            disabled={correction.skip}
                            onChange={(e) => {
                              const reps = parseDecimal(e.target.value)
                              if (reps !== null) update({ reps: Math.round(reps) })
                            }}
                            aria-label="Reps corrigées"
                            className="min-h-11 w-full bg-transparent font-semibold tabular-nums outline-none disabled:opacity-40"
                          />
                          <span className="text-sm text-muted">reps</span>
                        </label>
                        <button
                          type="button"
                          aria-pressed={correction.skip}
                          onClick={() => update({ skip: !correction.skip })}
                          className={`min-h-11 rounded-2xl px-4 text-sm font-semibold ${
                            correction.skip ? 'bg-text text-bg' : 'bg-surface-2'
                          }`}
                        >
                          {correction.skip ? 'Série ignorée' : 'Ignorer la série'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </Card>
            )}

            <Button
              className="min-h-14 text-lg"
              disabled={
                !gymId || (stage.preview.workouts.length === 0 && stage.measurements.length === 0)
              }
              onClick={() => void runImport(stage.preview, stage.measurements)}
            >
              Importer
            </Button>
            <Button variant="ghost" onClick={() => setStage({ step: 'pick', error: null })}>
              Choisir d’autres fichiers
            </Button>
          </>
        )}

        {stage.step === 'importing' && (
          <Card>
            <p className="flex items-center gap-3 font-semibold">
              <LoaderCircle size={22} className="animate-spin text-accent" aria-hidden />
              Import en cours…
            </p>
          </Card>
        )}

        {stage.step === 'done' && (
          <>
            <Card>
              <p className="flex items-center gap-2 text-lg font-bold">
                <CircleCheck size={24} className="text-accent" aria-hidden />
                Import terminé
              </p>
              <ul className="text-[15px] text-muted">
                <li>{numberFormatter.format(stage.result.workouts)} séances</li>
                <li>{numberFormatter.format(stage.result.sets)} séries</li>
                <li>{stage.result.createdExercises} exercice(s) perso créé(s)</li>
                <li>
                  {stage.result.bodyweights} pesée(s), {stage.result.measurements} relevé(s) de
                  mensurations
                </li>
              </ul>
            </Card>
            <Button className="min-h-14 text-lg" onClick={() => navigate('/')}>
              Voir mes séances
            </Button>
          </>
        )}
      </div>

      <ExerciseChoiceSheet
        entry={editing}
        resolution={editing ? (resolutions.get(editing.sourceName) ?? null) : null}
        exercises={(exercises ?? []).filter((e) => !e.archived)}
        onChange={(resolution) =>
          editing && setResolutions(new Map(resolutions).set(editing.sourceName, resolution))
        }
        onClose={() => setEditing(null)}
      />
    </>
  )
}
