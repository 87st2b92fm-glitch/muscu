import { Navigate, Route, Routes } from 'react-router'
import Layout from './app/Layout'
import WorkoutPage from './features/workout/WorkoutPage'
import HistoryPage from './features/history/HistoryPage'
import PerformancePage from './features/performance/PerformancePage'
import ExercisesPage from './features/exercises/ExercisesPage'
import ProfilePage from './features/profile/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<WorkoutPage />} />
        <Route path="historique" element={<HistoryPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="exercices" element={<ExercisesPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
