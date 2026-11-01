import { StyleSheet, Text, View } from 'react-native';
import { useSync } from '../sync/SyncProvider';
import { colores, espacio } from '../theme';

/** Dice SIEMPRE la verdad: sin conexión, pendientes, sincronizando o al día. */
export function BannerSync() {
  const { enLinea, sincronizando, pendientes, ultimoSync, error } = useSync();
  let texto: string;
  let fondo: string;
  if (sincronizando) { texto = '🔄 Sincronizando…'; fondo = colores.azulMedio; }
  else if (!enLinea) { texto = `📴 Sin conexión · ${pendientes} pendiente(s) — todo se guarda en tu celular`; fondo = colores.alerta; }
  else if (error) { texto = `⚠️ ${error} · ${pendientes} pendiente(s)`; fondo = colores.error; }
  else if (pendientes > 0) { texto = `⏳ ${pendientes} cambio(s) por enviar`; fondo = colores.alerta; }
  else { texto = `✅ Al día${ultimoSync ? ` · ${ultimoSync.toLocaleTimeString()}` : ''}`; fondo = colores.verde; }
  return (
    <View accessibilityRole="summary" style={[estilos.banner, { backgroundColor: fondo }]}>
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  banner: { paddingVertical: 8, paddingHorizontal: espacio.m },
  texto: { color: colores.blanco, fontWeight: '600', fontSize: 14 },
});
