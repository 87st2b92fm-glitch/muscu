import { Outlet } from 'react-router'
import TabBar from '../components/TabBar'

export default function Layout() {
  return (
    <div className="flex h-dvh flex-col">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
