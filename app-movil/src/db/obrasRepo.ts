import type { Obra, ObraResumen } from '../types';
import { ahora, nuevoId } from '../util/id';
import { getDb } from './database';
import { dispositivoId } from './metaRepo';
import { encolar } from './outboxRepo';

interface FilaObra {
  id: string; nombre: string; tipo: string; cliente: string; direccion: string;
  creado_en: string; actualizado_en: string; editado_por: string; eliminado: number;
}

export const aObra = (f: FilaObra): Obra => ({
  id: f.id, nombre: f.nombre, tipo: f.tipo, cliente: f.cliente, direccion: f.direccion,
  creadoEn: f.creado_en, actualizadoEn: f.actualizado_en, editadoPor: f.editado_por,
  eliminado: f.eliminado === 1,
});

export async function listarObras(): Promise<ObraResumen[]> {
  const db = await getDb();
  const filas = await db.getAllAsync<FilaObra & { progreso: number; pendiente: number }>(
    `SELECT o.*,
       COALESCE((SELECT a.porcentaje FROM avances a
                 WHERE a.obra_id = o.id AND a.eliminado = 0
                 ORDER BY a.registrado_en DESC LIMIT 1), 0) AS progreso,
       EXISTS(SELECT 1 FROM outbox x WHERE x.entidad = 'obra' AND x.entidad_id = o.id) AS pendiente
     FROM obras o WHERE o.eliminado = 0 ORDER BY o.actualizado_en DESC`,
  );
  return filas.map((f) => ({ ...aObra(f), progreso: f.progreso, pendiente: f.pendiente === 1 }));
}

export async function obtenerObra(id: string): Promise<Obra | null> {
  const db = await getDb();
  const f = await db.getFirstAsync<FilaObra>('SELECT * FROM obras WHERE id = ?', id);
  return f ? aObra(f) : null;
}

export async function guardarObra(datos: Pick<Obra, 'nombre' | 'tipo' | 'cliente' | 'direccion'>, id?: string): Promise<Obra> {
  const db = await getDb();
  const editor = await dispositivoId();
  const existente = id ? await obtenerObra(id) : null;
  const t = ahora();
  const obra: Obra = {
    id: existente?.id ?? nuevoId(),
    ...datos,
    creadoEn: existente?.creadoEn ?? t,
    actualizadoEn: t,
    editadoPor: editor,
    eliminado: false,
  };
  await db.withTransactionAsync(async () => {
    await upsertObra(obra);
    await encolar(db, 'obra', obra);
  });
  return obra;
}

export async function eliminarObra(id: string): Promise<void> {
  const db = await getDb();
  const obra = await obtenerObra(id);
  if (!obra) return;
  const borrada: Obra = { ...obra, eliminado: true, actualizadoEn: ahora(), editadoPor: await dispositivoId() };
  await db.withTransactionAsync(async () => {
    await upsertObra(borrada);
    await encolar(db, 'obra', borrada);
  });
}

/** Escribe una obra en SQLite SIN encolar (la usa también la sincronización al recibir datos). */
export async function upsertObra(o: Obra): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO obras (id, nombre, tipo, cliente, direccion, creado_en, actualizado_en, editado_por, eliminado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET nombre = excluded.nombre, tipo = excluded.tipo, cliente = excluded.cliente,
       direccion = excluded.direccion, actualizado_en = excluded.actualizado_en,
       editado_por = excluded.editado_por, eliminado = excluded.eliminado`,
    o.id, o.nombre, o.tipo, o.cliente, o.direccion, o.creadoEn, o.actualizadoEn, o.editadoPor, o.eliminado ? 1 : 0,
  );
}
