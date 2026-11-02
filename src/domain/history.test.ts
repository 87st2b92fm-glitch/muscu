import { describe, expect, it } from 'vitest'
import { recordFlags, type HistorySet } from './history'
import { recordsInWorkout } from './records'
import type { SetType } from './types'

let seq = 0
function set(
  workoutId: string,
  at: number,
  kg: number,
  reps: number,
  scope = 'ex:squat',
  type: SetType = 'normal',
): HistorySet {
  seq += 1
  return { id: `s${seq}`, workoutId, scope, at, kg, reps, type }
}

describe('recordFlags', () => {
  it('ne marque rien lors de la première séance d’un exercice', () => {
    const flags = recordFlags([set('w1', 1, 80, 8), set('w1', 2, 90, 8)])
    expect(flags.size).toBe(0)
  })

  it('marque les records des séances suivantes', () => {
    const later = set('w2', 10, 90, 5)
    const flags = recordFlags([set('w1', 1, 80, 8), later])
    expect(flags.get(later.id)).toEqual(['weight'])
  })

  it('sépare les portées (machines par salle)', () => {
    const basic = set('w2', 10, 50, 10, 'ex:leg-curl@basic')
    const flags = recordFlags([set('w1', 1, 80, 10, 'ex:leg-curl@on-air'), basic])
    expect(flags.has(basic.id)).toBe(false)
  })

  it('donne le même résultat que recordsInWorkout séance par séance', () => {
    // Historique pseudo-aléatoire mais reproductible.
    let seed = 7
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const sets: HistorySet[] = []
    for (let w = 0; w < 30; w++) {
      for (let i = 0; i < 4; i++) {
        const type: SetType = random() < 0.15 ? 'warmup' : 'normal'
        sets.push(
          set(
            `w${w}`,
            w * 100 + i,
            Math.round(40 + random() * 60),
            1 + Math.floor(random() * 12),
            'ex:a',
            type,
          ),
        )
      }
    }
    const expected = new Map<string, string[]>()
    for (let w = 0; w < 30; w++) {
      const history = sets.filter((s) => Number(s.workoutId.slice(1)) < w)
      const workout = sets.filter((s) => s.workoutId === `w${w}`)
      for (const [id, kinds] of recordsInWorkout(history, workout)) expected.set(id, kinds)
    }
    expect(recordFlags(sets)).toEqual(expected)
  })
})
