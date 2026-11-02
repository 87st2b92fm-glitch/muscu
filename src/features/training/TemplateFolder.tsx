import { useState } from 'react'
import { ChevronDown, Play } from 'lucide-react'
import Button from '../../components/Button'
import type { FolderSummary, TemplateSummary } from './demoTemplates'

function TemplateCard({ template, isNext }: { template: TemplateSummary; isNext: boolean }) {
  return (
    <article className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">{template.name}</h3>
          {isNext && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
              Prochaine
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-[15px] text-muted">{template.exercises.join(', ')}</p>
      </div>
      <Button variant={isNext ? 'primary' : 'secondary'}>
        <Play size={18} aria-hidden />
        Commencer
      </Button>
    </article>
  )
}

export default function TemplateFolder({ folder }: { folder: FolderSummary }) {
  const [open, setOpen] = useState(true)

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 text-left font-semibold text-muted"
      >
        <ChevronDown
          size={20}
          className={`transition-transform ${open ? '' : '-rotate-90'}`}
          aria-hidden
        />
        {folder.name}
        <span className="font-normal">({folder.templates.length})</span>
      </button>
      {open &&
        folder.templates.map((t) => (
          <TemplateCard key={t.id} template={t} isNext={t.id === folder.nextTemplateId} />
        ))}
    </section>
  )
}
