import { Navigate, Route, Routes } from 'react-router'
import Layout from './app/Layout'
import HomePage from './features/home/HomePage'
import TrainingPage from './features/training/TrainingPage'
import PerformancePage from './features/performance/PerformancePage'
import ExercisesPage from './features/exercises/ExercisesPage'
import ExerciseEditPage from './features/exercises/ExerciseEditPage'
import ProfilePage from './features/profile/ProfilePage'
import ImportHevyPage from './features/import/ImportHevyPage'
import GymsPage from './features/gyms/GymsPage'
import WorkoutPage from './features/workout/WorkoutPage'
import TemplateEditPage from './features/templates/TemplateEditPage'
import WorkoutDetailPage from './features/history/WorkoutDetailPage'
import WorkoutDonePage from './features/workout/WorkoutDonePage'
import GymEditPage from './features/gyms/GymEditPage'

export default function App() {
  return (
    <Routes>
      {/* Séance en plein écran, sans barre d'onglets. */}
      <Route path="seance" element={<WorkoutPage />} />
      <Route path="seance/bilan/:id" element={<WorkoutDonePage />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="entrainement" element={<TrainingPage />} />
        <Route path="exercices" element={<ExercisesPage />} />
        <Route path="exercices/:id" element={<ExerciseEditPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="import-hevy" element={<ImportHevyPage />} />
        <Route path="modeles/:id" element={<TemplateEditPage />} />
        <Route path="seances/:id" element={<WorkoutDetailPage />} />
        <Route path="salles" element={<GymsPage />} />
        <Route path="salles/:id" element={<GymEditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
