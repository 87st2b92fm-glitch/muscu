import { useState } from 'react'
import { Link } from 'react-router'
import { HardDriveDownload } from 'lucide-react'
import { backupDue } from '../../backup/backup'
import { useProfile } from '../../db/hooks'

/** Bandeau de rappel quand il y a des séances et aucune sauvegarde depuis 14 jours. */
export default function BackupReminder({ hasWorkouts }: { hasWorkouts: boolean }) {
  const profile = useProfile()
  const [now] = useState(() => Date.now())
  if (!profile || !backupDue(profile.lastBackupAt, now, hasWorkouts)) return null

  const days =
    profile.lastBackupAt === null ? null : Math.floor((now - profile.lastBackupAt) / 86_400_000)
  return (
    <Link
      to="/sauvegarde"
      className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-gold active:opacity-80"
    >
      <HardDriveDownload size={20} className="shrink-0" aria-hidden />
      <span className="flex-1">
        {days === null
          ? 'Tu n’as jamais sauvegardé tes données.'
          : `Dernière sauvegarde il y a ${days} jours.`}{' '}
        <span className="font-semibold underline">Sauvegarder maintenant</span>
      </span>
    </Link>
  )
}
