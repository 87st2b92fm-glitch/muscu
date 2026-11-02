import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { db, newId } from '../../db/db'
import { useBodyweights } from '../../db/hooks'
import { formatKg } from '../../domain/format'
import { parseDecimal } from '../../domain/units'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const VISIBLE = 5

export default function BodyweightSection() {
  const entries = useBodyweights()
  const [open, setOpen] = useState(false)
  const [kgInput, setKgInput] = useState('')
  const [dateInput, setDateInput] = useState(today)

  const kg = parseDecimal(kgInput)
  const latest = entries?.[0]

  async function save() {
    if (kg === null || !dateInput) return
    // Midi local : la pesée reste sur le bon jour quel que soit le fuseau.
    await db.bodyweights.add({ id: newId(), at: new Date(`${dateInput}T12:00`).getTime(), kg })
    setOpen(false)
    setKgInput('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Poids de corps</p>
          <p className="text-sm text-muted">
            {latest
              ? `${formatKg(latest.kg)} · ${dateFormatter.format(latest.at)}`
              : 'Aucune pesée : nécessaire pour les tractions lestées et les niveaux'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDateInput(today())
            setOpen(true)
          }}
          aria-label="Ajouter une pesée"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast active:opacity-80"
        >
          <Plus size={22} strokeWidth={2.5} aria-hidden />
        </button>
      </div>

      {entries && entries.length > 1 && (
        <ul className="flex flex-col">
          {entries.slice(0, VISIBLE).map((entry) => (
            <li
              key={entry.id}
              className="flex min-h-11 items-center justify-between gap-3 text-[15px]"
            >
              <span className="text-muted">{dateFormatter.format(entry.at)}</span>
              <span className="flex items-center gap-1 font-medium tabular-nums">
                {formatKg(entry.kg)}
                <button
                  type="button"
                  onClick={() => db.bodyweights.delete(entry.id)}
                  aria-label={`Supprimer la pesée du ${dateFormatter.format(entry.at)}`}
                  className="flex size-11 items-center justify-center text-muted active:text-text"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Nouvelle pesée">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Poids (kg)</span>
            <input
              inputMode="decimal"
              value={kgInput}
              onChange={(e) => setKgInput(e.target.value)}
              placeholder="64,5"
              className="min-h-14 rounded-2xl bg-surface-2 px-4 text-2xl font-bold tabular-nums outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Date</span>
            <input
              type="date"
              value={dateInput}
              max={today()}
              onChange={(e) => setDateInput(e.target.value)}
              className="min-h-12 rounded-2xl bg-surface-2 px-4 outline-none"
            />
          </label>
          <Button type="submit" disabled={kg === null || !dateInput}>
            Enregistrer
          </Button>
        </form>
      </Sheet>
    </div>
  )
}
