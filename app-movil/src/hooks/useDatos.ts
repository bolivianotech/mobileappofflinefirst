import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSync } from '../sync/SyncProvider';

/**
 * Carga datos de SQLite cada vez que la pantalla se enfoca
 * y cada vez que la sincronización trae datos nuevos.
 */
export function useDatos<T>(cargar: () => Promise<T>, dependencias: unknown[] = []) {
  const { version, pendientes } = useSync();
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      cargar()
        .then((d) => vigente && setDatos(d))
        .catch((e) => vigente && setError(String(e)));
      return () => { vigente = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version, pendientes, ...dependencias]),
  );
  return { datos, error };
}
