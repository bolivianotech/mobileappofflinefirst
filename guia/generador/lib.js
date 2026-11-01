// Biblioteca de diapositivas con la identidad visual UPDS (Manual de Identidad Corporativa 2022).
// Títulos: Arial Black · Cuerpo: Calibri · Colores: solo paleta oficial (y tintes claros permitidos).
const path = require('path');
const pptxgen = require('pptxgenjs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa6');

const K = {
  azul: '223B82', azulMedio: '0085C0', celeste: '27BCEE', gris: 'C1C0C0', verde: '00A08C',
  texto: '1F2937', suave: '4B5563', blanco: 'FFFFFF',
  tinteAzul: 'EEF2FA', tinteCeleste: 'E6F6FD', grisClaro: 'F3F4F6',
};
const F = { titulo: 'Arial Black', cuerpo: 'Calibri', codigo: 'Courier New' };
const W = 13.333, H = 7.5, MX = 0.6, CW = W - 2 * MX;
const LOGO = path.join(__dirname, 'assets', 'isologo_upds.png');

// ---------- Iconos (react-icons → PNG) ----------
const ICONOS = {
  movil: fa.FaMobileScreen, db: fa.FaDatabase, nube: fa.FaCloud, camara: fa.FaCamera, gps: fa.FaLocationDot,
  wifi: fa.FaWifi, sinwifi: fa.FaWifiSlash ?? fa.FaWifi, llave: fa.FaWrench, fuego: fa.FaFire, antena: fa.FaSatelliteDish,
  obra: fa.FaHelmetSafety, check: fa.FaCheck, lapiz: fa.FaPen, cohete: fa.FaRocket, libro: fa.FaBook,
  git: fa.FaGitAlt, codigo: fa.FaCode, alerta: fa.FaTriangleExclamation, idea: fa.FaLightbulb,
  lista: fa.FaClipboardCheck, sync: fa.FaArrowsRotate, servidor: fa.FaServer, usuario: fa.FaUserGear,
  prueba: fa.FaFlask, caja: fa.FaBoxOpen, escudo: fa.FaShieldHalved, mapa: fa.FaMap, grupo: fa.FaPeopleGroup,
  flag: fa.FaFlagCheckered, ojo: fa.FaEye, bateria: fa.FaBatteryHalf, cubo: fa.FaCubes, pantalla: fa.FaTableColumns,
  terminal: fa.FaTerminal, estrella: fa.FaStar, bandeja: fa.FaInbox, enviar: fa.FaPaperPlane,
};
const cacheIconos = new Map();
async function precargarIconos() {
  for (const [nombre, Comp] of Object.entries(ICONOS)) {
    for (const color of [K.blanco, K.azul, K.azulMedio, K.verde]) {
      const svg = renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: 256 }));
      const png = await sharp(Buffer.from(svg)).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      cacheIconos.set(`${nombre}|${color}`, 'image/png;base64,' + png.toString('base64'));
    }
  }
}
function icono(slide, nombre, color, x, y, d, extra = {}) {
  const data = cacheIconos.get(`${nombre}|${color}`);
  if (!data) throw new Error(`Icono desconocido: ${nombre}|${color}`);
  slide.addImage({ data, x, y, w: d, h: d, altText: `Icono ${nombre}`, ...extra });
}
function circuloIcono(slide, nombre, x, y, d, fondo = K.azul) {
  slide.addShape('ellipse', { x, y, w: d, h: d, fill: { color: fondo }, line: { color: fondo, width: 0 } });
  const i = d * 0.5;
  icono(slide, nombre, K.blanco, x + (d - i) / 2, y + (d - i) / 2, i);
}

// ---------- Creación del deck ----------
function crearDeck({ numero, titulo, autor = 'UPDS · Guía offline-first' }) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = autor;
  pres.company = 'Universidad Privada Domingo Savio';
  pres.title = `Módulo ${numero} · ${titulo}`;
  pres.theme = { headFontFace: F.titulo, bodyFontFace: F.cuerpo };

  const pie = [
    { line: { x: MX, y: 6.95, w: CW, h: 0, line: { color: K.celeste, width: 1.5 } } },
    { text: { text: 'Universidad Privada Domingo Savio', options: { x: MX, y: 7.0, w: 4.5, h: 0.32, fontFace: F.cuerpo, fontSize: 11, color: K.suave, margin: 0 } } },
    { text: { text: `Módulo ${numero} · ${titulo}`, options: { x: 4.9, y: 7.0, w: 3.6, h: 0.32, fontFace: F.cuerpo, fontSize: 11, color: K.suave, align: 'center', margin: 0 } } },
  ];
  const tituloPh = (w) => ({ placeholder: { options: { name: 'title', type: 'title', x: MX, y: 0.35, w, h: 0.95, fontFace: F.titulo, fontSize: 26, color: K.azul, align: 'left', valign: 'middle', margin: 0 }, text: '' } });
  pres.defineSlideMaster({
    title: 'CONTENIDO', background: { color: K.blanco },
    objects: [...pie, tituloPh(CW)],
    slideNumber: { x: 11.7, y: 7.0, w: 1.03, h: 0.32, fontFace: F.cuerpo, fontSize: 11, color: K.suave, align: 'right' },
  });
  pres.defineSlideMaster({
    title: 'BITACORA', background: { color: K.tinteCeleste },
    objects: [
      ...pie, tituloPh(9.2),
      { rect: { x: 10.1, y: 0.55, w: 2.63, h: 0.5, fill: { color: K.azul } } },
      { text: { text: '✎  MI BITÁCORA', options: { x: 10.1, y: 0.55, w: 2.63, h: 0.5, fontFace: F.titulo, fontSize: 13, color: K.blanco, align: 'center', valign: 'middle', margin: 0 } } },
    ],
    slideNumber: { x: 11.7, y: 7.0, w: 1.03, h: 0.32, fontFace: F.cuerpo, fontSize: 11, color: K.suave, align: 'right' },
  });
  pres.defineSlideMaster({ title: 'PORTADA', background: { color: K.blanco } });
  pres.defineSlideMaster({ title: 'CIERRE', background: { color: K.blanco } });

  const nueva = (layout, spec) => {
    const s = pres.addSlide({ masterName: layout });
    if (spec.notas) s.addNotes(spec.notas);
    return s;
  };
  const conTitulo = (layout, spec) => {
    const s = nueva(layout, spec);
    s.addText(spec.titulo, { placeholder: 'title' });
    return s;
  };

  const B = {};

  B.portada = (spec) => {
    const s = nueva('PORTADA', spec);
    s.addImage({ path: LOGO, x: MX, y: 0.5, w: 1.9, h: 1.9, altText: 'Isologo UPDS' });
    s.addText(spec.titulo, { x: MX, y: 2.7, w: 7.0, h: 2.1, fontFace: F.titulo, fontSize: 36, color: K.azul, valign: 'top', margin: 0, isTextBox: true });
    s.addText(spec.subtitulo, { x: MX, y: 4.9, w: 7.0, h: 0.9, fontFace: F.cuerpo, fontSize: 20, color: K.texto, valign: 'top', margin: 0, isTextBox: true });
    s.addText(spec.meta ?? '', { x: MX, y: 6.2, w: 7.0, h: 0.5, fontFace: F.cuerpo, fontSize: 16, color: K.suave, margin: 0, isTextBox: true });
    s.addShape('rect', { x: 8.4, y: 0, w: W - 8.4, h: H, fill: { color: K.azul }, line: { color: K.azul, width: 0 } });
    s.addText(String(numero), { x: 8.4, y: 1.2, w: W - 8.4, h: 3.0, fontFace: F.titulo, fontSize: 150, color: K.blanco, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText('MÓDULO', { x: 8.4, y: 0.8, w: W - 8.4, h: 0.5, fontFace: F.titulo, fontSize: 18, color: K.celeste, align: 'center', margin: 0, isTextBox: true });
    circuloIcono(s, spec.icono ?? 'movil', 10.2, 4.5, 1.0, K.azulMedio);
    s.addText('Guía paso a paso · App móvil offline-first para registrar avances de obra', { x: 8.9, y: 5.8, w: 3.9, h: 0.9, fontFace: F.cuerpo, fontSize: 16, color: K.blanco, align: 'center', margin: 0, isTextBox: true });
  };

  B.objetivos = (spec) => {
    const s = conTitulo('CONTENIDO', spec);
    const n = spec.items.length, gap = 0.3, w = (CW - gap * (n - 1)) / n;
    spec.items.forEach((it, i) => {
      const x = MX + i * (w + gap);
      s.addShape('roundRect', { x, y: 1.7, w, h: 4.3, rectRadius: 0.12, fill: { color: K.tinteAzul }, line: { color: K.tinteAzul, width: 0 } });
      circuloIcono(s, it.icono, x + 0.3, 2.0, 0.85, K.azul);
      s.addText(it.titulo, { x: x + 0.3, y: 3.1, w: w - 0.6, h: 0.9, fontFace: F.cuerpo, fontSize: 19, bold: true, color: K.azul, valign: 'top', margin: 0, isTextBox: true });
      s.addText(it.texto, { x: x + 0.3, y: 4.05, w: w - 0.6, h: 2.4, fontFace: F.cuerpo, fontSize: 17, color: K.texto, valign: 'top', margin: 0, isTextBox: true });
    });
  };

  const parrafos = (puntos, tam, color = K.texto) => {
    const runs = [];
    puntos.forEach((p) => {
      if (typeof p === 'string') runs.push({ text: p, options: { bullet: true, breakLine: true, fontSize: tam, color } });
      else {
        runs.push({ text: p.t, options: { bullet: true, bold: true, color: K.azul, fontSize: tam } });
        runs.push({ text: ' — ' + p.d, options: { breakLine: true, fontSize: tam, color } });
      }
    });
    return runs;
  };

  B.concepto = (spec) => {
    const s = conTitulo('CONTENIDO', spec);
    s.addText(parrafos(spec.puntos, 18), { x: MX, y: 1.6, w: 7.4, h: 5.1, fontFace: F.cuerpo, valign: 'top', paraSpaceAfter: 12, margin: 0, isTextBox: true });
    const L = spec.lateral;
    s.addShape('roundRect', { x: 8.5, y: 1.7, w: 4.23, h: 4.9, rectRadius: 0.12, fill: { color: K.azul }, line: { color: K.azul, width: 0 } });
    if (L.icono) circuloIcono(s, L.icono, 8.5 + (4.23 - 1.0) / 2, 2.0, 1.0, K.azulMedio);
    if (L.grande) s.addText(L.grande, { x: 8.7, y: L.icono ? 3.2 : 2.3, w: 3.83, h: 1.5, fontFace: F.titulo, fontSize: L.tam ?? 48, color: K.blanco, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText(L.etiqueta, { x: 8.8, y: L.icono ? 4.8 : 4.0, w: 3.63, h: 1.6, fontFace: F.cuerpo, fontSize: 17, color: K.blanco, align: 'center', valign: 'top', margin: 0, isTextBox: true });
  };

  B.comparar = (spec) => {
    const s = conTitulo('CONTENIDO', spec);
    [spec.izq, spec.der].forEach((c, i) => {
      const x = MX + i * (5.9 + 0.33);
      s.addShape('roundRect', { x, y: 1.7, w: 5.9, h: 4.3, rectRadius: 0.1, fill: { color: K.blanco }, line: { color: c.color, width: 1.5 } });
      s.addShape('rect', { x, y: 1.7, w: 5.9, h: 0.75, fill: { color: c.color }, line: { color: c.color, width: 0 } });
      s.addText(c.titulo, { x: x + 0.3, y: 1.7, w: 5.3, h: 0.75, fontFace: F.cuerpo, fontSize: 20, bold: true, color: K.blanco, valign: 'middle', margin: 0, isTextBox: true });
      s.addText(parrafos(c.items, 19), { x: x + 0.3, y: 2.7, w: 5.3, h: 3.8, fontFace: F.cuerpo, valign: 'top', paraSpaceAfter: 14, margin: 0, isTextBox: true });
    });
  };

  B.pasos = (spec) => {
    const s = conTitulo('CONTENIDO', spec);
    const n = spec.pasos.length, dos = n > 5, porCol = dos ? Math.ceil(n / 2) : n;
    const ancho = dos ? 5.9 : CW, alto = Math.min(1.45, 5.1 / porCol);
    spec.pasos.forEach((p, i) => {
      const col = dos ? Math.floor(i / porCol) : 0, fila = i % porCol;
      const x = MX + col * (ancho + 0.33), y = 1.65 + fila * alto;
      s.addShape('ellipse', { x, y: y + 0.05, w: 0.6, h: 0.6, fill: { color: K.azulMedio }, line: { color: K.azulMedio, width: 0 } });
      s.addText(String(i + 1), { x, y: y + 0.05, w: 0.6, h: 0.6, fontFace: F.cuerpo, fontSize: 20, bold: true, color: K.blanco, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
      s.addText([
        { text: p.t, options: { bold: true, color: K.azul, fontSize: 19, breakLine: true } },
        { text: p.d ?? '', options: { color: K.texto, fontSize: 16 } },
      ], { x: x + 0.85, y, w: ancho - 0.85, h: alto - 0.05, fontFace: F.cuerpo, valign: 'top', margin: 0, isTextBox: true });
    });
  };

  B.codigo = (spec) => {
    const s = conTitulo('CONTENIDO', spec);
    const pw = spec.anchoCodigo ?? 7.7;
    const lineas = spec.codigo.split('\n');
    const maxLen = Math.max(...lineas.map((l) => l.length));
    // Tamaño automático: que ninguna línea se corte y que todo quepa en el panel.
    const porAncho = ((pw - 0.5) * 72) / (0.6 * maxLen), porAlto = (4.4 * 72) / (1.2 * lineas.length);
    const tam = Math.max(10.5, Math.floor(Math.min(14, porAncho, porAlto) * 2) / 2);
    const alto = Math.max(3.4, Math.min(5.2, (lineas.length * tam * 1.2) / 72 + 1.0));
    s.addShape('roundRect', { x: MX, y: 1.55, w: pw, h: alto, rectRadius: 0.08, fill: { color: K.texto }, line: { color: K.texto, width: 0 } });
    s.addText(spec.archivo, { x: MX + 0.25, y: 1.65, w: pw - 0.5, h: 0.35, fontFace: F.codigo, fontSize: 12, bold: true, color: K.celeste, margin: 0, isTextBox: true });
    s.addText(spec.codigo, { x: MX + 0.25, y: 2.1, w: pw - 0.5, h: alto - 0.65, fontFace: F.codigo, fontSize: tam, color: K.grisClaro, valign: 'top', margin: 0, isTextBox: true });
    const nx = MX + pw + 0.35, nw = W - MX - nx;
    s.addText(spec.encabezado ?? 'Fíjate en…', { x: nx, y: 1.55, w: nw, h: 0.4, fontFace: F.cuerpo, fontSize: 18, bold: true, color: K.azulMedio, margin: 0, isTextBox: true });
    s.addText(parrafos(spec.notas, 16), { x: nx, y: 2.05, w: nw, h: 4.7, fontFace: F.cuerpo, valign: 'top', paraSpaceAfter: 10, margin: 0, isTextBox: true });
  };

  B.diagrama = (spec) => {
    const s = conTitulo('CONTENIDO', spec);
    const n = spec.cajas.length, flecha = 0.5, w = (CW - flecha * (n - 1)) / n;
    spec.cajas.forEach((c, i) => {
      const x = MX + i * (w + flecha);
      s.addShape('roundRect', { x, y: 1.75, w, h: 3.2, rectRadius: 0.1, fill: { color: c.color ?? K.azul }, line: { color: c.color ?? K.azul, width: 0 } });
      circuloIcono(s, c.icono, x + (w - 0.7) / 2, 1.95, 0.7, K.blanco === c.color ? K.azul : K.azulMedio === c.color ? K.azul : K.azulMedio);
      s.addText(c.t, { x: x + 0.1, y: 2.8, w: w - 0.2, h: 0.55, fontFace: F.cuerpo, fontSize: 18, bold: true, color: K.blanco, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
      s.addText(c.d, { x: x + 0.15, y: 3.4, w: w - 0.3, h: 1.45, fontFace: F.cuerpo, fontSize: 14, color: K.blanco, align: 'center', valign: 'top', margin: 0, isTextBox: true });
      if (i < n - 1) s.addShape('line', { x: x + w + 0.05, y: 3.35, w: flecha - 0.1, h: 0, line: { color: K.suave, width: 2.5, endArrowType: 'triangle' } });
    });
    if (spec.pie) {
      s.addShape('roundRect', { x: MX, y: 5.2, w: CW, h: 1.45, rectRadius: 0.1, fill: { color: K.tinteCeleste }, line: { color: K.tinteCeleste, width: 0 } });
      s.addText(spec.pie, { x: MX + 0.3, y: 5.25, w: CW - 0.6, h: 1.35, fontFace: F.cuerpo, fontSize: 16, color: K.texto, valign: 'middle', margin: 0, isTextBox: true });
    }
  };

  B.tabla = (spec) => {
    const s = conTitulo(spec.bitacora ? 'BITACORA' : 'CONTENIDO', spec);
    const filas = [spec.cabecera.map((t) => ({ text: t, options: { bold: true, color: K.blanco, fill: { color: K.azul }, fontSize: 15, fontFace: F.cuerpo, valign: 'middle' } }))];
    spec.filas.forEach((f, i) => filas.push(f.map((t, j) => ({ text: t, options: { color: K.texto, fontSize: spec.tam ?? 15, fontFace: F.cuerpo, bold: j === 0, fill: { color: spec.bitacora || i % 2 ? K.blanco : K.tinteAzul }, valign: 'middle' } }))));
    s.addTable(filas, { x: MX, y: 1.6, w: CW, colW: spec.anchos, border: { type: 'solid', pt: 0.5, color: K.gris }, margin: [0.06, 0.1, 0.06, 0.1], autoPage: false, rowH: spec.filaAlto ?? 0.5 });
    if (spec.pie) s.addText(spec.pie, { x: MX, y: 6.25, w: CW, h: 0.55, fontFace: F.cuerpo, fontSize: 14, italic: true, color: K.suave, margin: 0, isTextBox: true });
  };

  B.captura = (spec) => {
    const s = conTitulo('BITACORA', spec);
    s.addShape('roundRect', { x: MX, y: 1.6, w: 6.9, h: 4.3, rectRadius: 0.1, fill: { color: K.blanco }, line: { color: K.azulMedio, width: 2, dashType: 'dash' } });
    icono(s, 'camara', K.azulMedio, MX + 3.0, 2.75, 0.9);
    s.addText('Pega aquí tu captura de pantalla', { x: MX + 0.3, y: 3.75, w: 6.3, h: 0.5, fontFace: F.cuerpo, fontSize: 19, bold: true, color: K.suave, align: 'center', margin: 0, isTextBox: true });
    s.addText(spec.pista ?? 'Insertar → Imagen, o Ctrl+V', { x: MX + 0.3, y: 4.25, w: 6.3, h: 0.4, fontFace: F.cuerpo, fontSize: 14, color: K.suave, align: 'center', margin: 0, isTextBox: true });
    s.addText(spec.instruccion, { x: MX, y: 6.0, w: 6.9, h: 0.8, fontFace: F.cuerpo, fontSize: 14.5, italic: true, color: K.texto, valign: 'top', margin: 0, isTextBox: true });
    const x = 7.9, w = W - MX - x;
    s.addText('Verifica antes de capturar', { x, y: 1.6, w, h: 0.4, fontFace: F.cuerpo, fontSize: 17, bold: true, color: K.azul, margin: 0, isTextBox: true });
    spec.verificar.forEach((v, i) => {
      const y = 2.1 + i * 0.58;
      s.addShape('rect', { x, y: y + 0.07, w: 0.3, h: 0.3, fill: { color: K.blanco }, line: { color: K.azul, width: 1.5 } });
      s.addText(v, { x: x + 0.45, y, w: w - 0.45, h: 0.52, fontFace: F.cuerpo, fontSize: 15, color: K.texto, valign: 'middle', margin: 0, isTextBox: true });
    });
    const y0 = 2.1 + spec.verificar.length * 0.58 + 0.2;
    spec.campos.forEach((c, i) => {
      const y = y0 + i * 1.12;
      s.addText(c, { x, y, w, h: 0.3, fontFace: F.cuerpo, fontSize: 14, bold: true, color: K.azul, margin: 0, isTextBox: true });
      s.addShape('rect', { x, y: y + 0.33, w, h: 0.7, fill: { color: K.blanco }, line: { color: K.gris, width: 1 } });
    });
  };

  B.campos = (spec) => {
    const s = conTitulo('BITACORA', spec);
    let y = 1.55, col = 0;
    if (spec.intro) { s.addText(spec.intro, { x: MX, y, w: CW, h: 0.55, fontFace: F.cuerpo, fontSize: 15, italic: true, color: K.texto, valign: 'top', margin: 0, isTextBox: true }); y += 0.6; }
    const colW = 5.9;
    let filaAlto = 0;
    spec.campos.forEach((c) => {
      const alto = c.alto ?? 0.55, completo = c.completo || false;
      if (completo && col === 1) { y += filaAlto + 0.5; col = 0; filaAlto = 0; }
      const x = MX + col * (colW + 0.33), w = completo ? CW : colW;
      s.addText(c.etiqueta, { x, y, w, h: 0.3, fontFace: F.cuerpo, fontSize: 14, bold: true, color: K.azul, margin: 0, isTextBox: true });
      s.addShape('rect', { x, y: y + 0.33, w, h: alto, fill: { color: K.blanco }, line: { color: K.gris, width: 1 } });
      if (c.pista) s.addText(c.pista, { x: x + 0.12, y: y + 0.33, w: w - 0.24, h: alto, fontFace: F.cuerpo, fontSize: 13, italic: true, color: K.suave, valign: 'middle', margin: 0, isTextBox: true });
      filaAlto = Math.max(filaAlto, alto);
      if (completo || col === 1) { y += filaAlto + 0.5; col = 0; filaAlto = 0; } else col = 1;
    });
  };

  B.reto = (spec) => {
    const s = conTitulo('CONTENIDO', spec);
    s.addShape('roundRect', { x: MX, y: 1.6, w: 6.2, h: 5.1, rectRadius: 0.12, fill: { color: K.azul }, line: { color: K.azul, width: 0 } });
    s.addText('★ TU RETO DE PERSONALIZACIÓN', { x: MX + 0.35, y: 1.8, w: 5.5, h: 0.4, fontFace: F.cuerpo, fontSize: 14, bold: true, color: K.celeste, margin: 0, isTextBox: true });
    s.addText(spec.enunciado, { x: MX + 0.35, y: 2.3, w: 5.5, h: 1.5, fontFace: F.cuerpo, fontSize: 20, bold: true, color: K.blanco, valign: 'top', margin: 0, isTextBox: true });
    s.addText(parrafos(spec.pasos, 16, K.blanco), { x: MX + 0.35, y: 3.85, w: 5.5, h: 2.7, fontFace: F.cuerpo, valign: 'top', paraSpaceAfter: 8, margin: 0, isTextBox: true });
    const x = 7.1, w = W - MX - x;
    s.addText('Ideas para hacerlo tuyo', { x, y: 1.6, w, h: 0.4, fontFace: F.cuerpo, fontSize: 17, bold: true, color: K.azul, margin: 0, isTextBox: true });
    const alto = Math.min(1.1, 4.5 / spec.ideas.length);
    spec.ideas.forEach((idea, i) => {
      const y = 2.1 + i * alto;
      s.addShape('roundRect', { x, y, w, h: alto - 0.12, rectRadius: 0.08, fill: { color: K.tinteAzul }, line: { color: K.tinteAzul, width: 0 } });
      icono(s, 'idea', K.azulMedio, x + 0.2, y + (alto - 0.12 - 0.4) / 2, 0.4);
      s.addText(idea, { x: x + 0.8, y, w: w - 1.0, h: alto - 0.12, fontFace: F.cuerpo, fontSize: 15, color: K.texto, valign: 'middle', margin: 0, isTextBox: true });
    });
  };

  B.autoevaluacion = (spec) => {
    const s = conTitulo('CONTENIDO', spec);
    const n = spec.preguntas.length, alto = Math.min(1.35, 5.1 / n);
    spec.preguntas.forEach((p, i) => {
      const y = 1.6 + i * alto;
      s.addShape('ellipse', { x: MX, y: y + 0.03, w: 0.5, h: 0.5, fill: { color: K.verde }, line: { color: K.verde, width: 0 } });
      s.addText(String(i + 1), { x: MX, y: y + 0.03, w: 0.5, h: 0.5, fontFace: F.cuerpo, fontSize: 17, bold: true, color: K.blanco, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
      s.addText(p.p, { x: MX + 0.75, y, w: CW - 0.75, h: 0.6, fontFace: F.cuerpo, fontSize: 16.5, bold: true, color: K.texto, valign: 'middle', margin: 0, isTextBox: true });
      s.addShape('rect', { x: MX + 0.75, y: y + 0.62, w: CW - 0.75, h: alto - 0.8, fill: { color: K.grisClaro }, line: { color: K.gris, width: 1 } });
      s.addText('Tu respuesta:', { x: MX + 0.9, y: y + 0.62, w: 2, h: alto - 0.8, fontFace: F.cuerpo, fontSize: 13, italic: true, color: K.suave, valign: 'middle', margin: 0, isTextBox: true });
    });
    s.addNotes('RESPUESTAS PARA EL DOCENTE\n' + spec.preguntas.map((p, i) => `${i + 1}. ${p.r}`).join('\n') + (spec.notas ? '\n\n' + spec.notas : ''));
  };

  B.cierre = (spec) => {
    const s = nueva('CIERRE', spec);
    s.addImage({ path: LOGO, x: (W - 2.2) / 2, y: 0.5, w: 2.2, h: 2.2, altText: 'Isologo UPDS' });
    s.addText(spec.titulo, { x: MX, y: 2.85, w: CW, h: 0.8, fontFace: F.titulo, fontSize: 30, color: K.azul, align: 'center', margin: 0, isTextBox: true });
    const n = spec.checklist.length, w = 3.7, gap = 0.3, x0 = (W - (n * w + (n - 1) * gap)) / 2;
    s.addText('Antes de continuar, confirma que…', { x: MX, y: 3.8, w: CW, h: 0.4, fontFace: F.cuerpo, fontSize: 16, bold: true, color: K.suave, align: 'center', margin: 0, isTextBox: true });
    spec.checklist.forEach((c, i) => {
      const x = x0 + i * (w + gap);
      s.addShape('roundRect', { x, y: 4.3, w, h: 1.2, rectRadius: 0.1, fill: { color: K.tinteAzul }, line: { color: K.tinteAzul, width: 0 } });
      s.addShape('rect', { x: x + 0.2, y: 4.75, w: 0.3, h: 0.3, fill: { color: K.blanco }, line: { color: K.azul, width: 1.5 } });
      s.addText(c, { x: x + 0.65, y: 4.3, w: w - 0.85, h: 1.2, fontFace: F.cuerpo, fontSize: 15, color: K.texto, valign: 'middle', margin: 0, isTextBox: true });
    });
    s.addText(spec.siguiente, { x: MX, y: 5.8, w: CW, h: 0.5, fontFace: F.cuerpo, fontSize: 18, bold: true, color: K.azulMedio, align: 'center', margin: 0, isTextBox: true });
    s.addText('www.upds.edu.bo', { x: MX, y: 6.5, w: CW, h: 0.4, fontFace: F.cuerpo, fontSize: 14, color: K.suave, align: 'center', margin: 0, isTextBox: true });
  };

  return { pres, B };
}

module.exports = { crearDeck, precargarIconos, K, F };
