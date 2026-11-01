import { File } from 'expo-file-system';
import { leerToken, leerUrlServidor, dispositivoId } from '../db/metaRepo';
import type { ApiServidor } from './syncEngine';

const TIEMPO_MAX_MS = 15000;

async function pedir(ruta: string, init: RequestInit = {}): Promise<Response> {
  const base = (await leerUrlServidor()).replace(/\/$/, '');
  const token = await leerToken();
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_MAX_MS);
  try {
    const resp = await fetch(base + ruta, {
      ...init,
      signal: control.signal,
      headers: { ...(init.headers as object), ...(token ? { 'x-token': token } : {}), 'x-dispositivo': await dispositivoId() },
    });
    if (!resp.ok) throw new Error(`Servidor respondió ${resp.status}`);
    return resp;
  } finally {
    clearTimeout(reloj);
  }
}

export const apiHttp: ApiServidor = {
  async push(cambios) {
    const resp = await pedir('/sync/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cambios }),
    });
    return resp.json();
  },
  async pull(desde, limite) {
    const resp = await pedir(`/sync/pull?desde=${desde}&limite=${limite}`);
    return resp.json();
  },
  async subirFoto(foto) {
    if (!foto.rutaLocal) throw new Error('La foto no está en este dispositivo');
    // En expo-file-system, File se comporta como un Blob: puede ir directo en el body.
    const resp = await pedir(`/fotos/${foto.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'image/jpeg' },
      body: new File(foto.rutaLocal),
    });
    return (await resp.json()).url as string;
  },
};

export async function probarConexion(): Promise<boolean> {
  try {
    await pedir('/salud');
    return true;
  } catch {
    return false;
  }
}
