import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { crearApp } from '../src/servidor.js';
import { Almacen, ganaEntrante } from '../src/almacen.js';

function iniciar(opciones = {}) {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'fotos-'));
  const app = crearApp({ carpetaFotos: carpeta, ...opciones });
  return new Promise((resolve) => {
    const srv = app.listen(0, () => resolve({ srv, base: `http://127.0.0.1:${srv.address().port}`, app }));
  });
}
const cambio = (extra) => ({
  idCambio: 1, entidad: 'obra', id: 'o1', actualizadoEn: '2026-01-01T10:00:00.000Z', editadoPor: 'A',
  datos: { id: 'o1', nombre: 'Casa', eliminado: false }, ...extra,
});
const post = (base, cuerpo, headers = {}) =>
  fetch(`${base}/sync/push`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(cuerpo) });

test('ganaEntrante: el más reciente gana y el empate se resuelve por dispositivo', () => {
  const base = { actualizadoEn: '2026-01-01T10:00:00.000Z', editadoPor: 'B' };
  assert.equal(ganaEntrante(null, base), true);
  assert.equal(ganaEntrante(base, { ...base, actualizadoEn: '2026-01-01T10:00:01.000Z' }), true);
  assert.equal(ganaEntrante(base, { ...base, actualizadoEn: '2026-01-01T09:59:59.000Z' }), false);
  assert.equal(ganaEntrante(base, { ...base, editadoPor: 'A' }), false);
  assert.equal(ganaEntrante(base, { ...base, editadoPor: 'C' }), true);
});

test('push + pull: lo que sube un celular lo baja otro', async () => {
  const { srv, base } = await iniciar();
  try {
    const r = await (await post(base, { cambios: [cambio({})] })).json();
    assert.deepEqual(r, { aceptados: [1], rechazados: [] });
    const p = await (await fetch(`${base}/sync/pull?desde=0`)).json();
    assert.equal(p.cambios.length, 1);
    assert.equal(p.cursor, 1);
    assert.equal(p.hayMas, false);
    assert.equal(p.cambios[0].datos.nombre, 'Casa');
    const vacio = await (await fetch(`${base}/sync/pull?desde=${p.cursor}`)).json();
    assert.equal(vacio.cambios.length, 0);
  } finally { srv.close(); }
});

test('reenviar el mismo cambio es seguro (idempotencia)', async () => {
  const { srv, base } = await iniciar();
  try {
    await post(base, { cambios: [cambio({})] });
    await post(base, { cambios: [cambio({})] });
    const p = await (await fetch(`${base}/sync/pull?desde=0`)).json();
    assert.equal(p.cambios.length, 1);
  } finally { srv.close(); }
});

test('conflicto: un cambio más viejo es rechazado', async () => {
  const { srv, base } = await iniciar();
  try {
    await post(base, { cambios: [cambio({ actualizadoEn: '2026-01-01T12:00:00.000Z', datos: { nombre: 'Nuevo' } })] });
    const r = await (await post(base, { cambios: [cambio({ idCambio: 7, actualizadoEn: '2026-01-01T11:00:00.000Z', editadoPor: 'B', datos: { nombre: 'Viejo' } })] })).json();
    assert.deepEqual(r.rechazados, [7]);
    const p = await (await fetch(`${base}/sync/pull?desde=0`)).json();
    assert.equal(p.cambios[0].datos.nombre, 'Nuevo');
  } finally { srv.close(); }
});

test('pull pagina con hayMas', async () => {
  const { srv, base } = await iniciar();
  try {
    const cambios = [1, 2, 3].map((n) => cambio({ idCambio: n, id: `o${n}`, datos: { id: `o${n}` } }));
    await post(base, { cambios });
    const p1 = await (await fetch(`${base}/sync/pull?desde=0&limite=2`)).json();
    assert.equal(p1.cambios.length, 2);
    assert.equal(p1.hayMas, true);
    const p2 = await (await fetch(`${base}/sync/pull?desde=${p1.cursor}&limite=2`)).json();
    assert.equal(p2.cambios.length, 1);
    assert.equal(p2.hayMas, false);
  } finally { srv.close(); }
});

test('rechaza cambios mal formados y exige token si está configurado', async () => {
  const { srv, base } = await iniciar({ token: 'secreto' });
  try {
    assert.equal((await post(base, { cambios: [cambio({})] })).status, 401);
    assert.equal((await post(base, { cambios: [{ entidad: 'raro' }] }, { 'x-token': 'secreto' })).status, 400);
    assert.equal((await fetch(`${base}/salud`)).status, 200);
  } finally { srv.close(); }
});

test('fotos: se suben, se descargan y subir dos veces no duplica', async () => {
  const { srv, base } = await iniciar();
  try {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    for (let i = 0; i < 2; i++) {
      const r = await fetch(`${base}/fotos/abc-123`, { method: 'PUT', headers: { 'content-type': 'image/jpeg' }, body: bytes });
      assert.equal((await r.json()).url, '/fotos/abc-123.jpg');
    }
    const g = await fetch(`${base}/fotos/abc-123.jpg`);
    assert.deepEqual(Buffer.from(await g.arrayBuffer()), bytes);
    assert.equal((await fetch(`${base}/fotos/no-existe.jpg`)).status, 404);
  } finally { srv.close(); }
});

test('el panel escapa HTML (no hay XSS desde nombres de obra)', async () => {
  const { srv, base } = await iniciar();
  try {
    await post(base, { cambios: [cambio({ datos: { id: 'o1', nombre: '<script>alert(1)</script>', tipo: 'x', cliente: '', eliminado: false } })] });
    const html = await (await fetch(`${base}/`)).text();
    assert.ok(!html.includes('<script>alert'));
    assert.ok(html.includes('&lt;script&gt;'));
  } finally { srv.close(); }
});

test('el almacén persiste a disco y se recupera', () => {
  const archivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'alm-')), 'estado.json');
  const a = new Almacen(archivo);
  a.aplicar(cambio({}));
  const b = new Almacen(archivo);
  assert.equal(b.seq, 1);
  assert.equal(b.desde(0).cambios.length, 1);
});
