import type { ReactNode } from 'react'

export default function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  )
}
