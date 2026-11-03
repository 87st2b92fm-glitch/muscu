import type { Sex } from '../db/types'
import type { StandardsTable } from '../domain/strengthLevel'
import data from './strengthStandards.json'

/**
 * Standards de force (1RM par poids de corps et par sexe), générés depuis
 * data-sources/strength-standards/ par build.py : Kilgore (ExRx.net) pour les grands mouvements
 * à la barre, Strength Level pour les autres poids libres.
 */
export interface StrengthStandard {
  name: string
  source: 'kilgore' | 'strengthlevel'
  url: string
  /** AAAA-MM-JJ */
  retrievedAt: string
  /** Fin des données utilisées par Strength Level (« 5 March 2026 »). */
  dataCutoff?: string
  /** `bodyweight` : seuils exprimés en charge totale, poids du corps inclus (tractions, dips…). */
  load: 'total' | 'bodyweight'
  /** Poids d'un seul haltère. */
  perDumbbell: boolean
  male: StandardsTable
  female: StandardsTable
}

const standards = data.standards as Record<string, StrengthStandard>
const exerciseStandards = data.exercises as Record<string, string>

export const SOURCES = {
  kilgore: {
    label: 'Dr Lon Kilgore, publié sur ExRx.net',
    url: 'https://exrx.net/Testing/WeightLifting/StrengthStandards',
  },
  strengthlevel: {
    label: 'Strength Level (données déclarées par ses utilisateurs, indicatives)',
    url: 'https://strengthlevel.com/strength-standards',
  },
} as const

/** Standard d'un exercice de la bibliothèque, ou null s'il n'en a pas (machines, exercices non vérifiés). */
export function standardFor(exerciseId: string): StrengthStandard | null {
  const key = exerciseStandards[exerciseId]
  return key ? (standards[key] ?? null) : null
}

export function tableFor(standard: StrengthStandard, sex: Sex): StandardsTable {
  return sex === 'female' ? standard.female : standard.male
}

/** Identifiants des exercices qui ont un standard. */
export const EXERCISES_WITH_STANDARDS = Object.keys(exerciseStandards)
