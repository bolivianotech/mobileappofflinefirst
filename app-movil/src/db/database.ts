import * as SQLite from 'expo-sqlite';

// Cada elemento es una migración. NUNCA edites una ya publicada: agrega una nueva al final.
const MIGRACIONES: string[] = [
  `
  CREATE TABLE obras (
    id TEXT PRIMARY KEY NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    cliente TEXT NOT NULL DEFAULT '',
    direccion TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL,
    editado_por TEXT NOT NULL,
    eliminado INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE avances (
    id TEXT PRIMARY KEY NOT NULL,
    obra_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    notas TEXT NOT NULL DEFAULT '',
    pasos_completados TEXT NOT NULL DEFAULT '[]',
    porcentaje INTEGER NOT NULL DEFAULT 0,
    datos_extra TEXT NOT NULL DEFAULT '{}',
    latitud REAL,
    longitud REAL,
    registrado_en TEXT NOT NULL,
    registrado_por TEXT NOT NULL DEFAULT '',
    actualizado_en TEXT NOT NULL,
    editado_por TEXT NOT NULL,
    eliminado INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_avances_obra ON avances(obra_id, registrado_en);
  CREATE TABLE fotos (
    id TEXT PRIMARY KEY NOT NULL,
    avance_id TEXT NOT NULL,
    ruta_local TEXT,
    url_remota TEXT,
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL,
    editado_por TEXT NOT NULL,
    eliminado INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_fotos_avance ON fotos(avance_id);
  -- Bandeja de salida: una fila por registro con cambios aún no enviados.
  CREATE TABLE outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad TEXT NOT NULL,
    entidad_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    actualizado_en TEXT NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    ultimo_error TEXT,
    UNIQUE (entidad, entidad_id)
  );
  CREATE TABLE meta (
    clave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL
  );
  `,
];

let promesaDb: Promise<SQLite.SQLiteDatabase> | null = null;

/** Devuelve siempre la misma base de datos, ya migrada. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  promesaDb ??= abrir();
  return promesaDb;
}

async function abrir() {
  const db = await SQLite.openDatabaseAsync('avance-obra.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrar(db);
  return db;
}

async function migrar(db: SQLite.SQLiteDatabase) {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = fila?.user_version ?? 0;
  while (version < MIGRACIONES.length) {
    const sql = MIGRACIONES[version];
    version += 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}
