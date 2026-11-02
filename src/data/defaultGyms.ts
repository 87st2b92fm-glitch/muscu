/** Salles créées au premier lancement. La couleur sert de pastille tant qu'aucun logo n'est ajouté. */
export interface GymLook {
  id: string
  name: string
  color: string
  /** URL d'image (logo importé depuis la pellicule). */
  logo?: string
}

export const DEFAULT_GYMS: GymLook[] = [
  { id: 'on-air', name: 'On Air', color: '#e11d48' },
  { id: 'suaps', name: 'SUAPS', color: '#2563eb' },
  { id: 'basic', name: 'Basic', color: '#f97316' },
]

export const DEFAULT_GYM_ID = 'on-air'
