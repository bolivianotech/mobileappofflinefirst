import * as Location from 'expo-location';

export interface Coordenadas { latitud: number; longitud: number }

/** El GPS funciona SIN internet. Si tarda demasiado, usamos la última posición conocida. */
export async function obtenerUbicacion(tiempoMaxMs = 10000): Promise<Coordenadas | null> {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (!permiso.granted) return null;
  const actual = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const limite = new Promise<null>((resolve) => setTimeout(() => resolve(null), tiempoMaxMs));
  const pos = (await Promise.race([actual, limite])) ?? (await Location.getLastKnownPositionAsync());
  return pos ? { latitud: pos.coords.latitude, longitud: pos.coords.longitude } : null;
}
