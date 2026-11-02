import { describe, expect, it } from 'vitest'
import { loadBar } from './plates'

const fullStock = [25, 20, 15, 10, 5, 2.5, 1.25].map((kg) => ({ kg, pairs: 4 }))

describe('loadBar', () => {
  it('charge la barre avec le moins de disques possible', () => {
    expect(loadBar(100, 20, fullStock)).toEqual({ perSide: [25, 15], totalKg: 100, exact: true })
    expect(loadBar(142.5, 20, fullStock)).toEqual({
      perSide: [25, 25, 10, 1.25],
      totalKg: 142.5,
      exact: true,
    })
  })

  it('renvoie une barre vide pour la charge de la barre', () => {
    expect(loadBar(20, 20, fullStock)).toEqual({ perSide: [], totalKg: 20, exact: true })
  })

  it('renvoie null sous la charge de la barre', () => {
    expect(loadBar(15, 20, fullStock)).toBeNull()
  })

  it('trouve une combinaison là où un choix glouton échoue (stock limité)', () => {
    const stock = [
      { kg: 10, pairs: 1 },
      { kg: 7.5, pairs: 2 },
    ]
    expect(loadBar(50, 20, stock)).toEqual({ perSide: [7.5, 7.5], totalKg: 50, exact: true })
  })

  it('donne la charge réalisable la plus proche en dessous', () => {
    expect(loadBar(101, 20, fullStock)).toEqual({ perSide: [25, 15], totalKg: 100, exact: false })
  })

  it('respecte le nombre de paires disponibles', () => {
    const stock = [
      { kg: 20, pairs: 1 },
      { kg: 5, pairs: 1 },
    ]
    expect(loadBar(140, 20, stock)).toEqual({ perSide: [20, 5], totalKg: 70, exact: false })
  })

  it('gère des disques non ronds', () => {
    const stock = [
      { kg: 11.34, pairs: 2 },
      { kg: 2.27, pairs: 2 },
    ]
    expect(loadBar(47.22, 20, stock)).toEqual({
      perSide: [11.34, 2.27],
      totalKg: 47.22,
      exact: true,
    })
  })
})
