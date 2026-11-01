import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { BannerSync } from '../../src/components/BannerSync';
import { BarraProgreso, Boton, Insignia, Tarjeta } from '../../src/components/ui';
import { tipoPorId } from '../../src/config/tiposObra';
import { listarAvances } from '../../src/db/avancesRepo';
import { eliminarObra, obtenerObra } from '../../src/db/obrasRepo';
import { useDatos } from '../../src/hooks/useDatos';
import { useSync } from '../../src/sync/SyncProvider';
import { colores, espacio } from '../../src/theme';
import { textoResumen } from '../../src/util/resumen';

export default function DetalleObra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { avisarCambioLocal } = useSync();
  const { datos } = useDatos(async () => ({ obra: await obtenerObra(id), avances: await listarAvances(id) }), [id]);

  if (!datos) return null;
  const { obra, avances } = datos;
  if (!obra || obra.eliminado) return <Text style={estilos.vacio}>Esta obra ya no existe.</Text>;
  const tipo = tipoPorId(obra.tipo);
  const progreso = avances[0]?.porcentaje ?? 0;

  function borrar() {
    Alert.alert('Eliminar obra', '¿Seguro? También se quitará de los demás dispositivos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await eliminarObra(id); avisarCambioLocal(); router.back(); } },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <BannerSync />
      <FlatList
        data={avances}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: espacio.m }}
        ListHeaderComponent={
          <View style={{ marginBottom: espacio.m }}>
            <Text style={estilos.titulo}>{tipo.emoji} {obra.nombre}</Text>
            <Text style={estilos.sub}>{tipo.nombre}</Text>
            <Text style={estilos.sub}>Cliente: {obra.cliente || '—'}</Text>
            <Text style={estilos.sub}>Dirección: {obra.direccion || '—'}</Text>
            <View style={{ marginVertical: espacio.s }}>
              <BarraProgreso valor={progreso} color={tipo.color} />
              <Text style={estilos.pct}>{progreso}% completado</Text>
            </View>
            <Boton titulo="📝 Registrar avance" onPress={() => router.push({ pathname: '/avance/nuevo', params: { obraId: id } })} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View style={{ flex: 1 }}><Boton tipo="secundario" titulo="Editar" onPress={() => router.push({ pathname: '/obra/nueva', params: { id } })} /></View>
              <View style={{ flex: 1 }}><Boton tipo="secundario" titulo="Compartir" onPress={() => Share.share({ message: textoResumen(obra, avances) })} /></View>
            </View>
            <Text style={estilos.seccion}>Historial de avances</Text>
          </View>
        }
        ListEmptyComponent={<Text style={estilos.vacio}>Todavía no registraste avances.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/avance/[id]', params: { id: item.id } })}>
            <Tarjeta>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={estilos.avanceTitulo}>{item.titulo}</Text>
                {item.pendiente ? <Insignia texto="Pendiente" /> : null}
              </View>
              <Text style={estilos.sub}>{new Date(item.registradoEn).toLocaleString()} · {item.porcentaje}% · 📷 {item.fotos}</Text>
            </Tarjeta>
          </Pressable>
        )}
        ListFooterComponent={<View style={{ marginTop: espacio.m }}><Boton tipo="peligro" titulo="Eliminar obra" onPress={borrar} /></View>}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 22, fontWeight: '800', color: colores.azul },
  sub: { fontSize: 14, color: colores.textoSuave, marginTop: 2 },
  pct: { fontSize: 13, color: colores.textoSuave, marginTop: 4 },
  seccion: { fontSize: 16, fontWeight: '700', color: colores.azul, marginTop: espacio.l },
  avanceTitulo: { fontSize: 16, fontWeight: '700', color: colores.texto, flex: 1 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 32, fontSize: 15 },
});
