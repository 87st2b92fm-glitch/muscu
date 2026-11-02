import { useEffect } from 'react'

/**
 * Garde l'écran allumé pendant la séance (Wake Lock API, si Safari la propose). iOS relâche le
 * verrou quand l'app passe en arrière-plan : on le redemande au retour.
 */
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    async function acquire() {
      if (document.visibilityState !== 'visible') return
      try {
        sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) void sentinel.release()
      } catch {
        // Refusé (économie d'énergie, navigateur) : l'app fonctionne sans.
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void sentinel?.release()
    }
  }, [])
}
