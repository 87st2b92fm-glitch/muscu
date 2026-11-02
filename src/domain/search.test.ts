import { describe, expect, it } from 'vitest'
import { byName, matchesSearch, normalizeText } from './search'

describe('normalizeText', () => {
  it('retire accents, majuscules et espaces superflus', () => {
    expect(normalizeText('  Écartés   Poulie ')).toBe('ecartes poulie')
    expect(normalizeText('Kawaï')).toBe('kawai')
  })
})

describe('matchesSearch', () => {
  it('trouve tout avec une recherche vide', () => {
    expect(matchesSearch('  ', ['Squat'])).toBe(true)
  })

  it('ignore accents et ordre des mots', () => {
    expect(matchesSearch('poulie ecart', ['Écartés à la poulie'])).toBe(true)
  })

  it('cherche aussi dans les autres noms', () => {
    expect(matchesSearch('pec deck', ['Pec deck (machine)', 'Butterfly'])).toBe(true)
    expect(matchesSearch('butterfly', ['Pec deck (machine)', 'Butterfly (Pec Deck)'])).toBe(true)
  })

  it('exige tous les mots', () => {
    expect(matchesSearch('curl marteau', ['Curl (barre)'])).toBe(false)
  })
})

describe('byName', () => {
  it('range les accents avec leur lettre', () => {
    const names = ['Squat', 'Écartés', 'Élévations', 'Curl', 'extension'].map((name) => ({ name }))
    expect(names.sort(byName).map((n) => n.name)).toEqual([
      'Curl',
      'Écartés',
      'Élévations',
      'extension',
      'Squat',
    ])
  })
})
