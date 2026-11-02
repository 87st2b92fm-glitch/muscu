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
    <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
      <Icon size={40} className="text-muted" aria-hidden />
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted text-sm">{text}</p>
    </div>
  )
}
