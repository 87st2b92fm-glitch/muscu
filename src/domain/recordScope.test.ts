import { describe, expect, it } from 'vitest'
import { recordScope } from './recordScope'

const squat = { id: 'squat', category: 'free' as const }
const legCurl = { id: 'leg-curl', category: 'machine' as const }

describe('recordScope', () => {
  it('partage les records d’un poids libre entre toutes les salles', () => {
    expect(recordScope(squat, 'on-air')).toBe(recordScope(squat, 'basic'))
  })

  it('sépare les records d’une machine par salle', () => {
    expect(recordScope(legCurl, 'on-air')).not.toBe(recordScope(legCurl, 'basic'))
  })

  it('fusionne les machines liées entre deux salles', () => {
    const links = [
      { exerciseId: 'leg-curl', gymId: 'on-air', linkGroupId: 'panatta' },
      { exerciseId: 'leg-curl', gymId: 'suaps', linkGroupId: 'panatta' },
    ]
    expect(recordScope(legCurl, 'on-air', links)).toBe(recordScope(legCurl, 'suaps', links))
    expect(recordScope(legCurl, 'basic', links)).not.toBe(recordScope(legCurl, 'on-air', links))
  })

  it('ignore un lien qui concerne un autre exercice', () => {
    const links = [{ exerciseId: 'presse', gymId: 'on-air', linkGroupId: 'g' }]
    expect(recordScope(legCurl, 'on-air', links)).toBe('ex:leg-curl@on-air')
  })
})
