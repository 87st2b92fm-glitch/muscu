import type { GymLook } from '../data/defaultGyms'

const SIZES = {
  sm: 'size-6 rounded-md text-[11px]',
  md: 'size-10 rounded-xl text-base',
  lg: 'size-20 rounded-3xl text-3xl',
} as const

/** Logo de la salle, ou pastille colorée avec l'initiale. */
export default function GymBadge({
  gym,
  size = 'md',
}: {
  gym: GymLook
  size?: keyof typeof SIZES
}) {
  if (gym.logo) {
    return <img src={gym.logo} alt="" className={`${SIZES[size]} shrink-0 object-cover`} />
  }
  return (
    <span
      aria-hidden
      className={`${SIZES[size]} flex shrink-0 items-center justify-center font-bold text-white`}
      style={{ backgroundColor: gym.color }}
    >
      {gym.name.charAt(0).toUpperCase()}
    </span>
  )
}
