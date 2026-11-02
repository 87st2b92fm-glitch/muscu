import { describe, expect, it } from 'vitest'
import { suggestNext } from './progression'
import type { SetEntry, SetType } from './types'

const s = (kg: number, reps: number, type: SetType = 'normal'): SetEntry => ({ kg, reps, type })
const range = { min: 8, max: 12 }

describe('suggestNext', () => {
  it('ne suggère rien sans fourchette de reps', () => {
    expect(suggestNext([s(60, 12)], null, 2.5)).toBeNull()
  })

  it('ne suggère rien sans série de travail', () => {
    expect(suggestNext([], range, 2.5)).toBeNull()
    expect(suggestNext([s(40, 10, 'warmup')], range, 2.5)).toBeNull()
  })

  it('monte la charge quand toutes les séries atteignent le haut de la fourchette', () => {
    expect(suggestNext([s(60, 12), s(60, 12), s(60, 13)], range, 2.5)).toEqual({
      action: 'increase',
      fromKg: 60,
      kg: 62.5,
      reps: 8,
    })
  })

  it('accepte un incrément non rond (machine de Basic)', () => {
    expect(suggestNext([s(45.4, 12)], range, 2.27)).toMatchObject({ kg: 47.67 })
  })

  it('suggère de monter sans chiffre si l’incrément est inconnu', () => {
    expect(suggestNext([s(60, 12)], range, null)).toMatchObject({ action: 'increase', kg: null })
  })

  it('garde la charge et vise une rep de plus par série sinon', () => {
    expect(suggestNext([s(60, 12), s(60, 10), s(60, 9)], range, 2.5)).toEqual({
      action: 'keep',
      kg: 60,
      reps: [12, 11, 10],
    })
  })

  it('ne regarde que les séries à la charge la plus lourde (pyramide)', () => {
    // Montée 65 → 70 → 80 kg comme au hack squat : seule la série à 80 kg compte.
    expect(suggestNext([s(65, 12), s(70, 12), s(80, 7)], range, 5)).toEqual({
      action: 'keep',
      kg: 80,
      reps: [8],
    })
  })

  it('ignore échauffements et dégressives', () => {
    const sets = [s(40, 12, 'warmup'), s(60, 12), s(60, 12, 'failure'), s(45, 6, 'drop')]
    expect(suggestNext(sets, range, 2.5)).toMatchObject({ action: 'increase', kg: 62.5 })
  })

  it('travaille sur le lest saisi pour un exercice au poids du corps', () => {
    expect(suggestNext([s(10, 8), s(10, 8)], { min: 5, max: 8 }, 2.5)).toMatchObject({
      action: 'increase',
      fromKg: 10,
      kg: 12.5,
      reps: 5,
    })
  })
})
