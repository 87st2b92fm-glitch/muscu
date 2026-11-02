/** Muscles de la carte du corps (§6 du cahier des charges). */
export const MUSCLES = {
  chest: 'Pectoraux',
  front_delts: 'Deltoïdes avant',
  side_delts: 'Deltoïdes latéraux',
  rear_delts: 'Deltoïdes arrière',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  abs: 'Abdos',
  obliques: 'Obliques',
  traps: 'Trapèzes',
  lats: 'Grand dorsal',
  lower_back: 'Lombaires',
  glutes: 'Fessiers',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  calves: 'Mollets',
  adductors: 'Adducteurs',
} as const

export type MuscleId = keyof typeof MUSCLES

export const MUSCLE_IDS = Object.keys(MUSCLES) as MuscleId[]
