// Modèles d'exemple affichés tant que la base de données n'existe pas (étape 2).
export interface TemplateSummary {
  id: string
  name: string
  exercises: string[]
}

export interface FolderSummary {
  id: string
  name: string
  /** Modèle proposé pour la prochaine séance quand le dossier sert de programme. */
  nextTemplateId?: string
  isProgram?: boolean
  templates: TemplateSummary[]
}

export const DEMO_FOLDERS: FolderSummary[] = [
  {
    id: 'demo-ul',
    name: 'Upper / Lower · 4 jours',
    nextTemplateId: 'demo-l1',
    isProgram: true,
    templates: [
      {
        id: 'demo-l1',
        name: 'Lower 1',
        exercises: [
          'Squat barre',
          'Soulevé de terre roumain',
          'Fentes bulgares haltères',
          'Mollets debout (machine)',
        ],
      },
      {
        id: 'demo-u1',
        name: 'Upper 1',
        exercises: [
          'Développé couché barre',
          'Rowing barre',
          'Développé militaire haltères',
          'Tractions',
        ],
      },
      {
        id: 'demo-l2',
        name: 'Lower 2',
        exercises: [
          'Leg curl allongé (machine)',
          'Adduction (machine)',
          'Presse à cuisses',
          'Extension jambes (machine)',
        ],
      },
      {
        id: 'demo-u2',
        name: 'Upper 2',
        exercises: [
          'Développé incliné (Smith)',
          'Écartés poulie assis',
          'Tirage vertical prise serrée',
          'Élévations latérales haltères',
        ],
      },
    ],
  },
]
