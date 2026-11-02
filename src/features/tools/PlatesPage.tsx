import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Minus, Plus } from 'lucide-react'
import GymFilter from '../../components/GymFilter'
import PageHeader from '../../components/PageHeader'
import PlateStack from '../../components/PlateStack'
import { Chip } from '../../components/form'
import { db } from '../../db/db'
import { useGyms, useProfile } from '../../db/hooks'
import { formatKg, formatNumber } from '../../domain/format'
import { loadBar, loadBarAbove } from '../../domain/plates'
import { parseDecimal, round2 } from '../../domain/units'

/** Calculateur de disques : quels disques mettre de chaque côté, avec la barre et le stock de la salle. */
export default function PlatesPage() {
  const gyms = useGyms()
  const profile = useProfile()
  const [chosenGymId, setGymId] = useState<string | null>(null)
  const gymId = chosenGymId ?? profile?.defaultGymId ?? null
  const gym = useLiveQuery(async () => (gymId ? db.gyms.get(gymId) : undefined), [gymId])
  const [barId, setBarId] = useState<string | null>(null)
  const [target, setTarget] = useState(60)

  if (!gym) return <PageHeader title="Disques" back />
  const bar = gym.bars.find((b) => b.id === barId) ?? gym.bars[0]
  const smallest = gym.plates.length > 0 ? Math.min(...gym.plates.map((p) => p.kg)) : 1.25
  const step = round2(smallest * 2)
  const below = bar ? loadBar(target, bar.kg, gym.plates) : null
  const above = bar ? loadBarAbove(target, bar.kg, gym.plates) : null
  const big =
    'flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-2 active:opacity-70'

  return (
    <>
      <PageHeader title="Disques" back />
      <div className="flex flex-col gap-4 px-4">
        {gyms && gymId && (
          <GymFilter
            gyms={gyms}
            value={gymId}
            allowAll={false}
            onChange={(id) => {
              if (!id) return
              setGymId(id)
              setBarId(null)
            }}
          />
        )}
        {gym.bars.length > 1 && (
          <div role="group" aria-label="Barre" className="flex flex-wrap gap-2">
            {gym.bars.map((b) => (
              <Chip key={b.id} selected={b.id === bar?.id} onClick={() => setBarId(b.id)}>
                {b.name} · {formatKg(b.kg)}
              </Chip>
            ))}
          </div>
        )}

        <section className="flex flex-col gap-2 rounded-3xl bg-surface p-4">
          <p className="text-sm text-muted">
            Charge totale voulue
            {bar ? `, ${bar.name.toLowerCase()} de ${formatKg(bar.kg)} comprise` : ''}
          </p>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className={big}
              aria-label={`Moins ${formatNumber(step)} kg`}
              onClick={() => setTarget(Math.max(0, round2(target - step)))}
            >
              <Minus size={28} aria-hidden />
            </button>
            <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
              <input
                key={target}
                defaultValue={formatNumber(target)}
                inputMode="decimal"
                aria-label="Charge totale voulue"
                onBlur={(e) => {
                  const kg = parseDecimal(e.target.value)
                  if (kg !== null) setTarget(round2(kg))
                  else e.target.value = formatNumber(target)
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full min-w-0 bg-transparent text-center text-6xl font-extrabold tabular-nums outline-none"
              />
              <span className="text-xl text-muted">kg</span>
            </label>
            <button
              type="button"
              className={big}
              aria-label={`Plus ${formatNumber(step)} kg`}
              onClick={() => setTarget(round2(target + step))}
            >
              <Plus size={28} aria-hidden />
            </button>
          </div>
        </section>

        {!bar ? (
          <p className="text-muted">Ajoute une barre à cette salle dans Profil → Mes salles.</p>
        ) : !below ? (
          <p className="rounded-3xl bg-surface p-4 text-muted">
            C’est moins que la barre ({formatKg(bar.kg)}).
          </p>
        ) : below.exact ? (
          <section className="rounded-3xl bg-surface p-4">
            <PlateStack perSide={below.perSide} />
          </section>
        ) : (
          <>
            <p className="px-1 text-sm text-muted">
              {formatKg(target)} n’est pas réalisable avec les disques de {gym.name}. Au plus proche
              :
            </p>
            {[below, above].map(
              (load, i) =>
                load && (
                  <section key={i} className="flex flex-col gap-2 rounded-3xl bg-surface p-4">
                    <p className="text-sm text-muted">
                      {i === 0 ? 'En dessous' : 'Au-dessus'} :{' '}
                      <span className="font-bold text-text">{formatKg(load.totalKg)}</span>
                    </p>
                    <PlateStack perSide={load.perSide} />
                  </section>
                ),
            )}
          </>
        )}
        <p className="px-1 text-xs text-muted">
          Disques et barres de chaque salle : Profil → Mes salles.
        </p>
      </div>
    </>
  )
}
