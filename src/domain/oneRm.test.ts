import { describe, expect, it } from 'vitest'
import { epley, estimateOneRm } from './oneRm'

describe('epley', () => {
  it('applique charge × (1 + reps / 30)', () => {
    expect(epley(100, 10)).toBeCloseTo(133.33, 2)
    expect(epley(80, 5)).toBeCloseTo(93.33, 2)
  })

  it('renvoie la charge pour une seule rep', () => {
    expect(epley(140, 1)).toBe(140)
  })
})

describe('estimateOneRm', () => {
  it('estime une série normale de 1 à 10 reps', () => {
    expect(estimateOneRm({ type: 'normal', kg: 90, reps: 3 })).toBe(99)
  })

  it('compte aussi les séries dégressives et à l’échec', () => {
    expect(estimateOneRm({ type: 'drop', kg: 60, reps: 6 })).toBe(72)
    expect(estimateOneRm({ type: 'failure', kg: 60, reps: 6 })).toBe(72)
  })

  it('ignore les échauffements', () => {
    expect(estimateOneRm({ type: 'warmup', kg: 60, reps: 5 })).toBeNull()
  })

  it('ignore les séries de plus de 10 reps', () => {
    expect(estimateOneRm({ type: 'normal', kg: 50, reps: 11 })).toBeNull()
    expect(estimateOneRm({ type: 'normal', kg: 50, reps: 10 })).not.toBeNull()
  })

  it('ignore les séries sans rep ou sans charge', () => {
    expect(estimateOneRm({ type: 'normal', kg: 50, reps: 0 })).toBeNull()
    expect(estimateOneRm({ type: 'normal', kg: 0, reps: 8 })).toBeNull()
  })
})
