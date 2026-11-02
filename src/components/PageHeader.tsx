import type { ReactNode } from 'react'

export default function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="bg-bg/90 sticky top-0 z-10 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {action}
      </div>
    </header>
  )
}
