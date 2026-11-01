import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton, Campo } from '../../src/components/ui';
import { TIPOS_OBRA } from '../../src/config/tiposObra';
import { guardarObra, obtenerObra } from '../../src/db/obrasRepo';
import { useSync } from '../../src/sync/SyncProvider';
import { colores, espacio } from '../../src/theme';

export default function NuevaObra() {
  const { id } = useLocalSearchParams<{ id?: string }>(); // con id = editar
  const router = useRouter();
  const { avisarCambioLocal } = useSync();
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipo, setTipo] = useState(TIPOS_OBRA[0].id);

  useEffect(() => {
    if (!id) return;
    obtenerObra(id).then((o) => {
      if (!o) return;
      setNombre(o.nombre); setCliente(o.cliente); setDireccion(o.direccion); setTipo(o.tipo);
    });
  }, [id]);

  async function guardar() {
    if (nombre.trim().length < 3) return Alert.alert('Falta el nombre', 'Escribe al menos 3 letras.');
    await guardarObra({ nombre: nombre.trim(), cliente: cliente.trim(), direccion: direccion.trim(), tipo }, id);
    avisarCambioLocal();
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: espacio.m }} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Tipo de trabajo</Text>
      <View style={estilos.tipos}>
        {TIPOS_OBRA.map((t) => (
          <Pressable key={t.id} accessibilityRole="radio" accessibilityState={{ selected: tipo === t.id }}
            onPress={() => setTipo(t.id)}
            style={[estilos.tipo, tipo === t.id && { backgroundColor: t.color, borderColor: t.color }]}>
            <Text style={[estilos.tipoTexto, tipo === t.id && { color: colores.blanco }]}>{t.emoji} {t.nombre}</Text>
          </Pressable>
        ))}
      </View>
      <Campo etiqueta="Nombre de la obra" value={nombre} onChangeText={setNombre} placeholder="Ej.: Instalación casa Pérez" />
      <Campo etiqueta="Cliente" value={cliente} onChangeText={setCliente} placeholder="Nombre del cliente" />
      <Campo etiqueta="Dirección" value={direccion} onChangeText={setDireccion} placeholder="Calle, zona, ciudad" />
      <Boton titulo={id ? 'Guardar cambios' : 'Crear obra'} onPress={guardar} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 14, fontWeight: '700', color: colores.azul, marginBottom: 6 },
  tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: espacio.m },
  tipo: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: colores.gris, backgroundColor: colores.blanco },
  tipoTexto: { fontSize: 15, color: colores.texto, fontWeight: '600' },
});
