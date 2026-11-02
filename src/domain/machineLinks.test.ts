import { describe, expect, it } from 'vitest'
import { linkMachine, linkedGymId, type LinkableSetup } from './machineLinks'

const create = (gymId: string): LinkableSetup => ({ gymId, linkGroupId: null })
let n = 0
const newGroupId = () => `g${++n}`

describe('linkMachine', () => {
  it('crée un groupe pour deux machines non liées (et leurs réglages au besoin)', () => {
    const result = linkMachine([], 'on-air', 'suaps', create, newGroupId)
    expect(result).toHaveLength(2)
    expect(result[0]!.linkGroupId).toBe(result[1]!.linkGroupId)
    expect(result.map((s) => s.gymId)).toEqual(['on-air', 'suaps'])
  })

  it('rejoint le groupe existant de la cible', () => {
    const setups = [
      { gymId: 'on-air', linkGroupId: 'panatta' },
      { gymId: 'suaps', linkGroupId: 'panatta' },
      { gymId: 'basic', linkGroupId: null },
    ]
    const result = linkMachine(setups, 'basic', 'on-air', create, newGroupId)
    expect(result.find((s) => s.gymId === 'basic')?.linkGroupId).toBe('panatta')
  })

  it('délie une machine', () => {
    const setups = [
      { gymId: 'on-air', linkGroupId: 'g' },
      { gymId: 'suaps', linkGroupId: 'g' },
    ]
    expect(linkMachine(setups, 'on-air', null, create, newGroupId)).toEqual([
      { gymId: 'on-air', linkGroupId: null },
    ])
  })

  it('garde les autres champs du réglage', () => {
    const setups = [{ gymId: 'on-air', linkGroupId: null, brandModel: 'Panatta' }]
    const result = linkMachine(
      setups,
      'on-air',
      'suaps',
      (gymId) => ({ gymId, linkGroupId: null, brandModel: '' }),
      newGroupId,
    )
    expect(result[0]).toMatchObject({ brandModel: 'Panatta' })
  })
})

describe('linkedGymId', () => {
  it('trouve la salle liée', () => {
    const setups = [
      { gymId: 'on-air', linkGroupId: 'g' },
      { gymId: 'suaps', linkGroupId: 'g' },
      { gymId: 'basic', linkGroupId: null },
    ]
    expect(linkedGymId(setups, 'on-air')).toBe('suaps')
    expect(linkedGymId(setups, 'basic')).toBeNull()
    expect(linkedGymId(setups, 'inconnue')).toBeNull()
  })
})
