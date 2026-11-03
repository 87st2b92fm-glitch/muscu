import { describe, expect, it } from 'vitest'
import { muscleLevels, type ReferenceLift } from './muscleLevels'
import type { StandardsTable } from './strengthLevel'

const table = (thresholds: number[]): StandardsTable => ({
  bodyweightsKg: [60, 80],
  thresholdsKg: [thresholds, thresholds],
})
const lift = (
  exerciseId: string,
  primaryMuscles: ReferenceLift['primaryMuscles'],
  oneRmKg: number,
  thresholds: number[],
): ReferenceLift => ({
  exerciseId,
  name: exerciseId,
  primaryMuscles,
  oneRmKg,
  table: table(thresholds),
})

describe('muscleLevels', () => {
  const levels = muscleLevels(
    [
      lift('squat', ['quads', 'glutes'], 120, [50, 90, 110, 150, 200]), // Intermédiaire
      lift('front-squat', ['quads'], 100, [40, 60, 80, 95, 130]), // Avancé
      lift('hip-thrust', ['glutes'], 100, [40, 80, 120, 180, 250]), // Novice
      lift('curl', ['biceps'], 30, [10, 20, 30, 40, 50]), // Intermédiaire pile au seuil
    ],
    70,
  )

  it('prend le meilleur exercice qui travaille le muscle en principal', () => {
    expect(levels.get('quads')).toMatchObject({
      level: 3,
      best: { exerciseId: 'front-squat', nextKg: 130 },
    })
    expect(levels.get('glutes')).toMatchObject({ level: 2, best: { exerciseId: 'squat' } })
  })

  it('liste tous les exercices pris en compte, du meilleur au moins bon', () => {
    expect(levels.get('quads')?.lifts.map((l) => l.exerciseId)).toEqual(['front-squat', 'squat'])
  })

  it('n’a pas de niveau pour un muscle sans exercice de référence', () => {
    expect(levels.has('calves')).toBe(false)
  })

  it('départage deux exercices du même niveau par l’avancement vers le niveau suivant', () => {
    const tie = muscleLevels(
      [
        lift('a', ['chest'], 95, [50, 70, 90, 120, 150]),
        lift('b', ['chest'], 115, [50, 70, 90, 120, 150]),
      ],
      70,
    )
    expect(tie.get('chest')?.best.exerciseId).toBe('b')
  })
})
