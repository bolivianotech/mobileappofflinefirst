import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sincronizar, type ApiServidor, type PuertosLocales } from '../src/sync/syncEngine.ts';

// Un "celular" falso en memoria: bandeja de salida, cursor y datos recibidos.
function crearCelular(pendientes: any[] = [], fotos: any[] = []) {
  const estado = { outbox: [...pendientes], cursor: 0, recibidos: [] as any[], errores: [] as number[], fotos: [...fotos], subidas: [] as string[] };
  const puertos: PuertosLocales = {
    leerPendientes: async (n) => estado.outbox.slice(0, n),
    marcarEnviados: async (cs) => { estado.outbox = estado.outbox.filter((o) => !cs.some((c) => c.idCambio === o.idCambio)); },
    registrarError: async (ids) => { estado.errores.push(...ids); },
    aplicarRemoto: async (c) => { estado.recibidos.push(c); },
    leerCursor: async () => estado.cursor,
    guardarCursor: async (c) => { estado.cursor = c; },
    fotosPorSubir: async () => estado.fotos,
    marcarFotoSubida: async (id) => { estado.fotos = estado.fotos.filter((f) => f.id !== id); estado.subidas.push(id); },
  };
  return { estado, puertos };
}
const cambio = (n: number) => ({ idCambio: n, entidad: 'obra' as const, id: `o${n}`, actualizadoEn: '2026-01-01T00:00:00Z', editadoPor: 'A', datos: {} as any });

function apiFalsa(extra: Partial<ApiServidor> = {}): ApiServidor {
  return {
    push: async (cs) => ({ aceptados: cs.map((c) => c.idCambio), rechazados: [] }),
    pull: async (desde) => ({ cambios: [], cursor: desde, hayMas: false }),
    subirFoto: async (f) => `/fotos/${f.id}.jpg`,
    ...extra,
  };
}

test('sin conexión: el error se propaga y NADA se pierde de la bandeja', async () => {
  const { estado, puertos } = crearCelular([cambio(1), cambio(2)]);
  const api = apiFalsa({ push: async () => { throw new Error('Network request failed'); } });
  await assert.rejects(sincronizar(puertos, api), /Network request failed/);
  assert.equal(estado.outbox.length, 2);
  assert.deepEqual(estado.errores, [1, 2]);
});

test('al volver la red, el mismo celular envía todo lo acumulado', async () => {
  const { estado, puertos } = crearCelular([cambio(1), cambio(2), cambio(3)]);
  const r = await sincronizar(puertos, apiFalsa());
  assert.equal(r.enviados, 3);
  assert.equal(estado.outbox.length, 0);
});

test('envía en lotes de 50', async () => {
  const { estado, puertos } = crearCelular(Array.from({ length: 120 }, (_, i) => cambio(i + 1)));
  const tamanos: number[] = [];
  await sincronizar(puertos, apiFalsa({ push: async (cs) => { tamanos.push(cs.length); return { aceptados: cs.map((c) => c.idCambio), rechazados: [] }; } }));
  assert.deepEqual(tamanos, [50, 50, 20]);
  assert.equal(estado.outbox.length, 0);
});

test('un conflicto perdido sale de la bandeja y se cuenta', async () => {
  const { estado, puertos } = crearCelular([cambio(1), cambio(2)]);
  const r = await sincronizar(puertos, apiFalsa({ push: async () => ({ aceptados: [1], rechazados: [2] }) }));
  assert.equal(r.enviados, 1);
  assert.equal(r.conflictosPerdidos, 1);
  assert.equal(estado.outbox.length, 0);
});

test('si el servidor no resuelve nada no hay bucle infinito', async () => {
  const { estado, puertos } = crearCelular([cambio(1)]);
  await sincronizar(puertos, apiFalsa({ push: async () => ({ aceptados: [], rechazados: [] }) }));
  assert.equal(estado.outbox.length, 1);
});

test('pull pagina, aplica todo y avanza el cursor', async () => {
  const { estado, puertos } = crearCelular();
  const paginas = [
    { cambios: [{ ...cambio(1), seq: 1 }, { ...cambio(2), seq: 2 }], cursor: 2, hayMas: true },
    { cambios: [{ ...cambio(3), seq: 3 }], cursor: 3, hayMas: false },
  ];
  let i = 0;
  const r = await sincronizar(puertos, apiFalsa({ pull: async () => paginas[i++] }));
  assert.equal(r.recibidos, 3);
  assert.equal(estado.cursor, 3);
  assert.equal(estado.recibidos.length, 3);
});

test('si el pull falla a mitad, el cursor conserva el último lote aplicado', async () => {
  const { estado, puertos } = crearCelular();
  let i = 0;
  const api = apiFalsa({ pull: async () => { if (i++ === 0) return { cambios: [{ ...cambio(1), seq: 1 }], cursor: 1, hayMas: true }; throw new Error('corte'); } });
  await assert.rejects(sincronizar(puertos, api), /corte/);
  assert.equal(estado.cursor, 1);
});

test('una foto que falla no bloquea el envío de datos', async () => {
  const foto = { id: 'f1', rutaLocal: 'file:///f1.jpg' };
  const { estado, puertos } = crearCelular([cambio(1)], [foto]);
  const r = await sincronizar(puertos, apiFalsa({ subirFoto: async () => { throw new Error('foto fallida'); } }));
  assert.equal(r.enviados, 1);
  assert.equal(r.fotosPendientes, 1);
  assert.equal(estado.fotos.length, 1);
});

test('las fotos se suben antes de enviar los datos', async () => {
  const orden: string[] = [];
  const { puertos } = crearCelular([cambio(1)], [{ id: 'f1', rutaLocal: 'x' }]);
  await sincronizar(puertos, apiFalsa({
    subirFoto: async () => { orden.push('foto'); return '/fotos/f1.jpg'; },
    push: async (cs) => { orden.push('push'); return { aceptados: cs.map((c) => c.idCambio), rechazados: [] }; },
  }));
  assert.deepEqual(orden, ['foto', 'push']);
});
