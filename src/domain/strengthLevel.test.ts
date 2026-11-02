import { describe, expect, it } from 'vitest'
import { assessStrength, thresholdsAt, type StandardsTable } from './strengthLevel'

// Table fictive : les vraies données arrivent à l'étape 9 (src/data/strengthStandards.json).
const table: StandardsTable = {
  bodyweightsKg: [60, 70, 80],
  thresholdsKg: [
    [40, 55, 70, 90, 110],
    [45, 60, 80, 100, 125],
    [50, 70, 90, 110, 140],
  ],
}

describe('thresholdsAt', () => {
  it('renvoie la tranche exacte', () => {
    expect(thresholdsAt(70, table)).toEqual([45, 60, 80, 100, 125])
  })

  it('interpole entre deux tranches', () => {
    expect(thresholdsAt(64, table)).toEqual([42, 57, 74, 94, 116])
  })

  it('borne sous la première et au-dessus de la dernière tranche', () => {
    expect(thresholdsAt(50, table)).toEqual([40, 55, 70, 90, 110])
    expect(thresholdsAt(95, table)).toEqual([50, 70, 90, 110, 140])
  })
})

describe('assessStrength', () => {
  it('donne le plus haut niveau atteint et la charge du suivant', () => {
    expect(assessStrength(85, 70, table)).toMatchObject({ level: 2, nextKg: 100 })
  })

  it('atteint un niveau pile au seuil', () => {
    expect(assessStrength(60, 70, table)).toMatchObject({ level: 1, nextKg: 80 })
  })

  it('reste Débutant sous le premier seuil', () => {
    expect(assessStrength(30, 70, table)).toMatchObject({ level: 0, nextKg: 60 })
  })

  it('n’a pas de niveau suivant à Élite', () => {
    expect(assessStrength(130, 70, table)).toMatchObject({ level: 4, nextKg: null })
  })

  it('utilise le poids de corps interpolé', () => {
    // À 64 kg, le seuil Avancé est à 94 kg.
    expect(assessStrength(94, 64, table).level).toBe(3)
    expect(assessStrength(93.9, 64, table).level).toBe(2)
  })
})
