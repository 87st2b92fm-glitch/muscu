import { useState } from 'react'
import { ChevronDown, Play } from 'lucide-react'
import Button from '../../components/Button'
import type { FolderSummary, TemplateSummary } from './demoTemplates'

function TemplateCard({ template, isNext }: { template: TemplateSummary; isNext: boolean }) {
  return (
    <article className="bg-surface flex flex-col gap-3 rounded-3xl p-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">{template.name}</h3>
          {isNext && (
            <span className="bg-accent/15 text-accent rounded-full px-2 py-0.5 text-xs font-semibold">
              Prochaine
            </span>
          )}
        </div>
        <p className="text-muted mt-1 line-clamp-2 text-[15px]">{template.exercises.join(', ')}</p>
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
        className="text-muted flex min-h-11 items-center gap-2 text-left font-semibold"
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
