// ⭐ PERSONALIZA AQUÍ ⭐
// Cada tipo de trabajo de campo define sus pasos (checklist) y los datos extra
// que el técnico debe medir. Agrega tus propios tipos copiando uno de ejemplo.
export interface PasoObra { id: string; titulo: string }
export interface CampoExtra {
  id: string;
  etiqueta: string;
  unidad?: string;
  teclado?: 'numeric' | 'default';
}
export interface TipoObra {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  pasos: PasoObra[];
  camposExtra: CampoExtra[];
}

export const TIPOS_OBRA: TipoObra[] = [
  {
    id: 'construccion',
    nombre: 'Construcción',
    emoji: '🏗️',
    color: '#223B82',
    pasos: [
      { id: 'replanteo', titulo: 'Replanteo y trazado' },
      { id: 'excavacion', titulo: 'Excavación' },
      { id: 'cimientos', titulo: 'Cimientos y sobrecimientos' },
      { id: 'estructura', titulo: 'Estructura (columnas y vigas)' },
      { id: 'muros', titulo: 'Muros y mampostería' },
      { id: 'instalaciones', titulo: 'Instalaciones internas' },
      { id: 'acabados', titulo: 'Acabados' },
      { id: 'entrega', titulo: 'Limpieza y entrega' },
    ],
    camposExtra: [
      { id: 'obreros', etiqueta: 'Personal en obra', unidad: 'personas', teclado: 'numeric' },
      { id: 'clima', etiqueta: 'Clima del día' },
    ],
  },
  {
    id: 'gas_domiciliario',
    nombre: 'Gas domiciliario',
    emoji: '🔥',
    color: '#BF0811',
    pasos: [
      { id: 'inspeccion', titulo: 'Inspección del ambiente y ventilación' },
      { id: 'tendido', titulo: 'Tendido de tubería' },
      { id: 'hermeticidad', titulo: 'Prueba de hermeticidad' },
      { id: 'regulador', titulo: 'Instalación de regulador y medidor' },
      { id: 'artefactos', titulo: 'Conexión de artefactos' },
      { id: 'fugas', titulo: 'Verificación de fugas' },
      { id: 'habilitacion', titulo: 'Habilitación y firma del cliente' },
    ],
    camposExtra: [
      { id: 'presionPrueba', etiqueta: 'Presión de prueba', unidad: 'kPa', teclado: 'numeric' },
      { id: 'longitudTuberia', etiqueta: 'Longitud de tubería', unidad: 'm', teclado: 'numeric' },
    ],
  },
  {
    id: 'antena_satelital',
    nombre: 'Antena satelital',
    emoji: '📡',
    color: '#0085C0',
    pasos: [
      { id: 'sitio', titulo: 'Verificación del sitio (sin obstáculos)' },
      { id: 'mastil', titulo: 'Montaje del mástil / soporte' },
      { id: 'plato', titulo: 'Instalación del plato y LNB' },
      { id: 'alineacion', titulo: 'Alineación (azimut y elevación)' },
      { id: 'cableado', titulo: 'Cableado y sellado' },
      { id: 'senal', titulo: 'Prueba de señal' },
      { id: 'receptor', titulo: 'Configuración del receptor' },
      { id: 'entrega', titulo: 'Entrega al cliente' },
    ],
    camposExtra: [
      { id: 'azimut', etiqueta: 'Azimut', unidad: '°', teclado: 'numeric' },
      { id: 'elevacion', etiqueta: 'Elevación', unidad: '°', teclado: 'numeric' },
      { id: 'senal', etiqueta: 'Nivel de señal', unidad: '%', teclado: 'numeric' },
    ],
  },
  {
    id: 'otro',
    nombre: 'Otro trabajo',
    emoji: '🛠️',
    color: '#00A08C',
    pasos: [
      { id: 'preparacion', titulo: 'Preparación' },
      { id: 'ejecucion', titulo: 'Ejecución' },
      { id: 'verificacion', titulo: 'Verificación' },
      { id: 'entrega', titulo: 'Entrega' },
    ],
    camposExtra: [],
  },
];

export function tipoPorId(id: string): TipoObra {
  return TIPOS_OBRA.find((t) => t.id === id) ?? TIPOS_OBRA[TIPOS_OBRA.length - 1];
}

/** Porcentaje = pasos completados / pasos del tipo. Ignora ids que ya no existan. */
export function calcularPorcentaje(tipo: TipoObra, completados: string[]): number {
  if (tipo.pasos.length === 0) return 0;
  const validos = new Set(tipo.pasos.map((p) => p.id));
  const hechos = new Set(completados.filter((c) => validos.has(c))).size;
  return Math.round((hechos / tipo.pasos.length) * 100);
}
