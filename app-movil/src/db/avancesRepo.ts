import type { Avance, Foto, FotoLocal } from '../types';
import { calcularPorcentaje, tipoPorId } from '../config/tiposObra';
import { ahora, nuevoId } from '../util/id';
import { getDb } from './database';
import { dispositivoId, leerOperador } from './metaRepo';
import { obtenerObra } from './obrasRepo';
import { encolar } from './outboxRepo';

interface FilaAvance {
  id: string; obra_id: string; titulo: string; notas: string; pasos_completados: string;
  porcentaje: number; datos_extra: string; latitud: number | null; longitud: number | null;
  registrado_en: string; registrado_por: string; actualizado_en: string; editado_por: string; eliminado: number;
}
interface FilaFoto {
  id: string; avance_id: string; ruta_local: string | null; url_remota: string | null;
  creado_en: string; actualizado_en: string; editado_por: string; eliminado: number;
}

const aAvance = (f: FilaAvance): Avance => ({
  id: f.id, obraId: f.obra_id, titulo: f.titulo, notas: f.notas,
  pasosCompletados: JSON.parse(f.pasos_completados), porcentaje: f.porcentaje,
  datosExtra: JSON.parse(f.datos_extra), latitud: f.latitud, longitud: f.longitud,
  registradoEn: f.registrado_en, registradoPor: f.registrado_por,
  actualizadoEn: f.actualizado_en, editadoPor: f.editado_por, eliminado: f.eliminado === 1,
});
const aFoto = (f: FilaFoto): FotoLocal => ({
  id: f.id, avanceId: f.avance_id, rutaLocal: f.ruta_local, urlRemota: f.url_remota,
  creadoEn: f.creado_en, actualizadoEn: f.actualizado_en, editadoPor: f.editado_por, eliminado: f.eliminado === 1,
});

export interface AvanceConPendiente extends Avance { pendiente: boolean; fotos: number }

export async function listarAvances(obraId: string): Promise<AvanceConPendiente[]> {
  const db = await getDb();
  const filas = await db.getAllAsync<FilaAvance & { pendiente: number; fotos: number }>(
    `SELECT a.*,
       EXISTS(SELECT 1 FROM outbox x WHERE x.entidad = 'avance' AND x.entidad_id = a.id) AS pendiente,
       (SELECT COUNT(*) FROM fotos f WHERE f.avance_id = a.id AND f.eliminado = 0) AS fotos
     FROM avances a WHERE a.obra_id = ? AND a.eliminado = 0 ORDER BY a.registrado_en DESC`,
    obraId,
  );
  return filas.map((f) => ({ ...aAvance(f), pendiente: f.pendiente === 1, fotos: f.fotos }));
}

export async function obtenerAvance(id: string): Promise<Avance | null> {
  const db = await getDb();
  const f = await db.getFirstAsync<FilaAvance>('SELECT * FROM avances WHERE id = ?', id);
  return f ? aAvance(f) : null;
}

export async function ultimoAvance(obraId: string): Promise<Avance | null> {
  const lista = await listarAvances(obraId);
  return lista[0] ?? null;
}

export async function listarFotos(avanceId: string): Promise<FotoLocal[]> {
  const db = await getDb();
  const filas = await db.getAllAsync<FilaFoto>(
    'SELECT * FROM fotos WHERE avance_id = ? AND eliminado = 0 ORDER BY creado_en', avanceId);
  return filas.map(aFoto);
}

export interface NuevoAvance {
  obraId: string;
  titulo: string;
  notas: string;
  pasosCompletados: string[];
  datosExtra: Record<string, string>;
  latitud: number | null;
  longitud: number | null;
  rutasFotos: string[]; // ya copiadas al almacenamiento permanente de la app
}

/** Guarda avance + fotos + bandeja de salida en UNA transacción: o se guarda todo o nada. */
export async function registrarAvance(n: NuevoAvance): Promise<Avance> {
  const db = await getDb();
  const obra = await obtenerObra(n.obraId);
  if (!obra) throw new Error('La obra no existe');
  const editor = await dispositivoId();
  const operador = await leerOperador();
  const t = ahora();
  const avance: Avance = {
    id: nuevoId(), obraId: n.obraId, titulo: n.titulo.trim(), notas: n.notas.trim(),
    pasosCompletados: n.pasosCompletados,
    porcentaje: calcularPorcentaje(tipoPorId(obra.tipo), n.pasosCompletados),
    datosExtra: n.datosExtra, latitud: n.latitud, longitud: n.longitud,
    registradoEn: t, registradoPor: operador, actualizadoEn: t, editadoPor: editor, eliminado: false,
  };
  await db.withTransactionAsync(async () => {
    await upsertAvance(avance);
    await encolar(db, 'avance', avance);
    for (const ruta of n.rutasFotos) {
      const foto: Foto = {
        id: nuevoId(), avanceId: avance.id, urlRemota: null,
        creadoEn: t, actualizadoEn: t, editadoPor: editor, eliminado: false,
      };
      await upsertFoto(foto, ruta);
      await encolar(db, 'foto', foto);
    }
  });
  return avance;
}

export async function eliminarAvance(id: string): Promise<void> {
  const db = await getDb();
  const a = await obtenerAvance(id);
  if (!a) return;
  const borrado: Avance = { ...a, eliminado: true, actualizadoEn: ahora(), editadoPor: await dispositivoId() };
  await db.withTransactionAsync(async () => {
    await upsertAvance(borrado);
    await encolar(db, 'avance', borrado);
  });
}

export async function upsertAvance(a: Avance): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO avances (id, obra_id, titulo, notas, pasos_completados, porcentaje, datos_extra, latitud, longitud,
        registrado_en, registrado_por, actualizado_en, editado_por, eliminado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET titulo = excluded.titulo, notas = excluded.notas,
       pasos_completados = excluded.pasos_completados, porcentaje = excluded.porcentaje,
       datos_extra = excluded.datos_extra, latitud = excluded.latitud, longitud = excluded.longitud,
       actualizado_en = excluded.actualizado_en, editado_por = excluded.editado_por, eliminado = excluded.eliminado`,
    a.id, a.obraId, a.titulo, a.notas, JSON.stringify(a.pasosCompletados), a.porcentaje,
    JSON.stringify(a.datosExtra), a.latitud, a.longitud, a.registradoEn, a.registradoPor,
    a.actualizadoEn, a.editadoPor, a.eliminado ? 1 : 0,
  );
}

/** `rutaLocal` solo se establece al crear la foto en este celular; al recibirla del servidor queda en null. */
export async function upsertFoto(f: Foto, rutaLocal: string | null = null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO fotos (id, avance_id, ruta_local, url_remota, creado_en, actualizado_en, editado_por, eliminado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET url_remota = COALESCE(excluded.url_remota, fotos.url_remota),
       actualizado_en = excluded.actualizado_en, editado_por = excluded.editado_por, eliminado = excluded.eliminado`,
    f.id, f.avanceId, rutaLocal, f.urlRemota, f.creadoEn, f.actualizadoEn, f.editadoPor, f.eliminado ? 1 : 0,
  );
}

export async function fotosPorSubir(): Promise<FotoLocal[]> {
  const db = await getDb();
  const filas = await db.getAllAsync<FilaFoto>(
    'SELECT * FROM fotos WHERE ruta_local IS NOT NULL AND url_remota IS NULL AND eliminado = 0 ORDER BY creado_en');
  return filas.map(aFoto);
}

/** Guarda la URL del servidor y vuelve a encolar la foto para que otros dispositivos la conozcan. */
export async function marcarFotoSubida(id: string, urlRemota: string): Promise<void> {
  const db = await getDb();
  const editor = await dispositivoId();
  await db.withTransactionAsync(async () => {
    const t = ahora();
    await db.runAsync('UPDATE fotos SET url_remota = ?, actualizado_en = ?, editado_por = ? WHERE id = ?',
      urlRemota, t, editor, id);
    const f = await db.getFirstAsync<FilaFoto>('SELECT * FROM fotos WHERE id = ?', id);
    if (f) {
      const { rutaLocal: _omitida, ...foto } = aFoto(f);
      await encolar(db, 'foto', foto);
    }
  });
}
