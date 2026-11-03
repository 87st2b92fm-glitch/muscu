import { describe, expect, it } from 'vitest'
import { formatDelta, latestChange, measurementSeries } from './measurements'

const rows = [
  { at: 30, values: { waistCm: 70 } },
  { at: 10, values: { waistCm: 69, neckCm: 37 } },
  { at: 20, values: { neckCm: 38 } },
]

describe('mensurations', () => {
  it('extrait une mensuration dans l’ordre chronologique', () => {
    expect(measurementSeries(rows, 'waistCm')).toEqual([
      { at: 10, value: 69 },
      { at: 30, value: 70 },
    ])
    expect(measurementSeries(rows, 'hipsCm')).toEqual([])
  })

  it('donne la dernière valeur et l’écart avec la précédente', () => {
    expect(latestChange(measurementSeries(rows, 'neckCm'))).toEqual({ at: 20, value: 38, delta: 1 })
    expect(latestChange([{ at: 1, value: 64 }])).toEqual({ at: 1, value: 64, delta: null })
    expect(latestChange([])).toBeNull()
  })

  it('écrit l’écart signé à la française', () => {
    expect(formatDelta(0.5)).toBe('+0,5')
    expect(formatDelta(-1.25)).toBe('−1,25')
    expect(formatDelta(0)).toBe('=')
  })
})
