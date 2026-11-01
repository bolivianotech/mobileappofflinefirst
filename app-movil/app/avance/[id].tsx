import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarraProgreso, Boton } from '../../src/components/ui';
import { tipoPorId } from '../../src/config/tiposObra';
import { eliminarAvance, listarFotos, obtenerAvance } from '../../src/db/avancesRepo';
import { leerUrlServidor } from '../../src/db/metaRepo';
import { obtenerObra } from '../../src/db/obrasRepo';
import { useDatos } from '../../src/hooks/useDatos';
import { useSync } from '../../src/sync/SyncProvider';
import { colores, espacio } from '../../src/theme';

export default function DetalleAvance() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { avisarCambioLocal } = useSync();
  const [servidor, setServidor] = useState('');
  useEffect(() => { leerUrlServidor().then(setServidor); }, []);
  const { datos } = useDatos(async () => {
    const avance = await obtenerAvance(id);
    return { avance, obra: avance ? await obtenerObra(avance.obraId) : null, fotos: await listarFotos(id) };
  }, [id]);

  if (!datos?.avance || !datos.obra || datos.avance.eliminado) return null;
  const { avance, obra, fotos } = datos;
  const tipo = tipoPorId(obra.tipo);

  return (
    <ScrollView contentContainerStyle={{ padding: espacio.m }}>
      <Text style={estilos.titulo}>{avance.titulo}</Text>
      <Text style={estilos.sub}>{new Date(avance.registradoEn).toLocaleString()}{avance.registradoPor ? ` · ${avance.registradoPor}` : ''}</Text>
      <View style={{ marginVertical: espacio.s }}>
        <BarraProgreso valor={avance.porcentaje} color={tipo.color} />
        <Text style={estilos.sub}>{avance.porcentaje}% completado</Text>
      </View>

      {tipo.pasos.map((p) => (
        <Text key={p.id} style={estilos.paso}>{avance.pasosCompletados.includes(p.id) ? '✅' : '⬜'} {p.titulo}</Text>
      ))}

      {tipo.camposExtra.filter((c) => avance.datosExtra[c.id]).map((c) => (
        <Text key={c.id} style={estilos.dato}>{c.etiqueta}: <Text style={{ fontWeight: '700' }}>{avance.datosExtra[c.id]} {c.unidad ?? ''}</Text></Text>
      ))}
      {avance.notas ? <Text style={estilos.notas}>{avance.notas}</Text> : null}

      {avance.latitud != null && avance.longitud != null ? (
        <View style={{ marginVertical: espacio.s }}>
          <Boton tipo="secundario" titulo={`📍 Ver en mapa (${avance.latitud.toFixed(5)}, ${avance.longitud.toFixed(5)})`}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${avance.latitud},${avance.longitud}`)} />
        </View>
      ) : null}

      {fotos.length > 0 ? <Text style={estilos.seccion}>Evidencia fotográfica</Text> : null}
      {fotos.map((f) => {
        const uri = f.rutaLocal ?? (f.urlRemota ? servidor.replace(/\/$/, '') + f.urlRemota : null);
        return uri ? <Image key={f.id} source={{ uri }} style={estilos.foto} resizeMode="cover" />
          : <Text key={f.id} style={estilos.sub}>📷 Foto aún no disponible en este dispositivo</Text>;
      })}

      <View style={{ marginTop: espacio.l }}>
        <Boton tipo="peligro" titulo="Eliminar avance" onPress={() =>
          Alert.alert('Eliminar avance', '¿Seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: async () => { await eliminarAvance(id); avisarCambioLocal(); router.back(); } },
          ])} />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 22, fontWeight: '800', color: colores.azul },
  sub: { fontSize: 14, color: colores.textoSuave, marginTop: 2 },
  paso: { fontSize: 16, color: colores.texto, paddingVertical: 4 },
  dato: { fontSize: 16, color: colores.texto, marginTop: 6 },
  notas: { fontSize: 16, color: colores.texto, marginTop: espacio.m, lineHeight: 22 },
  seccion: { fontSize: 16, fontWeight: '700', color: colores.azul, marginTop: espacio.m, marginBottom: 6 },
  foto: { width: '100%', height: 220, borderRadius: 12, marginBottom: espacio.s },
});
