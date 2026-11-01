// Uso: node build.js [numeroDeModulo]   → escribe los .pptx en ../
const fs = require('fs');
const path = require('path');
const { crearDeck, precargarIconos } = require('./lib');

const SALIDA = path.join(__dirname, '..');
const solo = process.argv[2];

(async () => {
  await precargarIconos();
  const archivos = fs.readdirSync(path.join(__dirname, 'contenido')).filter((f) => /^modulo\d+\.js$/.test(f)).sort();
  for (const archivo of archivos) {
    const mod = require(path.join(__dirname, 'contenido', archivo));
    if (solo !== undefined && String(mod.numero) !== solo) continue;
    const { pres, B } = crearDeck({ numero: mod.numero, titulo: mod.titulo });
    for (const spec of mod.slides) {
      if (!B[spec.tipo]) throw new Error(`${archivo}: tipo de diapositiva desconocido "${spec.tipo}"`);
      B[spec.tipo](spec);
    }
    const nombre = `Modulo${mod.numero}_${mod.archivo}.pptx`;
    await pres.writeFile({ fileName: path.join(SALIDA, nombre) });
    console.log(`✔ ${nombre} (${mod.slides.length} diapositivas)`);
  }
})();
