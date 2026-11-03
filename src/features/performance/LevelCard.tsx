import { Link } from 'react-router'
import { Medal } from 'lucide-react'
import type { Sex } from '../../db/types'
import { SOURCES, tableFor, type StrengthStandard } from '../../data/strengthStandards'
import { formatKg } from '../../domain/format'
import { assessStrength, STRENGTH_LEVELS } from '../../domain/strengthLevel'

/**
 * Niveau de force d'un exercice : 1RM estimé comparé aux standards à ton poids de corps,
 * avec la charge à atteindre pour le niveau suivant.
 */
export default function LevelCard({
  standard,
  oneRmKg,
  sex,
  bodyweightKg,
}: {
  standard: StrengthStandard
  oneRmKg: number | null
  sex: Sex | null
  bodyweightKg: number | null
}) {
  const source = SOURCES[standard.source]
  const missing = !sex
    ? 'Indique ton sexe dans Profil pour voir ton niveau.'
    : bodyweightKg === null
      ? 'Ajoute une pesée dans Profil pour voir ton niveau.'
      : oneRmKg === null
        ? 'Fais une série de 1 à 10 reps pour estimer ton 1RM.'
        : null

  const assessment = !missing
    ? assessStrength(oneRmKg!, bodyweightKg!, tableFor(standard, sex!))
    : null
  const unit = standard.perDumbbell
    ? ' par haltère'
    : standard.load === 'bodyweight'
      ? ' (poids du corps compris)'
      : ''

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-muted">
        <Medal size={16} aria-hidden />
        Niveau de force
      </p>
      {missing ? (
        <p className="text-sm">
          {missing}{' '}
          {(!sex || bodyweightKg === null) && (
            <Link to="/profil" className="font-semibold text-accent">
              Ouvrir le profil
            </Link>
          )}
        </p>
      ) : (
        assessment && (
          <>
            <p className="flex items-center gap-2 text-2xl font-extrabold">
              <span
                className="inline-block size-3.5 rounded-full"
                style={{ background: `var(--level-${assessment.level})` }}
                aria-hidden
              />
              {STRENGTH_LEVELS[assessment.level]}
            </p>
            <div className="grid grid-cols-5 gap-1" aria-hidden>
              {STRENGTH_LEVELS.map((name, i) => (
                <span
                  key={name}
                  className="h-2 rounded-full"
                  style={{
                    background: i <= assessment.level ? `var(--level-${i})` : 'var(--surface-2)',
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1 text-[10px] text-muted">
              {STRENGTH_LEVELS.map((name, i) => (
                <span key={name} className="text-center tabular-nums">
                  {formatKg(Math.round(assessment.thresholdsKg[i]!))}
                </span>
              ))}
            </div>
            <p className="text-sm">
              {assessment.nextKg === null
                ? 'Tu es au niveau le plus élevé.'
                : `${STRENGTH_LEVELS[assessment.level + 1]} à ${formatKg(Math.round(assessment.nextKg))} de 1RM${unit}.`}
            </p>
          </>
        )
      )}
      <p className="text-xs text-muted">
        Seuils à ton poids de corps ({bodyweightKg !== null ? formatKg(bodyweightKg) : '?'}) d’après{' '}
        <a href={standard.url} target="_blank" rel="noreferrer" className="underline">
          {source.label}
        </a>
        , relevé le {new Date(standard.retrievedAt).toLocaleDateString('fr-FR')}.
      </p>
    </section>
  )
}
