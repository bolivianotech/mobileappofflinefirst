import type { SQLiteDatabase } from 'expo-sqlite';
import type { CambioLocal, DatosPorEntidad, Entidad } from '../types';
import { getDb } from './database';

/**
 * Encola un cambio para el servidor. Si ya había uno pendiente para el mismo
 * registro, lo reemplaza: así 20 ediciones seguidas viajan como un solo envío.
 * Debe llamarse DENTRO de la misma transacción que modifica la tabla.
 */
export async function encolar<E extends Entidad>(
  db: SQLiteDatabase,
  entidad: E,
  datos: DatosPorEntidad[E],
): Promise<void> {
  await db.runAsync(
    `INSERT INTO outbox (entidad, entidad_id, payload, actualizado_en)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(entidad, entidad_id) DO UPDATE SET
       payload = excluded.payload,
       actualizado_en = excluded.actualizado_en,
       intentos = 0,
       ultimo_error = NULL`,
    entidad,
    datos.id,
    JSON.stringify(datos),
    datos.actualizadoEn,
  );
}

interface FilaOutbox {
  id: number;
  entidad: Entidad;
  entidad_id: string;
  payload: string;
  actualizado_en: string;
}

export async function leerPendientes(limite: number): Promise<CambioLocal[]> {
  const db = await getDb();
  const filas = await db.getAllAsync<FilaOutbox>(
    'SELECT id, entidad, entidad_id, payload, actualizado_en FROM outbox ORDER BY id LIMIT ?',
    limite,
  );
  return filas.map((f) => {
    const datos = JSON.parse(f.payload);
    return {
      idCambio: f.id,
      entidad: f.entidad,
      id: f.entidad_id,
      actualizadoEn: f.actualizado_en,
      editadoPor: datos.editadoPor,
      datos,
    };
  });
}

/**
 * Borra de la bandeja solo si la fila NO cambió mientras se enviaba
 * (comparamos actualizado_en). Si el usuario editó durante la sincronización,
 * la fila nueva se queda para el siguiente envío.
 */
export async function marcarEnviados(cambios: { idCambio: number; actualizadoEn: string }[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const c of cambios) {
      await db.runAsync('DELETE FROM outbox WHERE id = ? AND actualizado_en = ?', c.idCambio, c.actualizadoEn);
    }
  });
}

export async function registrarError(ids: number[], mensaje: string): Promise<void> {
  const db = await getDb();
  for (const id of ids) {
    await db.runAsync('UPDATE outbox SET intentos = intentos + 1, ultimo_error = ? WHERE id = ?', mensaje, id);
  }
}

export async function contarPendientes(): Promise<number> {
  const db = await getDb();
  const f = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM outbox');
  return f?.n ?? 0;
}
