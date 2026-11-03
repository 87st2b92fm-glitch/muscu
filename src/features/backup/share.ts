/**
 * Propose un fichier à l'utilisateur : feuille de partage iOS (Enregistrer dans Fichiers, AirDrop…)
 * si le navigateur sait partager des fichiers, sinon téléchargement classique.
 * Renvoie false si l'utilisateur a annulé le partage.
 */
export async function shareFile(content: string, filename: string, type: string): Promise<boolean> {
  const file = new File([content], filename, { type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false
      // Partage refusé par le navigateur : on retombe sur le téléchargement.
    }
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return true
}

/** « muscu-sauvegarde-2026-11-03.json » */
export function datedName(prefix: string, extension: string, now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${prefix}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.${extension}`
}
