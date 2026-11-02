import { describe, expect, it } from 'vitest'
import { parseCsv } from './csv'

describe('parseCsv', () => {
  it('lit les champs entre guillemets et les champs vides', () => {
    expect(parseCsv('"a","b","c"\n"x",,3\n')).toEqual([{ a: 'x', b: '', c: '3' }])
  })

  it('gère virgules, guillemets doublés et retours à la ligne dans un champ', () => {
    const csv = '"nom","note"\n"Upper","1 nov. 2026, 13:48"\n"Legs","il a dit ""ok""\net après"\n'
    expect(parseCsv(csv)).toEqual([
      { nom: 'Upper', note: '1 nov. 2026, 13:48' },
      { nom: 'Legs', note: 'il a dit "ok"\net après' },
    ])
  })

  it('accepte les fins de ligne Windows, le BOM et l’absence de saut final', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n3,4')).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ])
  })

  it('ignore les lignes vides', () => {
    expect(parseCsv('a\n\n1\n\n')).toEqual([{ a: '1' }])
  })

  it('renvoie une liste vide pour un fichier vide', () => {
    expect(parseCsv('')).toEqual([])
  })
})
