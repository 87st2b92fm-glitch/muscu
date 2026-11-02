import { describe, expect, it } from 'vitest'
import { parseCsv } from './csv'
import { detectHevyFile, parseHevyDate, parseHevyMeasurements, parseHevyWorkouts } from './hevy'

// Extraits fictifs au format de l'export Hevy (jamais de vraies données dans le dépôt).
const HEADER =
  '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"'
const WORKOUTS = `${HEADER}
"Legs","1 nov. 2026, 13:48","1 nov. 2026, 15:02","","Hack Squat (Machine)",,"",0,"warmup",40,10,,,
"Legs","1 nov. 2026, 13:48","1 nov. 2026, 15:02","","Hack Squat (Machine)",,"",1,"normal",80,7,,,8.5
"Legs","1 nov. 2026, 13:48","1 nov. 2026, 15:02","","Adduction Hanche",0,"+5",0,"normal",120,7,,,
"Legs","1 nov. 2026, 13:48","1 nov. 2026, 15:02","","Abduction Hanche",0,"",0,"dropset",90,12,,,
"Legs","1 nov. 2026, 13:48","1 nov. 2026, 15:02","","Hack Squat (Machine)",,"",0,"normal",60,12,,,
"Upper","18 oct. 2026, 14:24","18 oct. 2026, 15:59","","Tractions",,"",0,"normal",,8,,,
"Upper","18 oct. 2026, 14:24","18 oct. 2026, 15:59","","Vélo Machine",,"",0,"normal",,,,600,
`

describe('parseHevyDate', () => {
  it('lit les dates françaises en heure locale', () => {
    expect(parseHevyDate('1 nov. 2026, 13:48')).toBe(new Date(2026, 10, 1, 13, 48).getTime())
    expect(parseHevyDate('19 févr. 2026, 00:00')).toBe(new Date(2026, 1, 19).getTime())
    expect(parseHevyDate('3 août 2025, 9:05')).toBe(new Date(2025, 7, 3, 9, 5).getTime())
    expect(parseHevyDate('10 mai 2024, 18:00')).toBe(new Date(2024, 4, 10, 18).getTime())
  })

  it('lit aussi les mois anglais', () => {
    expect(parseHevyDate('1 Nov 2026, 13:48')).toBe(new Date(2026, 10, 1, 13, 48).getTime())
  })

  it('renvoie null pour une date illisible', () => {
    expect(parseHevyDate('2026-11-01')).toBeNull()
    expect(parseHevyDate('1 brumaire 2026, 13:48')).toBeNull()
  })
})

describe('detectHevyFile', () => {
  it('reconnaît les deux fichiers', () => {
    expect(detectHevyFile(parseCsv(WORKOUTS))).toBe('workouts')
    expect(detectHevyFile(parseCsv('"date","weight_kg"\n"1 nov. 2026, 00:00",64'))).toBe(
      'measurements',
    )
    expect(detectHevyFile(parseCsv('a,b\n1,2'))).toBeNull()
  })
})

describe('parseHevyWorkouts', () => {
  const workouts = parseHevyWorkouts(parseCsv(WORKOUTS))

  it('regroupe les séries en séances', () => {
    expect(workouts.map((w) => w.title)).toEqual(['Legs', 'Upper'])
    expect(workouts[0]?.endedAt).toBe(new Date(2026, 10, 1, 15, 2).getTime())
  })

  it('regroupe les séries en exercices, même quand un exercice revient plus tard', () => {
    expect(workouts[0]?.exercises.map((e) => [e.name, e.sets.length])).toEqual([
      ['Hack Squat (Machine)', 2],
      ['Adduction Hanche', 1],
      ['Abduction Hanche', 1],
      ['Hack Squat (Machine)', 1],
    ])
  })

  it('lit types de série, charges, reps, RPE, notes et supersets', () => {
    const [hack, adduction, abduction] = workouts[0]!.exercises
    expect(hack?.sets[0]).toMatchObject({ type: 'warmup', kg: 40, reps: 10, rpe: null })
    expect(hack?.sets[1]).toMatchObject({ type: 'normal', kg: 80, reps: 7, rpe: 8.5 })
    expect(adduction).toMatchObject({ supersetId: '0', notes: '+5' })
    expect(abduction?.sets[0]?.type).toBe('drop')
  })

  it('garde une charge vide et les séries de cardio telles quelles', () => {
    const [pullUps, bike] = workouts[1]!.exercises
    expect(pullUps?.sets[0]).toMatchObject({ kg: null, reps: 8 })
    expect(bike?.sets[0]).toMatchObject({ reps: null, durationSec: 600 })
  })
})

describe('parseHevyMeasurements', () => {
  it('lit le poids et les mensurations renseignées', () => {
    const csv = `"date","weight_kg","fat_percent","neck_cm","left_bicep_cm","right_calf_cm"
"10 juil. 2023, 00:00",62,,,,
"11 juil. 2023, 00:00",,,37,31,35`
    expect(parseHevyMeasurements(parseCsv(csv))).toEqual([
      { at: new Date(2023, 6, 10).getTime(), weightKg: 62, values: {} },
      {
        at: new Date(2023, 6, 11).getTime(),
        weightKg: null,
        values: { neckCm: 37, leftBicepCm: 31, rightCalfCm: 35 },
      },
    ])
  })
})
