import { ChartLine } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'

export default function PerformancePage() {
  return (
    <>
      <PageHeader title="Performance" />
      <EmptyState
        icon={ChartLine}
        title="Pas encore de records"
        text="Records, graphiques et carte du corps apparaîtront après tes premières séances."
      />
    </>
  )
}
