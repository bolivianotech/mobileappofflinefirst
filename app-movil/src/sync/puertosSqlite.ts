import { upsertAvance, upsertFoto, fotosPorSubir, marcarFotoSubida, obtenerAvance } from '../db/avancesRepo';
import { getDb } from '../db/database';
import { guardarCursor, leerCursor } from '../db/metaRepo';
import { obtenerObra, upsertObra } from '../db/obrasRepo';
import { leerPendientes, marcarEnviados, registrarError } from '../db/outboxRepo';
import type { Avance, CambioRemoto, Foto, Obra } from '../types';
import { ganaEntrante } from './resolverConflicto';
import type { PuertosLocales } from './syncEngine';

/** Aplica un cambio llegado del servidor, respetando "gana el último". */
async function aplicarRemoto(c: CambioRemoto): Promise<void> {
  if (c.entidad === 'obra') {
    const d = c.datos as Obra;
    if (ganaEntrante(await obtenerObra(d.id), d)) await upsertObra(d);
  } else if (c.entidad === 'avance') {
    const d = c.datos as Avance;
    if (ganaEntrante(await obtenerAvance(d.id), d)) await upsertAvance(d);
  } else if (c.entidad === 'foto') {
    const d = c.datos as Foto;
    const db = await getDb();
    const local = await db.getFirstAsync<{ actualizado_en: string; editado_por: string }>(
      'SELECT actualizado_en, editado_por FROM fotos WHERE id = ?', d.id);
    const existente = local ? { actualizadoEn: local.actualizado_en, editadoPor: local.editado_por } : null;
    if (ganaEntrante(existente, d)) await upsertFoto(d, null);
  }
}

export const puertosSqlite: PuertosLocales = {
  leerPendientes,
  marcarEnviados,
  registrarError,
  aplicarRemoto,
  leerCursor,
  guardarCursor,
  fotosPorSubir,
  marcarFotoSubida,
};
