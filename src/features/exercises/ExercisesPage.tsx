import { Library } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'

export default function ExercisesPage() {
  return (
    <>
      <PageHeader title="Exercices" />
      <EmptyState
        icon={Library}
        title="Bibliothèque vide"
        text="Les exercices préremplis arrivent avec la base de données."
      />
    </>
  )
}
