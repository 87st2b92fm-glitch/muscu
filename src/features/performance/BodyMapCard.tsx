import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import BodyMap from '../../components/BodyMap'
import Sheet from '../../components/Sheet'
import { MUSCLES, MUSCLE_IDS, type MuscleId } from '../../data/muscles'
import { SOURCES, standardFor, tableFor } from '../../data/strengthStandards'
import { useBodyweights, useExercises, useProfile } from '../../db/hooks'
import { formatKg } from '../../domain/format'
import { muscleLevels, type MuscleLevel } from '../../domain/muscleLevels'
import { STRENGTH_LEVELS, type StrengthLevel } from '../../domain/strengthLevel'
import type { ExercisePerformance } from './performance'

// Rampe séquentielle d'une seule teinte (l'accent), du plus clair au plus intense.
const LEVEL_MIX = [40, 56, 71, 86, 100]
const levelFill = (level: StrengthLevel) =>
  `color-mix(in oklab, var(--accent) ${LEVEL_MIX[level]}%, var(--surface-2))`
const NO_DATA_FILL = 'color-mix(in oklab, var(--muted) 45%, var(--surface))'

const kg = (v: number) => formatKg(Math.round(v * 10) / 10)

function Swatch({ fill }: { fill: string }) {
  return (
    <span
      className="inline-block size-3 shrink-0 rounded-sm"
      style={{ background: fill }}
      aria-hidden
    />
  )
}

/** Carte du corps : chaque muscle coloré selon ton niveau de force (poids libres uniquement). */
export default function BodyMapCard({
  performances,
}: {
  performances: readonly ExercisePerformance[]
}) {
  const profile = useProfile()
  const bodyweights = useBodyweights()
  const library = useExercises()
  const [selected, setSelected] = useState<MuscleId | null>(null)
  const [showList, setShowList] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const sex = profile?.sex ?? null
  const bodyweightKg = bodyweights?.[0]?.kg ?? null
  const levels =
    sex && bodyweightKg !== null
      ? muscleLevels(
          performances.flatMap((p) => {
            const standard = standardFor(p.exercise.id)
            const oneRm = p.records.estimatedOneRm?.value
            return standard && oneRm
              ? [
                  {
                    exerciseId: p.exercise.id,
                    name: p.exercise.name,
                    primaryMuscles: p.exercise.primaryMuscles,
                    oneRmKg: oneRm,
                    table: tableFor(standard, sex),
                  },
                ]
              : []
          }),
          bodyweightKg,
        )
      : new Map<MuscleId, MuscleLevel>()

  const fill = (muscle: MuscleId) => {
    const level = levels.get(muscle)?.level
    return level === undefined ? NO_DATA_FILL : levelFill(level)
  }
  const describe = (muscle: MuscleId) => {
    const level = levels.get(muscle)?.level
    return level === undefined ? 'aucune donnée' : STRENGTH_LEVELS[level]
  }
  const detail = selected ? levels.get(selected) : undefined
  const references = selected
    ? (library ?? []).filter((e) => e.primaryMuscles.includes(selected) && standardFor(e.id))
    : []

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
      <h2 className="text-lg font-bold">Carte du corps</h2>

      {(!sex || bodyweightKg === null) && (
        <p className="text-sm text-muted">
          {!sex ? 'Indique ton sexe' : 'Ajoute une pesée'} dans{' '}
          <Link to="/profil" className="font-semibold text-accent">
            Profil
          </Link>{' '}
          pour colorer la carte selon tes niveaux.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {(['front', 'back'] as const).map((view) => (
          <figure key={view} className="flex flex-col items-center gap-1">
            <BodyMap
              view={view}
              fill={fill}
              describe={describe}
              selected={selected}
              onSelect={setSelected}
            />
            <figcaption className="text-xs text-muted">
              {view === 'front' ? 'Face' : 'Dos'}
            </figcaption>
          </figure>
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted" aria-label="Légende">
        {STRENGTH_LEVELS.map((name, i) => (
          <li key={name} className="flex items-center gap-1.5">
            <Swatch fill={levelFill(i as StrengthLevel)} />
            {name}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <Swatch fill={NO_DATA_FILL} />
          Aucune donnée
        </li>
      </ul>

      <button
        type="button"
        onClick={() => setShowSources(true)}
        className="flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-accent"
      >
        <Info size={16} aria-hidden />
        D’où viennent ces niveaux ?
      </button>

      <button
        type="button"
        onClick={() => setShowList(!showList)}
        aria-expanded={showList}
        className="flex min-h-11 items-center justify-between text-sm font-semibold"
      >
        Voir par muscle
        <ChevronDown
          size={18}
          className={`text-muted transition-transform ${showList ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {showList && (
        <ul className="-mt-2 flex flex-col">
          {MUSCLE_IDS.map((muscle) => (
            <li key={muscle}>
              <button
                type="button"
                onClick={() => setSelected(muscle)}
                className="flex min-h-11 w-full items-center gap-2 border-b border-border text-left last:border-b-0"
              >
                <Swatch fill={fill(muscle)} />
                <span className="flex-1">{MUSCLES[muscle]}</span>
                <span className="text-sm text-muted">{describe(muscle)}</span>
                <ChevronRight size={16} className="text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? MUSCLES[selected] : ''}
      >
        {selected && (
          <div className="flex flex-col gap-4 pb-1">
            {detail ? (
              <>
                <div>
                  <p className="text-sm text-muted">Niveau</p>
                  <p className="flex items-center gap-2 text-2xl font-extrabold">
                    <Swatch fill={levelFill(detail.level)} />
                    {STRENGTH_LEVELS[detail.level]}
                  </p>
                  <p className="mt-1 text-sm">
                    {detail.best.nextKg === null
                      ? `Niveau maximal atteint avec ${detail.best.name}.`
                      : `${STRENGTH_LEVELS[detail.level + 1]} : ${detail.best.name} à ${kg(detail.best.nextKg)} de 1RM.`}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-muted">Exercices pris en compte</p>
                  {detail.lifts.map((lift) => (
                    <Link
                      key={lift.exerciseId}
                      to={`/performance/${lift.exerciseId}`}
                      onClick={() => setSelected(null)}
                      className="flex min-h-12 items-center gap-3 rounded-2xl px-2 active:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{lift.name}</span>
                        <span className="block text-sm text-muted">
                          1RM est. {kg(lift.oneRmKg)} · {STRENGTH_LEVELS[lift.level]}
                          {lift.nextKg !== null ? ` · suivant à ${kg(lift.nextKg)}` : ''}
                        </span>
                      </span>
                      <ChevronRight size={16} className="text-muted" aria-hidden />
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[15px] text-muted">
                {references.length === 0
                  ? 'Pas de standard fiable pour ce muscle en poids libres : il reste gris.'
                  : `Aucune donnée : fais l’un de ces exercices pour colorer ce muscle : ${references
                      .map((e) => e.name)
                      .join(', ')}.`}
              </p>
            )}
            <p className="text-xs text-muted">
              Seuls les poids libres comptent : les machines n’ont pas de standard fiable (elles
              restent dans tes records).
            </p>
          </div>
        )}
      </Sheet>

      <Sheet
        open={showSources}
        onClose={() => setShowSources(false)}
        title="D’où viennent ces niveaux ?"
      >
        <div className="flex flex-col gap-3 pb-1 text-[15px]">
          <p>
            Ton niveau compare ton <strong>1RM estimé</strong> (formule d’Epley, séries de 1 à 10
            reps) aux standards pour ton <strong>sexe</strong> et ton{' '}
            <strong>poids de corps</strong> (interpolé entre les tranches).
          </p>
          <ul className="flex flex-col gap-2">
            <li>
              <a
                href={SOURCES.kilgore.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accent"
              >
                {SOURCES.kilgore.label}
              </a>{' '}
              : squat, développé couché, soulevé de terre, développé militaire, épaulé.
            </li>
            <li>
              <a
                href={SOURCES.strengthlevel.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accent"
              >
                {SOURCES.strengthlevel.label}
              </a>{' '}
              : les autres poids libres.
            </li>
          </ul>
          <p className="text-sm text-muted">
            Un muscle prend le niveau de ton meilleur exercice qui le travaille en principal.
            Données relevées le 2 novembre 2026. Silhouette : body-muscles d’Ivan Vulović (licence
            Apache-2.0).
          </p>
        </div>
      </Sheet>
    </section>
  )
}
