import { crearApp } from './servidor.js';

const puerto = Number(process.env.PORT ?? 3000);
const app = crearApp({
  archivo: process.env.ARCHIVO ?? './datos/estado.json',
  carpetaFotos: process.env.FOTOS ?? './datos/fotos',
  token: process.env.TOKEN ?? '',
});
app.listen(puerto, '0.0.0.0', () => {
  console.log(`Servidor de sincronización escuchando en http://0.0.0.0:${puerto}`);
  if (!process.env.TOKEN) console.log('Aviso: sin TOKEN. Define TOKEN=... antes de exponerlo fuera de tu red local.');
});
