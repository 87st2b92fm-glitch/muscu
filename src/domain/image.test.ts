import { describe, expect, it } from 'vitest'
import { coverCrop } from './image'

describe('coverCrop', () => {
  it('centre le carré dans une image large', () => {
    expect(coverCrop(400, 200)).toEqual({ sx: 100, sy: 0, side: 200 })
  })

  it('centre le carré dans une image haute', () => {
    expect(coverCrop(300, 500)).toEqual({ sx: 0, sy: 100, side: 300 })
  })

  it('garde une image déjà carrée', () => {
    expect(coverCrop(128, 128)).toEqual({ sx: 0, sy: 0, side: 128 })
  })
})
