import { Navigate, Route, Routes } from 'react-router'
import Layout from './app/Layout'
import HomePage from './features/home/HomePage'
import TrainingPage from './features/training/TrainingPage'
import PerformancePage from './features/performance/PerformancePage'
import ExercisesPage from './features/exercises/ExercisesPage'
import ProfilePage from './features/profile/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="entrainement" element={<TrainingPage />} />
        <Route path="exercices" element={<ExercisesPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
