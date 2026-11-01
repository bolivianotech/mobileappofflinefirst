import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { Almacen } from './almacen.js';

const ENTIDADES = new Set(['obra', 'avance', 'foto']);
const escapar = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Crea la app Express.
 * @param {{archivo?: string|null, carpetaFotos?: string, token?: string}} opciones
 */
export function crearApp({ archivo = null, carpetaFotos = './datos/fotos', token = '' } = {}) {
  const almacen = new Almacen(archivo);
  fs.mkdirSync(carpetaFotos, { recursive: true });
  const app = express();

  app.use((req, res, next) => {
    if (token && req.path !== '/salud' && req.get('x-token') !== token) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    next();
  });

  app.get('/salud', (_req, res) => res.json({ ok: true }));

  // 1) El celular envía sus cambios pendientes (la "bandeja de salida").
  app.post('/sync/push', express.json({ limit: '2mb' }), (req, res) => {
    const { cambios } = req.body ?? {};
    if (!Array.isArray(cambios)) return res.status(400).json({ error: 'Falta "cambios"' });
    const aceptados = [];
    const rechazados = [];
    for (const c of cambios) {
      if (!ENTIDADES.has(c.entidad) || !c.id || !c.actualizadoEn) {
        return res.status(400).json({ error: `Cambio inválido: ${JSON.stringify(c).slice(0, 80)}` });
      }
      (almacen.aplicar(c) === 'aceptado' ? aceptados : rechazados).push(c.idCambio);
    }
    res.json({ aceptados, rechazados });
  });

  // 2) El celular pide todo lo nuevo desde su último cursor.
  app.get('/sync/pull', (req, res) => {
    const desde = Number(req.query.desde ?? 0) || 0;
    const limite = Math.min(Number(req.query.limite ?? 100) || 100, 500);
    res.json(almacen.desde(desde, limite));
  });

  // 3) Fotos: archivo binario, idempotente (subir dos veces la misma foto no duplica).
  app.put('/fotos/:id', express.raw({ type: '*/*', limit: '15mb' }), (req, res) => {
    const id = req.params.id.replace(/[^a-zA-Z0-9-]/g, '');
    if (!id || !req.body?.length) return res.status(400).json({ error: 'Foto vacía' });
    fs.writeFileSync(path.join(carpetaFotos, `${id}.jpg`), req.body);
    res.json({ url: `/fotos/${id}.jpg` });
  });
  app.get('/fotos/:archivo', (req, res) => {
    const archivoFoto = path.join(carpetaFotos, path.basename(req.params.archivo));
    if (!fs.existsSync(archivoFoto)) return res.status(404).end();
    res.type('image/jpeg').sendFile(path.resolve(archivoFoto));
  });

  // 4) Panel simple para ver desde el navegador qué llegó.
  app.get('/', (_req, res) => {
    const obras = almacen.lista('obra');
    const avances = almacen.lista('avance');
    const filas = obras
      .map((o) => {
        const suyos = avances.filter((a) => a.obraId === o.id).sort((a, b) => b.registradoEn.localeCompare(a.registradoEn));
        return `<tr><td>${escapar(o.nombre)}</td><td>${escapar(o.tipo)}</td><td>${escapar(o.cliente)}</td><td>${suyos.length}</td><td>${suyos[0]?.porcentaje ?? 0}%</td></tr>`;
      })
      .join('');
    res.type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Servidor de avances</title>
<body style="font-family:Calibri,Arial,sans-serif;margin:16px;color:#1F2937">
<h1 style="color:#223B82">Obras sincronizadas</h1>
<table border="1" cellpadding="6" style="border-collapse:collapse">
<tr style="background:#223B82;color:#fff"><th>Obra</th><th>Tipo</th><th>Cliente</th><th>Avances</th><th>Progreso</th></tr>
${filas || '<tr><td colspan="5">Aún no llegó ninguna obra.</td></tr>'}</table>
<p>Cursor actual: ${almacen.seq}</p></body>`);
  });

  app.locals.almacen = almacen;
  return app;
}
