import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { nuevoId } from '../util/id';

/**
 * Las fotos del selector viven en la caché (el sistema puede borrarla).
 * Las copiamos a la carpeta de documentos de la app para que sobrevivan sin internet.
 */
function guardarPermanente(uriTemporal: string): string {
  const carpeta = new Directory(Paths.document, 'fotos');
  carpeta.create({ intermediates: true, idempotent: true });
  const destino = new File(carpeta, `${nuevoId()}.jpg`);
  new File(uriTemporal).copy(destino);
  return destino.uri;
}

export async function tomarFoto(): Promise<string | null> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) return null;
  const r = await ImagePicker.launchCameraAsync({ quality: 0.6 }); // 0.6: buena calidad, ~5x menos peso
  if (r.canceled || r.assets.length === 0) return null;
  return guardarPermanente(r.assets[0].uri);
}

export async function elegirDeGaleria(): Promise<string[]> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.6,
  });
  if (r.canceled) return [];
  return r.assets.map((a) => guardarPermanente(a.uri));
}
