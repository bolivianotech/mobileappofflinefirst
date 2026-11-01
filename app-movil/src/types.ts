export type Entidad = 'obra' | 'avance' | 'foto';

/** Campos comunes que hacen posible la sincronización. */
export interface Sincronizable {
  id: string; // UUID generado en el celular (nunca autoincremental)
  actualizadoEn: string; // ISO 8601; decide quién gana en un conflicto
  editadoPor: string; // id del dispositivo que hizo la última edición
  eliminado: boolean; // borrado lógico: el borrado también se sincroniza
}

export interface Obra extends Sincronizable {
  nombre: string;
  tipo: string; // id de TipoObra
  cliente: string;
  direccion: string;
  creadoEn: string;
}

export interface Avance extends Sincronizable {
  obraId: string;
  titulo: string;
  notas: string;
  pasosCompletados: string[]; // ids de pasos del tipo de obra
  porcentaje: number;
  datosExtra: Record<string, string>; // campos propios del tipo de obra
  latitud: number | null;
  longitud: number | null;
  registradoEn: string;
  registradoPor: string;
}

export interface Foto extends Sincronizable {
  avanceId: string;
  urlRemota: string | null;
  creadoEn: string;
}

/** Foto tal como la ve la app: añade la ruta local (que no se sincroniza). */
export interface FotoLocal extends Foto {
  rutaLocal: string | null;
}

export interface ObraResumen extends Obra {
  progreso: number;
  pendiente: boolean;
}

export type DatosPorEntidad = { obra: Obra; avance: Avance; foto: Foto };

/** Una fila de la bandeja de salida (outbox). */
export interface CambioLocal {
  idCambio: number;
  entidad: Entidad;
  id: string;
  actualizadoEn: string;
  editadoPor: string;
  datos: Obra | Avance | Foto;
}

/** Un cambio que llega desde el servidor. */
export interface CambioRemoto extends Omit<CambioLocal, 'idCambio'> {
  seq: number;
}
