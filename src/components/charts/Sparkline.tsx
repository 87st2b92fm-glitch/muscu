/** Mini-courbe de tendance : trait discret, dernier point en couleur d'accent. */
export default function Sparkline({
  values,
  width = 72,
  height = 28,
}: {
  values: readonly number[]
  width?: number
  height?: number
}) {
  if (values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = 4
  const x = (i: number) =>
    values.length === 1 ? width / 2 : pad + (i / (values.length - 1)) * (width - 2 * pad)
  const y = (v: number) =>
    max === min ? height / 2 : pad + (1 - (v - min) / (max - min)) * (height - 2 * pad)
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  const last = values.length - 1
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      <path
        d={path}
        fill="none"
        className="stroke-muted"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(last)}
        cy={y(values[last]!)}
        r={3.5}
        className="fill-accent stroke-surface"
        strokeWidth={2}
      />
    </svg>
  )
}
