import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ImagePlus, Plus, Star, Trash2 } from 'lucide-react'
import Button from '../../components/Button'
import GymBadge from '../../components/GymBadge'
import PageHeader from '../../components/PageHeader'
import { FormSection, NumberField, Stepper, TextField } from '../../components/form'
import { db, newId } from '../../db/db'
import { deleteGym, GYM_COLORS, gymDeletionBlocker, updateGym } from '../../db/gyms'
import { updateProfile, useProfile } from '../../db/hooks'
import type { Bar } from '../../db/types'
import type { PlateStock } from '../../domain/plates'
import { logoFromFile } from './logo'

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2'

export default function GymEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const gym = useLiveQuery(() => db.gyms.get(id), [id])
  const profile = useProfile()
  const [message, setMessage] = useState<string | null>(null)

  if (gym === undefined) return <PageHeader title="Salle" back />

  const isDefault = profile?.defaultGymId === gym.id
  const sortPlates = (plates: PlateStock[]) => [...plates].sort((a, b) => b.kg - a.kg)
  const setPlates = (plates: PlateStock[]) => updateGym(gym.id, { plates })
  const setBars = (bars: Bar[]) => updateGym(gym.id, { bars })

  async function onLogo(file: File | undefined) {
    if (!file) return
    try {
      await updateGym(gym!.id, { logo: await logoFromFile(file) })
    } catch {
      setMessage('Image illisible : essaie une capture d’écran du logo en PNG ou JPEG.')
    }
  }

  async function remove() {
    const blocker = await gymDeletionBlocker(gym!.id)
    if (blocker) {
      setMessage(blocker)
      return
    }
    if (!window.confirm(`Supprimer la salle « ${gym!.name} » ?`)) return
    await deleteGym(gym!.id)
    navigate('/salles', { replace: true })
  }

  return (
    <>
      <PageHeader title={gym.name} back />
      <div className="flex flex-col gap-6 px-4">
        <FormSection title="Identité">
          <div className="flex items-center gap-4">
            <GymBadge gym={gym} size="lg" />
            <div className="flex flex-1 flex-col gap-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-accent">
                <ImagePlus size={20} aria-hidden />
                {gym.logo ? 'Changer le logo' : 'Ajouter un logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    void onLogo(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              {gym.logo && (
                <button
                  type="button"
                  onClick={() => updateGym(gym.id, { logo: undefined })}
                  className="flex min-h-11 items-center gap-2 font-semibold text-muted"
                >
                  <Trash2 size={18} aria-hidden />
                  Retirer le logo
                </button>
              )}
            </div>
          </div>
          {!gym.logo && (
            <div
              role="radiogroup"
              aria-label="Couleur de la pastille"
              className="flex flex-wrap gap-2"
            >
              {GYM_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={gym.color === color}
                  aria-label={`Couleur ${color}`}
                  onClick={() => updateGym(gym.id, { color })}
                  className="flex size-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  {gym.color === color && (
                    <Check size={20} strokeWidth={3} className="text-white" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          )}
          <TextField
            label="Nom"
            value={gym.name}
            required
            onCommit={(name) => updateGym(gym.id, { name })}
          />
          {isDefault ? (
            <p className="flex min-h-11 items-center gap-2 font-semibold text-accent">
              <Star size={20} fill="currentColor" aria-hidden />
              Salle par défaut
            </p>
          ) : (
            <Button variant="secondary" onClick={() => updateProfile({ defaultGymId: gym.id })}>
              <Star size={20} aria-hidden />
              Définir comme salle par défaut
            </Button>
          )}
        </FormSection>

        <FormSection title="Barres" hint="Utilisées par le calculateur de disques.">
          {gym.bars.map((bar, i) => (
            <div key={bar.id} className="flex items-end gap-2">
              <div className="flex-[3]">
                <TextField
                  label="Nom"
                  value={bar.name}
                  required
                  onCommit={(name) =>
                    setBars(gym.bars.map((b, j) => (j === i ? { ...b, name } : b)))
                  }
                />
              </div>
              <div className="flex-[2]">
                <NumberField
                  label="Poids"
                  suffix="kg"
                  value={bar.kg}
                  allowEmpty={false}
                  onCommit={(kg) =>
                    setBars(gym.bars.map((b, j) => (j === i ? { ...b, kg: kg ?? b.kg } : b)))
                  }
                />
              </div>
              <button
                type="button"
                className={iconButton}
                aria-label={`Supprimer ${bar.name}`}
                onClick={() => setBars(gym.bars.filter((_, j) => j !== i))}
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() => setBars([...gym.bars, { id: newId(), name: 'Barre', kg: 10 }])}
          >
            <Plus size={20} aria-hidden />
            Ajouter une barre
          </Button>
        </FormSection>

        <FormSection title="Disques" hint="Nombre de paires disponibles pour chaque poids.">
          <p className="-mb-2 flex justify-between pr-[5.5rem] text-sm font-semibold text-muted">
            <span>Poids</span>
            <span>Paires</span>
          </p>
          {gym.plates.map((plate, i) => (
            <div key={`${plate.kg}-${i}`} className="flex items-center gap-2">
              <div className="flex-1">
                <NumberField
                  label={`Poids du disque ${i + 1}`}
                  hideLabel
                  suffix="kg"
                  value={plate.kg}
                  allowEmpty={false}
                  onCommit={(kg) =>
                    setPlates(
                      sortPlates(
                        gym.plates.map((p, j) => (j === i ? { ...p, kg: kg ?? p.kg } : p)),
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Stepper
                  label={`Paires de ${plate.kg} kg`}
                  value={plate.pairs}
                  min={1}
                  onChange={(pairs) =>
                    setPlates(gym.plates.map((p, j) => (j === i ? { ...p, pairs } : p)))
                  }
                />
              </div>
              <button
                type="button"
                className={iconButton}
                aria-label={`Supprimer les disques de ${plate.kg} kg`}
                onClick={() => setPlates(gym.plates.filter((_, j) => j !== i))}
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() => setPlates(sortPlates([...gym.plates, { kg: 0.5, pairs: 2 }]))}
          >
            <Plus size={20} aria-hidden />
            Ajouter un disque
          </Button>
        </FormSection>

        <FormSection title="Haltères">
          <NumberField
            label="Écart entre deux haltères"
            suffix="kg"
            placeholder="ex. 2"
            value={gym.dumbbellIncrementKg}
            hint="Sert à suggérer la charge suivante pour les exercices aux haltères."
            onCommit={(dumbbellIncrementKg) => updateGym(gym.id, { dumbbellIncrementKg })}
          />
        </FormSection>

        {message && (
          <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold">{message}</p>
        )}
        <Button variant="ghost" className="text-muted" onClick={() => void remove()}>
          <Trash2 size={18} aria-hidden />
          Supprimer la salle
        </Button>
      </div>
    </>
  )
}
