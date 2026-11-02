import { describe, expect, it } from 'vitest'
import { DEFAULT_EXERCISES } from './exercises'
import { MUSCLE_IDS } from './muscles'

const normalize = (s: string) => s.trim().toLowerCase()

describe('bibliothèque d’exercices', () => {
  it('contient environ 80 exercices ou plus', () => {
    expect(DEFAULT_EXERCISES.length).toBeGreaterThanOrEqual(80)
  })

  it('a des identifiants et des noms uniques', () => {
    const ids = DEFAULT_EXERCISES.map((e) => e.id)
    const names = DEFAULT_EXERCISES.map((e) => normalize(e.name))
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
  })

  it('n’associe jamais un même nom Hevy à deux exercices', () => {
    const owners = new Map<string, string>()
    for (const exercise of DEFAULT_EXERCISES) {
      for (const alias of exercise.aliases) {
        const key = normalize(alias)
        expect(owners.get(key), `« ${alias} »`).toBeUndefined()
        owners.set(key, exercise.id)
      }
    }
  })

  it('n’utilise que des muscles de la carte du corps', () => {
    for (const exercise of DEFAULT_EXERCISES) {
      expect(exercise.primaryMuscles.length, exercise.id).toBeGreaterThan(0)
      for (const muscle of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) {
        expect(MUSCLE_IDS, `${exercise.id} : ${muscle}`).toContain(muscle)
      }
    }
  })

  it('classe poulies, Smith et machines dans les machines, le reste en poids libres', () => {
    for (const exercise of DEFAULT_EXERCISES) {
      const machine = ['machine', 'cable', 'smith'].includes(exercise.equipment)
      expect(exercise.category, exercise.id).toBe(machine ? 'machine' : 'free')
    }
  })

  it('réserve le mode « lest + poids du corps » aux exercices au poids du corps', () => {
    for (const exercise of DEFAULT_EXERCISES.filter((e) => e.loadMode === 'bodyweight')) {
      expect(exercise.equipment, exercise.id).toBe('bodyweight')
    }
  })
})
