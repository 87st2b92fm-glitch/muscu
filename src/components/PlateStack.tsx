import { formatNumber } from '../domain/format'

// Couleurs usuelles des disques de compétition (repères visuels, la valeur est toujours écrite).
const PLATE_LOOK: { min: number; color: string; height: number; width: number }[] = [
  { min: 25, color: '#d32f2f', height: 100, width: 18 },
  { min: 20, color: '#1e5bd8', height: 100, width: 16 },
  { min: 15, color: '#e6b800', height: 100, width: 14 },
  { min: 10, color: '#2e9d4f', height: 100, width: 12 },
  { min: 5, color: '#e5e7eb', height: 62, width: 10 },
  { min: 2.5, color: '#d32f2f', height: 48, width: 8 },
  { min: 0, color: '#9ca3af', height: 38, width: 6 },
]

const look = (kg: number) =>
  PLATE_LOOK.find((p) => kg >= p.min) ?? PLATE_LOOK[PLATE_LOOK.length - 1]!

/** Un côté de la barre, du collier vers l'extérieur, avec la liste des disques en clair. */
export default function PlateStack({ perSide }: { perSide: readonly number[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-20 items-center" aria-hidden>
        <span className="h-3 w-6 rounded-l-sm bg-muted/60" />
        <span className="h-6 w-2 bg-muted" />
        {perSide.map((kg, i) => {
          const { color, height, width } = look(kg)
          return (
            <span
              key={i}
              className="ml-0.5 rounded-sm"
              style={{ backgroundColor: color, height: `${height}%`, width }}
            />
          )
        })}
        <span className="ml-0.5 h-3 flex-1 rounded-r-sm bg-muted/60" />
      </div>
      <p className="font-semibold tabular-nums">
        {perSide.length > 0
          ? `Par côté : ${perSide.map(formatNumber).join(' + ')} kg`
          : 'Barre seule'}
      </p>
    </div>
  )
}
