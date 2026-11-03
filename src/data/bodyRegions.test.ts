import { describe, expect, it } from 'vitest'
import { BACK_REGIONS, FRONT_REGIONS } from './bodyMapPaths'
import { muscleOfRegion } from './bodyRegions'
import { MUSCLE_IDS } from './muscles'

describe('carte du corps', () => {
  it('dessine chacun des 17 muscles de l’app', () => {
    const drawn = new Set([...FRONT_REGIONS, ...BACK_REGIONS].map((r) => muscleOfRegion(r.id)))
    for (const muscle of MUSCLE_IDS) expect(drawn, muscle).toContain(muscle)
  })

  it('relie les régions aux bons muscles', () => {
    expect(muscleOfRegion('shoulder-side-left')).toBe('side_delts')
    expect(muscleOfRegion('deltoid-rear-right')).toBe('rear_delts')
    expect(muscleOfRegion('forearm-extensors-left')).toBe('forearms')
    expect(muscleOfRegion('lower-back-ql-right')).toBe('lower_back')
    expect(muscleOfRegion('head')).toBeNull()
    expect(muscleOfRegion('tibialis-anterior-left')).toBeNull()
  })
})
