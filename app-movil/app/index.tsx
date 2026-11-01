import { Link, Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BannerSync } from '../src/components/BannerSync';
import { BarraProgreso, Boton, Insignia, Tarjeta } from '../src/components/ui';
import { tipoPorId } from '../src/config/tiposObra';
import { listarObras } from '../src/db/obrasRepo';
import { useDatos } from '../src/hooks/useDatos';
import { colores, espacio } from '../src/theme';

export default function ListaObras() {
  const router = useRouter();
  const { datos: obras, error } = useDatos(listarObras);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerRight: () => <Link href="/ajustes" style={{ color: colores.blanco, fontSize: 22 }}>⚙️</Link> }} />
      <BannerSync />
      {error ? <Text style={estilos.vacio}>Error: {error}</Text> : null}
      <FlatList
        data={obras ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: espacio.m }}
        ListEmptyComponent={
          obras ? <Text style={estilos.vacio}>Aún no hay obras.{'\n'}Crea la primera: funciona sin internet.</Text> : undefined
        }
        renderItem={({ item }) => {
          const tipo = tipoPorId(item.tipo);
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/obra/[id]', params: { id: item.id } })}>
              <Tarjeta>
                <View style={estilos.fila}>
                  <Text style={estilos.emoji}>{tipo.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.nombre}>{item.nombre}</Text>
                    <Text style={estilos.sub}>{tipo.nombre}{item.cliente ? ` · ${item.cliente}` : ''}</Text>
                  </View>
                  {item.pendiente ? <Insignia texto="Pendiente" /> : null}
                </View>
                <View style={{ marginTop: espacio.s }}>
                  <BarraProgreso valor={item.progreso} color={tipo.color} />
                  <Text style={estilos.pct}>{item.progreso}% completado</Text>
                </View>
              </Tarjeta>
            </Pressable>
          );
        }}
      />
      <View style={estilos.pie}>
        <Boton titulo="➕ Nueva obra" onPress={() => router.push('/obra/nueva')} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 30 },
  nombre: { fontSize: 17, fontWeight: '700', color: colores.texto },
  sub: { fontSize: 14, color: colores.textoSuave },
  pct: { fontSize: 13, color: colores.textoSuave, marginTop: 4 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 48, fontSize: 16, lineHeight: 24 },
  pie: { padding: espacio.m, backgroundColor: colores.blanco },
});
