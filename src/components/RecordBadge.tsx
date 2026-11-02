import { Trophy } from 'lucide-react'

import type { RecordKind } from '../domain/types'

const LABELS: Record<RecordKind, string> = {
  weight: 'Record charge',
  volume: 'Record volume',
}

/** Pastille dorée signalant qu'une série bat un record. */
export default function RecordBadge({ kind }: { kind: RecordKind }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-gold">
      <Trophy size={12} strokeWidth={2.5} aria-hidden />
      {LABELS[kind]}
    </span>
  )
}
