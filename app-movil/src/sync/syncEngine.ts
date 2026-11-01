// Motor de sincronización. No conoce SQLite ni HTTP: solo "puertos" (interfaces).
// Por eso se puede probar en Node con datos falsos (tests/syncEngine.test.ts).
import type { CambioLocal, CambioRemoto, FotoLocal } from '../types';

export interface PuertosLocales {
  leerPendientes(limite: number): Promise<CambioLocal[]>;
  marcarEnviados(cambios: { idCambio: number; actualizadoEn: string }[]): Promise<void>;
  registrarError(ids: number[], mensaje: string): Promise<void>;
  aplicarRemoto(cambio: CambioRemoto): Promise<void>;
  leerCursor(): Promise<number>;
  guardarCursor(cursor: number): Promise<void>;
  fotosPorSubir(): Promise<FotoLocal[]>;
  marcarFotoSubida(id: string, urlRemota: string): Promise<void>;
}

export interface ApiServidor {
  push(cambios: CambioLocal[]): Promise<{ aceptados: number[]; rechazados: number[] }>;
  pull(desde: number, limite: number): Promise<{ cambios: CambioRemoto[]; cursor: number; hayMas: boolean }>;
  subirFoto(foto: FotoLocal): Promise<string>; // devuelve la URL remota
}

export interface ResultadoSync {
  enviados: number;
  recibidos: number;
  fotosSubidas: number;
  fotosPendientes: number;
  conflictosPerdidos: number;
}

const LOTE_PUSH = 50;
const LOTE_PULL = 100;

/**
 * Orden: 1) subir fotos  2) enviar cambios  3) bajar cambios.
 * Si algo falla por red, lanza el error: lo que no se envió sigue en la bandeja.
 */
export async function sincronizar(local: PuertosLocales, api: ApiServidor): Promise<ResultadoSync> {
  const r: ResultadoSync = { enviados: 0, recibidos: 0, fotosSubidas: 0, fotosPendientes: 0, conflictosPerdidos: 0 };

  // 1) Fotos: un fallo de una foto no debe bloquear los datos; se reintenta en la próxima.
  for (const foto of await local.fotosPorSubir()) {
    try {
      await local.marcarFotoSubida(foto.id, await api.subirFoto(foto));
      r.fotosSubidas += 1;
    } catch {
      r.fotosPendientes += 1;
    }
  }

  // 2) Push por lotes.
  for (;;) {
    const lote = await local.leerPendientes(LOTE_PUSH);
    if (lote.length === 0) break;
    try {
      const resp = await api.push(lote);
      const resueltos = new Set([...resp.aceptados, ...resp.rechazados]);
      await local.marcarEnviados(lote.filter((c) => resueltos.has(c.idCambio)));
      r.enviados += resp.aceptados.length;
      r.conflictosPerdidos += resp.rechazados.length;
      if (resueltos.size === 0) break; // el servidor no resolvió nada: evita un bucle infinito
    } catch (e) {
      await local.registrarError(lote.map((c) => c.idCambio), mensajeDe(e));
      throw e;
    }
  }

  // 3) Pull por lotes, guardando el cursor SOLO después de aplicar cada lote.
  for (;;) {
    const cursor = await local.leerCursor();
    const resp = await api.pull(cursor, LOTE_PULL);
    for (const c of resp.cambios) await local.aplicarRemoto(c);
    r.recibidos += resp.cambios.length;
    if (resp.cursor !== cursor) await local.guardarCursor(resp.cursor);
    if (!resp.hayMas) break;
  }
  return r;
}

const mensajeDe = (e: unknown) => (e instanceof Error ? e.message : String(e));
