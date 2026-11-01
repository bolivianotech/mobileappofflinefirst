import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { contarPendientes } from '../db/outboxRepo';
import { apiHttp } from './apiHttp';
import { puertosSqlite } from './puertosSqlite';
import { sincronizar } from './syncEngine';

interface EstadoSync {
  enLinea: boolean;
  sincronizando: boolean;
  pendientes: number;
  ultimoSync: Date | null;
  error: string | null;
  /** Sube cada vez que llegan datos nuevos: las pantallas lo usan para recargar. */
  version: number;
  sincronizarAhora: () => Promise<void>;
  avisarCambioLocal: () => void;
}

const Contexto = createContext<EstadoSync | null>(null);
export const useSync = () => {
  const c = useContext(Contexto);
  if (!c) throw new Error('useSync debe usarse dentro de <SyncProvider>');
  return c;
};

export function SyncProvider({ children }: { children: ReactNode }) {
  const [enLinea, setEnLinea] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [pendientes, setPendientes] = useState(0);
  const [ultimoSync, setUltimoSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const corriendo = useRef(false);
  const enLineaRef = useRef(true);

  const refrescarPendientes = useCallback(async () => setPendientes(await contarPendientes()), []);

  const sincronizarAhora = useCallback(async () => {
    if (corriendo.current) return; // nunca dos sincronizaciones a la vez
    corriendo.current = true;
    setSincronizando(true);
    try {
      const r = await sincronizar(puertosSqlite, apiHttp);
      setError(r.fotosPendientes > 0 ? `${r.fotosPendientes} foto(s) sin subir; se reintentará` : null);
      setUltimoSync(new Date());
      if (r.recibidos > 0) setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo sincronizar');
    } finally {
      corriendo.current = false;
      setSincronizando(false);
      await refrescarPendientes();
    }
  }, [refrescarPendientes]);

  // Cuando vuelve la red o la app pasa a primer plano, intentamos sincronizar.
  useEffect(() => {
    getNetworkStateAsync().then((s) => {
      enLineaRef.current = !!s.isInternetReachable;
      setEnLinea(enLineaRef.current);
      if (enLineaRef.current) void sincronizarAhora();
    });
    const redSub = addNetworkStateListener((s) => {
      const ahoraEnLinea = !!s.isInternetReachable;
      const volvio = ahoraEnLinea && !enLineaRef.current;
      enLineaRef.current = ahoraEnLinea;
      setEnLinea(ahoraEnLinea);
      if (volvio) void sincronizarAhora();
    });
    const appSub = AppState.addEventListener('change', (e) => {
      if (e === 'active' && enLineaRef.current) void sincronizarAhora();
    });
    void refrescarPendientes();
    return () => { redSub.remove(); appSub.remove(); };
  }, [sincronizarAhora, refrescarPendientes]);

  const avisarCambioLocal = useCallback(() => {
    void refrescarPendientes();
    if (enLineaRef.current) void sincronizarAhora(); // si hay red, no esperamos
  }, [refrescarPendientes, sincronizarAhora]);

  const valor = useMemo(
    () => ({ enLinea, sincronizando, pendientes, ultimoSync, error, version, sincronizarAhora, avisarCambioLocal }),
    [enLinea, sincronizando, pendientes, ultimoSync, error, version, sincronizarAhora, avisarCambioLocal],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
