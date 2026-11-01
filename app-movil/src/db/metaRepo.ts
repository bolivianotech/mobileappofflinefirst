import { nuevoId } from '../util/id';
import { getDb } from './database';

export const URL_POR_DEFECTO = 'http://10.0.2.2:3000'; // 10.0.2.2 = tu PC visto desde el emulador Android

export async function leerMeta(clave: string): Promise<string | null> {
  const db = await getDb();
  const f = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM meta WHERE clave = ?', clave);
  return f?.valor ?? null;
}

export async function guardarMeta(clave: string, valor: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO meta (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor',
    clave,
    valor,
  );
}

/** Identificador estable de este celular. Se crea una sola vez. */
export async function dispositivoId(): Promise<string> {
  let id = await leerMeta('dispositivoId');
  if (!id) {
    id = nuevoId();
    await guardarMeta('dispositivoId', id);
  }
  return id;
}

export const leerOperador = async () => (await leerMeta('operador')) ?? '';
export const leerUrlServidor = async () => (await leerMeta('urlServidor')) ?? URL_POR_DEFECTO;
export const leerToken = async () => (await leerMeta('token')) ?? '';
export const leerCursor = async () => Number((await leerMeta('cursorPull')) ?? 0);
export const guardarCursor = (n: number) => guardarMeta('cursorPull', String(n));
