// Almacén de cambios del servidor. No sabe nada de HTTP: solo guarda y ordena.
// Regla de conflictos: "gana el último" (Last-Write-Wins) comparando actualizadoEn.
// Si hay empate exacto, gana el dispositivo con id mayor (así todos deciden igual).
import fs from 'node:fs';
import path from 'node:path';

export function ganaEntrante(existente, entrante) {
  if (!existente) return true;
  if (entrante.actualizadoEn > existente.actualizadoEn) return true;
  if (entrante.actualizadoEn < existente.actualizadoEn) return false;
  return (entrante.editadoPor ?? '') >= (existente.editadoPor ?? '');
}

export class Almacen {
  /** @param {string|null} archivo ruta del JSON de persistencia (null = solo memoria) */
  constructor(archivo = null) {
    this.archivo = archivo;
    this.seq = 0;
    this.registros = new Map(); // "entidad:id" -> registro
    if (archivo && fs.existsSync(archivo)) {
      const guardado = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      this.seq = guardado.seq;
      this.registros = new Map(guardado.registros);
    }
  }

  /** Aplica un cambio. Devuelve 'aceptado' o 'rechazado' (conflicto perdido). */
  aplicar(cambio) {
    const clave = `${cambio.entidad}:${cambio.id}`;
    const existente = this.registros.get(clave);
    if (!ganaEntrante(existente, cambio)) return 'rechazado';
    this.seq += 1;
    this.registros.set(clave, {
      seq: this.seq,
      entidad: cambio.entidad,
      id: cambio.id,
      actualizadoEn: cambio.actualizadoEn,
      editadoPor: cambio.editadoPor ?? '',
      datos: cambio.datos,
    });
    this.persistir();
    return 'aceptado';
  }

  /** Cambios con seq mayor a `desde`, en orden, máximo `limite`. */
  desde(desde, limite = 100) {
    const todos = [...this.registros.values()]
      .filter((r) => r.seq > desde)
      .sort((a, b) => a.seq - b.seq);
    const cambios = todos.slice(0, limite);
    const cursor = cambios.length ? cambios[cambios.length - 1].seq : desde;
    return { cambios, cursor, hayMas: todos.length > cambios.length };
  }

  lista(entidad) {
    return [...this.registros.values()]
      .filter((r) => r.entidad === entidad && !r.datos?.eliminado)
      .map((r) => r.datos);
  }

  persistir() {
    if (!this.archivo) return;
    fs.mkdirSync(path.dirname(this.archivo), { recursive: true });
    const tmp = `${this.archivo}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ seq: this.seq, registros: [...this.registros] }));
    fs.renameSync(tmp, this.archivo); // escritura atómica
  }
}
