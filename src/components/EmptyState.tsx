import type { LucideIcon } from 'lucide-react'

export default function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon
  title: string
  text: string
}) {
  return (
    <div className="bg-surface mx-4 flex flex-col items-center gap-3 rounded-3xl px-8 py-12 text-center">
      <span className="bg-surface-2 flex size-16 items-center justify-center rounded-full">
        <Icon size={30} className="text-accent" aria-hidden />
      </span>
      <p className="text-lg font-bold">{title}</p>
      <p className="text-muted text-[15px]">{text}</p>
    </div>
  )
}
