// Regla de conflictos: "gana el último" (Last-Write-Wins).
// Debe ser IDÉNTICA a la del servidor (servidor/src/almacen.js → ganaEntrante).
export interface Version {
  actualizadoEn: string; // ISO 8601
  editadoPor: string; // id del dispositivo
}

/** ¿Debe aplicarse el cambio `entrante` sobre lo que ya hay (`existente`)? */
export function ganaEntrante(existente: Version | null | undefined, entrante: Version): boolean {
  if (!existente) return true;
  if (entrante.actualizadoEn > existente.actualizadoEn) return true;
  if (entrante.actualizadoEn < existente.actualizadoEn) return false;
  return entrante.editadoPor >= existente.editadoPor; // empate: decide el id del dispositivo
}
