import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Building2,
  Check,
  ChevronRight,
  FileUp,
  HardDriveDownload,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Segmented from '../../components/Segmented'
import { NumberField, Toggle } from '../../components/form'
import { ACCENTS, useAppearance, type Theme } from '../../app/theme'
import { requestPersistentStorage } from '../../db/db'
import { updateProfile, useProfile } from '../../db/hooks'
import type { Sex } from '../../db/types'
import BodyweightSection from './BodyweightSection'

const THEMES: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'light', label: 'Clair', icon: Sun },
]

const SEXES: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-sm font-semibold text-muted">{title}</h2>
      <div className="flex flex-col gap-5 rounded-3xl bg-surface p-4">{children}</div>
    </section>
  )
}

function StorageStatus() {
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    void requestPersistentStorage().then(setPersisted)
  }, [])

  if (persisted === null) return null
  const Icon = persisted ? ShieldCheck : ShieldAlert
  return (
    <div className="flex items-start gap-3">
      <Icon
        size={22}
        className={`mt-0.5 shrink-0 ${persisted ? 'text-accent' : 'text-gold'}`}
        aria-hidden
      />
      <div>
        <p className="font-semibold">{persisted ? 'Données protégées' : 'Données non protégées'}</p>
        <p className="text-sm text-muted">
          {persisted
            ? 'iOS ne supprimera pas tes données pour libérer de la place.'
            : 'iOS peut effacer les données d’un site peu utilisé. Installe l’app sur l’écran d’accueil et fais des sauvegardes régulières.'}
        </p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { theme, setTheme, accent, setAccent } = useAppearance()
  const profile = useProfile()

  return (
    <>
      <PageHeader title="Profil" />
      <div className="flex flex-col gap-6 px-4">
        <Section title="Moi">
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Sexe</p>
            <Segmented
              label="Sexe"
              options={SEXES}
              value={profile?.sex ?? null}
              onChange={(sex) => void updateProfile({ sex })}
            />
            <p className="text-sm text-muted">Utilisé uniquement pour les niveaux de force.</p>
          </div>
          <BodyweightSection />
        </Section>

        <Section title="Séance">
          <Toggle
            label="Son de fin de repos"
            hint="Trois bips quand le repos est terminé (app ouverte)."
            checked={profile?.restSoundEnabled ?? true}
            onChange={(restSoundEnabled) => void updateProfile({ restSoundEnabled })}
          />
          <Toggle
            label="Saisir le RIR"
            hint="Reps en réserve : masque la colonne si tu ne t’en sers pas."
            checked={profile?.rirEnabled ?? true}
            onChange={(rirEnabled) => void updateProfile({ rirEnabled })}
          />
          {profile && (
            <NumberField
              label="Repos par défaut"
              suffix="s"
              integer
              allowEmpty={false}
              value={profile.defaultRestSec}
              hint="Réglable aussi exercice par exercice."
              onCommit={(defaultRestSec) =>
                defaultRestSec !== null && void updateProfile({ defaultRestSec })
              }
            />
          )}
        </Section>

        <Section title="Salles">
          <Link to="/salles" className="-my-2 flex min-h-12 items-center gap-3 font-semibold">
            <Building2 size={22} className="text-accent" aria-hidden />
            <span className="flex-1">Mes salles</span>
            <ChevronRight size={20} className="text-muted" aria-hidden />
          </Link>
        </Section>

        <Section title="Apparence">
          <Segmented label="Thème" options={THEMES} value={theme} onChange={setTheme} />
          <div>
            <p className="mb-3 font-semibold">Couleur d’accent</p>
            <div
              role="radiogroup"
              aria-label="Couleur d’accent"
              className="grid grid-cols-5 justify-items-center gap-y-3"
            >
              {ACCENTS.map(({ value, label, swatch, light }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={accent === value}
                  aria-label={label}
                  onClick={() => setAccent(value)}
                  className="flex size-12 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-shadow aria-checked:ring-2 aria-checked:ring-text"
                  style={{ backgroundColor: swatch }}
                >
                  {accent === value && (
                    <Check
                      size={22}
                      strokeWidth={3}
                      className={light ? 'text-white' : 'text-black/80'}
                      aria-hidden
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Données">
          <Link to="/sauvegarde" className="-my-2 flex min-h-12 items-center gap-3 font-semibold">
            <HardDriveDownload size={22} className="text-accent" aria-hidden />
            <span className="flex-1">Sauvegarde</span>
            <ChevronRight size={20} className="text-muted" aria-hidden />
          </Link>
          <Link to="/import-hevy" className="-my-2 flex min-h-12 items-center gap-3 font-semibold">
            <FileUp size={22} className="text-accent" aria-hidden />
            <span className="flex-1">Importer depuis Hevy</span>
            <ChevronRight size={20} className="text-muted" aria-hidden />
          </Link>
          <StorageStatus />
        </Section>
      </div>
    </>
  )
}
