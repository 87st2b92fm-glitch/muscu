import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, MoreHorizontal, Pencil, Play, Repeat } from 'lucide-react'
import Button from '../../components/Button'
import type { FolderSummary, TemplateSummary } from './demoTemplates'

function TemplateCard({
  template,
  isNext,
  onStart,
  editable,
}: {
  template: TemplateSummary
  isNext: boolean
  onStart?: () => void
  editable: boolean
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-lg font-bold">{template.name}</h3>
        {isNext && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
            Prochaine
          </span>
        )}
        {editable && <Pencil size={18} className="shrink-0 text-muted" aria-hidden />}
      </div>
      <p className="mt-1 line-clamp-2 text-[15px] text-muted">
        {template.exercises.length > 0
          ? template.exercises.join(', ')
          : 'Aucun exercice : touche pour en ajouter.'}
      </p>
    </>
  )

  return (
    <article className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
      {editable ? (
        <Link
          to={`/modeles/${template.id}`}
          aria-label={`Modifier ${template.name}`}
          className="-m-1 rounded-2xl p-1 active:bg-surface-2"
        >
          {body}
        </Link>
      ) : (
        <div>{body}</div>
      )}
      <Button
        variant={isNext ? 'primary' : 'secondary'}
        onClick={onStart}
        disabled={!onStart || template.exercises.length === 0}
      >
        <Play size={18} aria-hidden />
        Commencer
      </Button>
    </article>
  )
}

export default function TemplateFolder({
  folder,
  onStart,
  onMenu,
}: {
  folder: FolderSummary
  /** Absent pour les modèles d'exemple. */
  onStart?: (templateId: string) => void
  /** Options du dossier ; absent pour les exemples et les modèles hors dossier. */
  onMenu?: () => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left font-semibold text-muted"
        >
          <ChevronDown
            size={20}
            className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
            aria-hidden
          />
          <span className="truncate">{folder.name}</span>
          <span className="font-normal">({folder.templates.length})</span>
          {folder.isProgram && (
            <Repeat size={16} className="shrink-0 text-accent" aria-label="Programme" />
          )}
        </button>
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            aria-label={`Options du dossier ${folder.name}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface"
          >
            <MoreHorizontal size={22} aria-hidden />
          </button>
        )}
      </div>
      {open &&
        folder.templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            isNext={t.id === folder.nextTemplateId}
            onStart={onStart && (() => onStart(t.id))}
            editable={onStart !== undefined}
          />
        ))}
      {open && folder.templates.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted">
          Dossier vide : crée un modèle puis range-le ici.
        </p>
      )}
    </section>
  )
}
