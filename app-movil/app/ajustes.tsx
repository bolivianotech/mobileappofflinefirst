import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { BannerSync } from '../src/components/BannerSync';
import { Boton, Campo } from '../src/components/ui';
import { guardarMeta, leerOperador, leerToken, leerUrlServidor } from '../src/db/metaRepo';
import { probarConexion } from '../src/sync/apiHttp';
import { useSync } from '../src/sync/SyncProvider';
import { colores, espacio } from '../src/theme';

export default function Ajustes() {
  const { sincronizarAhora, sincronizando, pendientes } = useSync();
  const [operador, setOperador] = useState('');
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    (async () => { setOperador(await leerOperador()); setUrl(await leerUrlServidor()); setToken(await leerToken()); })();
  }, []);

  async function guardar() {
    await guardarMeta('operador', operador.trim());
    await guardarMeta('urlServidor', url.trim());
    await guardarMeta('token', token.trim());
    Alert.alert('Guardado', 'Ajustes actualizados.');
  }

  return (
    <>
      <BannerSync />
      <ScrollView contentContainerStyle={{ padding: espacio.m }} keyboardShouldPersistTaps="handled">
        <Campo etiqueta="Tu nombre (técnico)" value={operador} onChangeText={setOperador} placeholder="Ej.: Ana Quispe" />
        <Campo etiqueta="URL del servidor" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="http://192.168.0.10:3000" />
        <Campo etiqueta="Token (opcional)" value={token} onChangeText={setToken} autoCapitalize="none" secureTextEntry />
        <Text style={{ color: colores.textoSuave, marginBottom: espacio.m }}>
          Emulador Android: http://10.0.2.2:3000 · Celular real: la IP de tu PC en la misma red Wi‑Fi.
        </Text>
        <Boton titulo="Guardar ajustes" onPress={guardar} />
        <Text style={{ height: espacio.m }} />
        <Boton tipo="secundario" titulo="Probar conexión" onPress={async () => Alert.alert((await probarConexion()) ? '✅ Servidor alcanzado' : '❌ Sin respuesta del servidor')} />
        <Text style={{ height: espacio.s }} />
        <Boton tipo="secundario" titulo={sincronizando ? 'Sincronizando…' : `Sincronizar ahora (${pendientes} pendientes)`} onPress={sincronizarAhora} deshabilitado={sincronizando} />
      </ScrollView>
    </>
  );
}
