import { useState } from 'react'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { db, newId } from '../../db/db'
import { MEASUREMENT_KEYS, type MeasurementKey } from '../../db/types'
import { parseDecimal } from '../../domain/units'

const KEYS = Object.keys(MEASUREMENT_KEYS) as MeasurementKey[]

function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Nouveau relevé : seules les mensurations remplies sont enregistrées. */
export default function AddMeasurementSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [date, setDate] = useState(today)
  const [values, setValues] = useState<Partial<Record<MeasurementKey, string>>>({})

  const parsed = Object.fromEntries(
    KEYS.flatMap((key) => {
      const value = parseDecimal(values[key] ?? '')
      return value === null ? [] : [[key, value]]
    }),
  ) as Partial<Record<MeasurementKey, number>>
  const count = Object.keys(parsed).length

  async function save() {
    if (count === 0 || !date) return
    await db.measurements.add({
      id: newId(),
      at: new Date(`${date}T12:00`).getTime(),
      values: parsed,
    })
    setValues({})
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nouveau relevé">
      <form
        className="flex flex-col gap-4 pb-1"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-muted">Date</span>
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-12 rounded-2xl bg-surface-2 px-4 outline-none"
          />
        </label>
        <p className="text-sm text-muted">
          Remplis seulement ce que tu as mesuré (en cm, masse grasse en %).
        </p>
        <div className="grid grid-cols-2 gap-3">
          {KEYS.map((key) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">{MEASUREMENT_KEYS[key]}</span>
              <input
                inputMode="decimal"
                value={values[key] ?? ''}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                placeholder={key === 'fatPercent' ? '%' : 'cm'}
                className="min-h-12 rounded-2xl bg-surface-2 px-4 font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted focus:ring-2 focus:ring-accent"
              />
            </label>
          ))}
        </div>
        <Button type="submit" disabled={count === 0 || !date}>
          Enregistrer {count > 0 ? `(${count})` : ''}
        </Button>
      </form>
    </Sheet>
  )
}
