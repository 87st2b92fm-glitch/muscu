import type { AppDB } from '../db/db'

/** Format du fichier de sauvegarde. À incrémenter si sa structure change (avec une conversion). */
export const BACKUP_FORMAT = 1

export const BACKUP_TABLES = [
  'profile',
  'bodyweights',
  'measurements',
  'gyms',
  'exercises',
  'machineSetups',
  'folders',
  'templates',
  'workouts',
  'sets',
  'importMappings',
] as const

export type BackupTable = (typeof BACKUP_TABLES)[number]
type Row = Record<string, unknown>

export interface Backup {
  app: 'muscu'
  format: number
  /** Version du schéma de la base au moment de l'export. */
  schemaVersion: number
  exportedAt: string
  tables: Record<BackupTable, Row[]>
}

/** Clé primaire de chaque table (pour la fusion). */
const KEYS: Record<BackupTable, string> = {
  profile: 'id',
  bodyweights: 'id',
  measurements: 'id',
  gyms: 'id',
  exercises: 'id',
  machineSetups: 'id',
  folders: 'id',
  templates: 'id',
  workouts: 'id',
  sets: 'id',
  importMappings: 'sourceName',
}

/** Toutes les données de l'app, prêtes à être écrites dans un fichier JSON. */
export async function createBackup(db: AppDB, now = new Date()): Promise<Backup> {
  const tables = {} as Record<BackupTable, Row[]>
  await db.transaction(
    'r',
    BACKUP_TABLES.map((t) => db.table(t)),
    async () => {
      for (const table of BACKUP_TABLES) tables[table] = await db.table(table).toArray()
    },
  )
  return {
    app: 'muscu',
    format: BACKUP_FORMAT,
    schemaVersion: db.verno,
    exportedAt: now.toISOString(),
    tables,
  }
}

/** Lit et vérifie un fichier de sauvegarde ; lève une erreur en français s'il est invalide. */
export function parseBackup(text: string, currentSchemaVersion: number): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Ce fichier n’est pas un JSON valide.')
  }
  const backup = data as Partial<Backup>
  if (!backup || typeof backup !== 'object' || backup.app !== 'muscu' || !backup.tables) {
    throw new Error('Ce fichier n’est pas une sauvegarde de l’app.')
  }
  if (typeof backup.format !== 'number' || backup.format > BACKUP_FORMAT) {
    throw new Error('Sauvegarde faite avec une version plus récente de l’app : mets l’app à jour.')
  }
  if (typeof backup.schemaVersion !== 'number' || backup.schemaVersion > currentSchemaVersion) {
    throw new Error('Sauvegarde faite avec une version plus récente de l’app : mets l’app à jour.')
  }
  for (const table of BACKUP_TABLES) {
    const rows = backup.tables[table]
    if (!Array.isArray(rows)) throw new Error(`Sauvegarde incomplète : « ${table} » manque.`)
    for (const row of rows) {
      if (!row || typeof row !== 'object' || typeof (row as Row)[KEYS[table]] !== 'string') {
        throw new Error(`Sauvegarde abîmée : une ligne de « ${table} » est illisible.`)
      }
    }
  }
  return backup as Backup
}

export interface BackupSummary {
  workouts: number
  sets: number
  templates: number
  customExercises: number
  bodyweights: number
  exportedAt: string
}

export function summarizeBackup(backup: Backup): BackupSummary {
  return {
    workouts: backup.tables.workouts.length,
    sets: backup.tables.sets.length,
    templates: backup.tables.templates.length,
    customExercises: backup.tables.exercises.filter((e) => e.custom === true).length,
    bodyweights: backup.tables.bodyweights.length,
    exportedAt: backup.exportedAt,
  }
}

/**
 * Restaure une sauvegarde en une seule transaction (tout ou rien) :
 * - `replace` : efface tout et reprend exactement la sauvegarde ;
 * - `merge` : ajoute seulement ce qui n'existe pas encore (rien n'est écrasé, profil conservé).
 * Renvoie le nombre de lignes ajoutées.
 */
export async function restoreBackup(
  db: AppDB,
  backup: Backup,
  mode: 'merge' | 'replace',
): Promise<number> {
  let added = 0
  await db.transaction(
    'rw',
    BACKUP_TABLES.map((t) => db.table(t)),
    async () => {
      for (const name of BACKUP_TABLES) {
        const table = db.table(name)
        const rows = backup.tables[name]
        if (mode === 'replace') {
          await table.clear()
          await table.bulkAdd(rows)
          added += rows.length
          continue
        }
        const existing = new Set((await table.toCollection().primaryKeys()) as string[])
        const fresh = rows.filter((r) => !existing.has(r[KEYS[name]] as string))
        await table.bulkAdd(fresh)
        added += fresh.length
      }
    },
  )
  return added
}

export const BACKUP_REMINDER_DAYS = 14

/** Vrai s'il faut rappeler de sauvegarder : des séances existent et la dernière sauvegarde date. */
export function backupDue(lastBackupAt: number | null, now: number, hasWorkouts: boolean): boolean {
  if (!hasWorkouts) return false
  return lastBackupAt === null || now - lastBackupAt > BACKUP_REMINDER_DAYS * 86_400_000
}
