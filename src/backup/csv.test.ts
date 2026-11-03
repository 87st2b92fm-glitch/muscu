import { describe, expect, it } from 'vitest'
import { DEFAULT_EXERCISES } from '../data/exercises'
import { defaultGyms } from '../db/seed'
import type { SetRow, Workout } from '../db/types'
import { workoutsToCsv } from './csv'

const exercises = new Map(DEFAULT_EXERCISES.map((e) => [e.id, e]))
const gyms = new Map(defaultGyms().map((g) => [g.id, g]))
const at = new Date(2026, 10, 1, 13, 48).getTime()

const workout: Workout = {
  id: 'w',
  title: 'Legs; "lourd"',
  gymId: 'on-air',
  templateId: null,
  startedAt: at,
  endedAt: at + 1,
  notes: '',
  status: 'done',
  blocks: [
    { id: 'b', exerciseId: 'pull-up', supersetId: null, notes: 'prise large', restSec: null },
  ],
  restEndsAt: null,
  source: 'app',
}
const set = (id: string, order: number, kg: number, rir: number | null, done = true): SetRow => ({
  id,
  workoutId: 'w',
  blockId: 'b',
  exerciseId: 'pull-up',
  gymId: 'on-air',
  order,
  type: order === 0 ? 'warmup' : 'normal',
  reps: 8,
  kg,
  rir,
  at,
  done,
})

describe('workoutsToCsv', () => {
  const csv = workoutsToCsv(
    [workout],
    [set('s2', 1, 12.5, 1.5), set('s1', 0, 0, null), set('s3', 2, 20, null, false)],
    exercises,
    gyms,
  )
  const lines = csv.replace('﻿', '').trim().split('\r\n')

  it('écrit un en-tête et une ligne par série validée, dans l’ordre', () => {
    expect(lines[0]).toBe(
      'Date;Heure;Séance;Salle;Exercice;Série;Type;Charge (kg);Reps;RIR;Notes exercice',
    )
    expect(lines).toHaveLength(3)
  })

  it('formate pour Excel en français et échappe les champs spéciaux', () => {
    expect(lines[1]).toBe(
      '2026-11-01;13:48;"Legs; ""lourd""";On Air;Tractions;1;échauffement;0;8;;prise large',
    )
    expect(lines[2]).toBe(
      '2026-11-01;13:48;"Legs; ""lourd""";On Air;Tractions;2;normale;12,5;8;1,5;',
    )
  })

  it('commence par un BOM pour les accents', () => {
    expect(csv.startsWith('﻿')).toBe(true)
  })
})
