import { describe, expect, it } from 'vitest'
import { computeRecords, recordsInWorkout } from './records'
import type { ScoredSet, SetType } from './types'

let seq = 0
function set(kg: number, reps: number, at: number, type: SetType = 'normal'): ScoredSet {
  seq += 1
  return { id: `s${seq}`, kg, reps, at, type }
}

describe('computeRecords', () => {
  it('renvoie des records vides sans série', () => {
    const r = computeRecords([])
    expect(r.maxWeight).toBeNull()
    expect(r.repsByWeight).toEqual([])
  })

  it('calcule tous les records d’un exercice', () => {
    const sets = [
      set(100, 5, 1),
      set(110, 1, 2),
      set(90, 9, 3),
      set(60, 15, 4),
      set(140, 1, 5, 'warmup'),
    ]
    const r = computeRecords(sets)
    expect(r.actualOneRm?.value).toBe(110)
    expect(r.maxWeight?.value).toBe(110)
    // 90 × (1 + 9/30) = 117 bat 100 × (1 + 5/30) = 116,67 ; 15 reps n'est pas pris en compte.
    expect(r.estimatedOneRm?.value).toBe(117)
    expect(r.estimatedOneRm?.at).toBe(3)
    expect(r.maxReps?.value).toBe(15)
    expect(r.bestSetVolume?.value).toBe(900)
  })

  it('ignore les échauffements', () => {
    const r = computeRecords([set(150, 3, 1, 'warmup'), set(100, 3, 2)])
    expect(r.maxWeight?.value).toBe(100)
  })

  it('date un record égalé à sa première réalisation', () => {
    const r = computeRecords([set(100, 5, 1), set(100, 5, 2)])
    expect(r.maxWeight?.at).toBe(1)
    expect(r.bestSetVolume?.at).toBe(1)
  })

  it('n’a pas de 1RM réel sans série d’une rep', () => {
    expect(computeRecords([set(100, 3, 1)]).actualOneRm).toBeNull()
  })

  it('donne les reps max par charge, charges décroissantes', () => {
    const r = computeRecords([set(80, 7, 1), set(80, 9, 2), set(70, 12, 3), set(80, 8, 4)])
    expect(r.repsByWeight.map((e) => [e.kg, e.value, e.at])).toEqual([
      [80, 9, 2],
      [70, 12, 3],
    ])
  })

  it('regroupe les charges égales malgré la virgule flottante', () => {
    const r = computeRecords([set(0.1 + 0.2, 10, 1), set(0.3, 12, 2)])
    expect(r.repsByWeight).toHaveLength(1)
    expect(r.repsByWeight[0]?.value).toBe(12)
  })

  it('compte les reps sans charge (poids du corps inconnu) mais pas les records de charge', () => {
    const r = computeRecords([set(0, 12, 1)])
    expect(r.maxReps?.value).toBe(12)
    expect(r.maxWeight).toBeNull()
  })
})

describe('recordsInWorkout', () => {
  const history = [set(80, 8, 1), set(85, 5, 2)] // charge max 85, volume max 640

  it('ne marque rien lors du premier essai d’un exercice', () => {
    expect(recordsInWorkout([], [set(100, 10, 10)]).size).toBe(0)
  })

  it('marque un record de charge', () => {
    const s = set(87.5, 3, 10)
    expect(recordsInWorkout(history, [s]).get(s.id)).toEqual(['weight'])
  })

  it('marque un record de volume à charge égale', () => {
    const s = set(80, 9, 10)
    expect(recordsInWorkout(history, [s]).get(s.id)).toEqual(['volume'])
  })

  it('marque les deux records sur une même série', () => {
    const s = set(90, 8, 10)
    expect(recordsInWorkout(history, [s]).get(s.id)).toEqual(['weight', 'volume'])
  })

  it('ne marque pas une série qui égale un record', () => {
    const s = set(85, 5, 10)
    expect(recordsInWorkout(history, [s]).has(s.id)).toBe(false)
  })

  it('compare aussi aux séries précédentes de la séance', () => {
    const first = set(90, 7, 10) // 630 < 640 : record de charge seulement
    const second = set(90, 8, 11) // même charge, 720 > 640 : record de volume seulement
    const third = set(90, 4, 12) // ne bat rien
    const flags = recordsInWorkout(history, [third, second, first])
    expect(flags.get(first.id)).toEqual(['weight'])
    expect(flags.get(second.id)).toEqual(['volume'])
    expect(flags.has(third.id)).toBe(false)
  })

  it('ignore les échauffements de la séance', () => {
    const s = set(120, 2, 10, 'warmup')
    expect(recordsInWorkout(history, [s]).size).toBe(0)
  })
})
