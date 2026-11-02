import { Library } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'

export default function ExercisesPage() {
  return (
    <>
      <PageHeader title="Exercices" back />
      <EmptyState
        icon={Library}
        title="Bibliothèque bientôt prête"
        text="Les ~80 exercices préremplis arrivent avec la base de données."
      />
    </>
  )
}
