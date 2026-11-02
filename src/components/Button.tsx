import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-contrast',
  secondary: 'bg-surface-2 text-text',
  ghost: 'text-accent',
}

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold transition-[transform,opacity] active:scale-[0.98] active:opacity-80 disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
