import { createContext, useContext } from 'react'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  /** Action destructrice : bouton rouge. */
  danger?: boolean
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<Confirm>(async () => false)

/**
 * Confirmation dans une feuille de l'app (et non `window.confirm`, que certains navigateurs
 * intégrés bloquent) : `if (!(await confirm({ title: '…' }))) return`.
 */
export function useConfirm(): Confirm {
  return useContext(ConfirmContext)
}
