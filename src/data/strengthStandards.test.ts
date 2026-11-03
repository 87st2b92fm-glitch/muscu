import { describe, expect, it } from 'vitest'
import { assessStrength } from '../domain/strengthLevel'
import { DEFAULT_EXERCISES } from './exercises'
import { EXERCISES_WITH_STANDARDS, standardFor, tableFor } from './strengthStandards'

const library = new Map(DEFAULT_EXERCISES.map((e) => [e.id, e]))

describe('standards de force', () => {
  it('ne relie que des exercices de la bibliothèque, tous en poids libres', () => {
    for (const id of EXERCISES_WITH_STANDARDS) {
      const exercise = library.get(id)
      expect(exercise, id).toBeDefined()
      expect(exercise?.category, id).toBe('free')
      expect(standardFor(id), id).not.toBeNull()
    }
  })

  it('a des tables cohérentes : poids de corps croissants, 5 seuils croissants', () => {
    for (const id of EXERCISES_WITH_STANDARDS) {
      const standard = standardFor(id)!
      for (const sex of ['male', 'female'] as const) {
        const { bodyweightsKg, thresholdsKg } = tableFor(standard, sex)
        expect(bodyweightsKg.length, `${id} ${sex}`).toBeGreaterThan(5)
        expect(thresholdsKg).toHaveLength(bodyweightsKg.length)
        bodyweightsKg.forEach((bw, i) => {
          if (i > 0) expect(bw, `${id} ${sex}`).toBeGreaterThan(bodyweightsKg[i - 1]!)
        })
        for (const row of thresholdsKg) {
          expect(row, `${id} ${sex}`).toHaveLength(5)
          row.forEach((v, i) => {
            expect(Number.isFinite(v)).toBe(true)
            if (i > 0)
              expect(v, `${id} ${sex} ${row.join('/')}`).toBeGreaterThanOrEqual(row[i - 1]!)
          })
        }
      }
    }
  })

  it('indique la source et la date de chaque standard', () => {
    for (const id of EXERCISES_WITH_STANDARDS) {
      const standard = standardFor(id)!
      expect(standard.url).toMatch(/^https:\/\/(exrx\.net|strengthlevel\.com)\//)
      expect(standard.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('reprend les valeurs publiées (contrôles ponctuels)', () => {
    // Kilgore, squat homme, classe 75 kg : Intermédiaire à 112,5 kg.
    expect(tableFor(standardFor('squat')!, 'male').thresholdsKg[4]).toEqual([
      50, 92.5, 112.5, 155, 202.5,
    ])
    expect(standardFor('squat')?.source).toBe('kilgore')
    // Strength Level, tractions homme 70 kg : lest Intermédiaire +31 kg → 101 kg au total.
    const pullUps = standardFor('pull-up')!
    expect(pullUps.load).toBe('bodyweight')
    expect(tableFor(pullUps, 'male').thresholdsKg[4]![2]).toBe(101)
    // Haltères : poids d'un seul haltère.
    expect(standardFor('db-curl')?.perDumbbell).toBe(true)
  })

  it('n’a pas de standard pour les machines ni les exercices non vérifiés', () => {
    expect(standardFor('leg-extension')).toBeNull()
    expect(standardFor('kettlebell-swing')).toBeNull()
    expect(standardFor('push-up')).toBeNull()
  })

  it('donne un niveau réaliste', () => {
    // 64 kg, 1RM estimé de 85 kg au développé couché : entre Intermédiaire (≈ 79) et Avancé (≈ 109).
    expect(assessStrength(85, 64, tableFor(standardFor('bench-press')!, 'male')).level).toBe(2)
  })
})
