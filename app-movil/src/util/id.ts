import { randomUUID } from 'expo-crypto';

/** UUID v4 generado en el celular: no necesita servidor, funciona sin internet. */
export const nuevoId = (): string => randomUUID();
export const ahora = (): string => new Date().toISOString();
