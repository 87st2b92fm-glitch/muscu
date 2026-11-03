import { useCallback, useState, type ReactNode } from 'react'
import Button from './Button'
import Sheet from './Sheet'
import { ConfirmContext, type ConfirmOptions } from './confirmContext'

interface Pending extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

/** Fournit `useConfirm()` à toute l'app et affiche la feuille de confirmation. */
export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  function answer(confirmed: boolean) {
    pending?.resolve(confirmed)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Sheet open={pending !== null} onClose={() => answer(false)} title={pending?.title ?? ''}>
        {pending && (
          <div className="flex flex-col gap-4 pb-1">
            {pending.message && <p className="text-[15px] text-muted">{pending.message}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => answer(false)}>
                Annuler
              </Button>
              <Button variant={pending.danger ? 'danger' : 'primary'} onClick={() => answer(true)}>
                {pending.confirmLabel ?? 'Confirmer'}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </ConfirmContext.Provider>
  )
}
