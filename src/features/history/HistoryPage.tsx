import { History } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="Historique" />
      <EmptyState
        icon={History}
        title="Aucune séance"
        text="Tes séances terminées apparaîtront ici."
      />
    </>
  )
}
