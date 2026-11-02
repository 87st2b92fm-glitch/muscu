import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({
  title,
  action,
  back = false,
}: {
  title: string
  action?: ReactNode
  back?: boolean
}) {
  const navigate = useNavigate()

  return (
    <header className="px-4 pt-4 pb-4">
      {back && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-2 flex min-h-11 items-center gap-0.5 pr-3 font-medium text-accent"
        >
          <ChevronLeft size={24} aria-hidden />
          Retour
        </button>
      )}
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">{title}</h1>
        {action}
      </div>
    </header>
  )
}
