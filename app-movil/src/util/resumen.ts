import { tipoPorId } from '../config/tiposObra';
import type { Avance, Obra } from '../types';

/** Texto listo para compartir por WhatsApp/correo. Personalízalo para tu informe. */
export function textoResumen(obra: Obra, avances: Avance[]): string {
  const tipo = tipoPorId(obra.tipo);
  const ultimo = avances[0];
  const lineas = [
    `${tipo.emoji} ${obra.nombre} (${tipo.nombre})`,
    `Cliente: ${obra.cliente || '—'}`,
    `Dirección: ${obra.direccion || '—'}`,
    `Progreso: ${ultimo?.porcentaje ?? 0}%`,
    '',
    'Historial de avances:',
  ];
  for (const a of avances) {
    lineas.push(`• ${new Date(a.registradoEn).toLocaleString()} — ${a.titulo} (${a.porcentaje}%)`);
    for (const c of tipo.camposExtra) {
      if (a.datosExtra[c.id]) lineas.push(`    ${c.etiqueta}: ${a.datosExtra[c.id]} ${c.unidad ?? ''}`.trimEnd());
    }
    if (a.latitud != null && a.longitud != null) {
      lineas.push(`    📍 https://maps.google.com/?q=${a.latitud},${a.longitud}`);
    }
  }
  if (avances.length === 0) lineas.push('(sin avances registrados)');
  return lineas.join('\n');
}
