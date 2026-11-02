import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import TabBar from '../components/TabBar'

export default function Layout() {
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  // Le défilement se fait dans <main> : on le remet en haut à chaque changement d'écran.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex h-dvh flex-col">
      {/* Fond opaque sous la barre d'état : le contenu défile dessous sans se mélanger à l'heure. */}
      <div className="bg-bg fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)]" aria-hidden />
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+6.5rem)]"
      >
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
