import { useEffect, useRef, type ReactNode } from 'react'

/** Feuille modale qui monte du bas de l'écran, fermée par le fond, Échap ou onClose. */
export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="flex max-h-[85dvh] flex-col rounded-t-[28px] bg-surface px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <h2 className="mb-3 shrink-0 px-1 text-lg font-bold">{title}</h2>
        <div className="-mx-4 min-h-0 overflow-y-auto px-4">{children}</div>
      </div>
    </dialog>
  )
}
