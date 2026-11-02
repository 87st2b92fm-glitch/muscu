import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { niceTicks } from '../../domain/progress'
import { useWidth } from './useWidth'

export interface ChartPoint {
  /** Horodatage (ms) : l'axe horizontal est proportionnel au temps. */
  x: number
  y: number
}

const HEIGHT = 200
const MARGIN = { top: 12, right: 12, bottom: 24, left: 44 }
const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/**
 * Courbe d'une seule série dans le temps : ligne de 2 px, voile à 10 %, point final cerclé,
 * grille discrète. Réticule et infobulle au toucher, au survol et au clavier (flèches).
 */
export default function LineChart({
  points,
  formatValue,
  label,
}: {
  points: readonly ChartPoint[]
  formatValue: (value: number) => string
  /** Nom du graphique pour les lecteurs d'écran. */
  label: string
}) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const ys = points.map((p) => p.y)
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys))
  const yMin = ticks[0]!
  const yMax = ticks[ticks.length - 1]!
  const xMin = points[0]?.x ?? 0
  const xMax = points[points.length - 1]?.x ?? 1
  const innerW = Math.max(1, width - MARGIN.left - MARGIN.right)
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
  const sx = (x: number) =>
    MARGIN.left + (xMax === xMin ? innerW / 2 : ((x - xMin) / (xMax - xMin)) * innerW)
  const sy = (y: number) => MARGIN.top + innerH - ((y - yMin) / (yMax - yMin || 1)) * innerH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x)},${sy(p.y)}`).join(' ')
  const base = MARGIN.top + innerH
  const area = points.length > 1 ? `${line} L${sx(xMax)},${base} L${sx(xMin)},${base} Z` : ''
  const xLabels = xMax === xMin ? [xMin] : [xMin, xMin + (xMax - xMin) / 2, xMax]
  const last = points[points.length - 1]
  const shown = active !== null ? points[active] : undefined

  function nearest(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left + MARGIN.left
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(sx(p.x) - x) < Math.abs(sx(points[best]!.x) - x)) best = i
    })
    setActive(best)
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const from = active ?? points.length - 1
    setActive(
      Math.min(points.length - 1, Math.max(0, from + (event.key === 'ArrowRight' ? 1 : -1))),
    )
  }

  return (
    <div
      ref={ref}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-accent"
      tabIndex={0}
      role="img"
      aria-label={`${label}. Dernière valeur : ${last ? formatValue(last.y) : 'aucune'}. Flèches gauche et droite pour parcourir.`}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
    >
      {width > 0 && points.length > 0 && (
        <svg width={width} height={HEIGHT} className="block touch-pan-y select-none">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={sy(t)}
                y2={sy(t)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={sy(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted text-[11px] tabular-nums"
              >
                {formatValue(t)}
              </text>
            </g>
          ))}
          {xLabels.map((x, i) => (
            <text
              key={x}
              x={sx(x)}
              y={HEIGHT - 6}
              textAnchor={
                xLabels.length === 1
                  ? 'middle'
                  : i === 0
                    ? 'start'
                    : i === xLabels.length - 1
                      ? 'end'
                      : 'middle'
              }
              className="fill-muted text-[11px]"
            >
              {monthFormatter.format(x)}
            </text>
          ))}
          {area && <path d={area} className="fill-accent/10" />}
          <path
            d={line}
            fill="none"
            className="stroke-accent"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {last && (
            <circle
              cx={sx(last.x)}
              cy={sy(last.y)}
              r={4}
              className="fill-accent stroke-surface"
              strokeWidth={2}
            />
          )}
          {shown && (
            <>
              <line
                x1={sx(shown.x)}
                x2={sx(shown.x)}
                y1={MARGIN.top}
                y2={base}
                className="stroke-muted"
                strokeWidth={1}
              />
              <circle
                cx={sx(shown.x)}
                cy={sy(shown.y)}
                r={5}
                className="fill-accent stroke-surface"
                strokeWidth={2}
              />
            </>
          )}
          <rect
            x={MARGIN.left}
            y={0}
            width={innerW}
            height={HEIGHT}
            fill="transparent"
            onPointerMove={nearest}
            onPointerDown={nearest}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
          />
        </svg>
      )}
      {shown && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl border border-border bg-surface-2 px-3 py-1.5 shadow-lg"
          style={{
            left: Math.min(Math.max(sx(shown.x) - 60, 0), Math.max(0, width - 120)),
          }}
        >
          <p className="font-bold tabular-nums">{formatValue(shown.y)}</p>
          <p className="text-xs text-muted">{dayFormatter.format(shown.x)}</p>
        </div>
      )}
    </div>
  )
}
