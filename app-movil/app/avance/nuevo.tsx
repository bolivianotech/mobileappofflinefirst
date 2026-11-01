import { Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarraProgreso, Boton, Campo } from '../../src/components/ui';
import { calcularPorcentaje, tipoPorId, type TipoObra } from '../../src/config/tiposObra';
import { registrarAvance, ultimoAvance } from '../../src/db/avancesRepo';
import { obtenerObra } from '../../src/db/obrasRepo';
import { elegirDeGaleria, tomarFoto } from '../../src/evidencia/fotos';
import { obtenerUbicacion, type Coordenadas } from '../../src/evidencia/gps';
import { useSync } from '../../src/sync/SyncProvider';
import { colores, espacio } from '../../src/theme';

export default function NuevoAvance() {
  const { obraId } = useLocalSearchParams<{ obraId: string }>();
  const router = useRouter();
  const { avisarCambioLocal } = useSync();
  const [tipo, setTipo] = useState<TipoObra | null>(null);
  const [titulo, setTitulo] = useState('');
  const [notas, setNotas] = useState('');
  const [pasos, setPasos] = useState<string[]>([]);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<string[]>([]);
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      const obra = await obtenerObra(obraId);
      if (!obra) return;
      setTipo(tipoPorId(obra.tipo));
      setPasos((await ultimoAvance(obraId))?.pasosCompletados ?? []); // partimos de lo ya avanzado
    })();
  }, [obraId]);

  if (!tipo) return null;
  const porcentaje = calcularPorcentaje(tipo, pasos);
  const alternar = (id: string) => setPasos((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function guardar() {
    if (titulo.trim().length < 3) return Alert.alert('Falta el título', 'Describe el avance en pocas palabras.');
    setGuardando(true);
    try {
      await registrarAvance({
        obraId, titulo, notas, pasosCompletados: pasos, datosExtra: extra,
        latitud: ubicacion?.latitud ?? null, longitud: ubicacion?.longitud ?? null, rutasFotos: fotos,
      });
      avisarCambioLocal();
      router.back();
    } catch (e) {
      setGuardando(false);
      Alert.alert('No se pudo guardar', String(e));
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: espacio.m }} keyboardShouldPersistTaps="handled">
      <Campo etiqueta="¿Qué se hizo hoy?" value={titulo} onChangeText={setTitulo} placeholder="Ej.: Se vació la losa del primer piso" />

      <Text style={estilos.seccion}>Pasos completados · {porcentaje}%</Text>
      <BarraProgreso valor={porcentaje} color={tipo.color} />
      <View style={{ marginVertical: espacio.s }}>
        {tipo.pasos.map((p) => {
          const hecho = pasos.includes(p.id);
          return (
            <Pressable key={p.id} accessibilityRole="checkbox" accessibilityState={{ checked: hecho }} onPress={() => alternar(p.id)} style={estilos.paso}>
              <View style={[estilos.caja, hecho && { backgroundColor: colores.verde, borderColor: colores.verde }]}>
                {hecho ? <Text style={{ color: colores.blanco, fontWeight: '800' }}>✓</Text> : null}
              </View>
              <Text style={estilos.pasoTexto}>{p.titulo}</Text>
            </Pressable>
          );
        })}
      </View>

      {tipo.camposExtra.length > 0 ? <Text style={estilos.seccion}>Mediciones</Text> : null}
      {tipo.camposExtra.map((c) => (
        <Campo key={c.id} etiqueta={c.etiqueta} sufijo={c.unidad} keyboardType={c.teclado === 'numeric' ? 'numeric' : 'default'}
          value={extra[c.id] ?? ''} onChangeText={(v) => setExtra((e) => ({ ...e, [c.id]: v }))} />
      ))}

      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline placeholder="Observaciones, materiales, incidentes…" />

      <Text style={estilos.seccion}>Evidencia</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Boton tipo="secundario" titulo="📷 Cámara" onPress={async () => { const f = await tomarFoto(); if (f) setFotos((x) => [...x, f]); }} /></View>
        <View style={{ flex: 1 }}><Boton tipo="secundario" titulo="🖼️ Galería" onPress={async () => { const nuevas = await elegirDeGaleria(); setFotos((x) => [...x, ...nuevas]); }} /></View>
      </View>
      <ScrollView horizontal style={{ marginVertical: espacio.s }}>
        {fotos.map((f) => (
          <Pressable key={f} onLongPress={() => setFotos((x) => x.filter((y) => y !== f))}>
            <Image source={{ uri: f }} style={estilos.miniatura} />
          </Pressable>
        ))}
      </ScrollView>
      {fotos.length > 0 ? <Text style={estilos.ayuda}>Mantén presionada una foto para quitarla.</Text> : null}

      <View style={{ marginTop: espacio.s }}>
        <Boton tipo="secundario" titulo={ubicacion ? `📍 ${ubicacion.latitud.toFixed(5)}, ${ubicacion.longitud.toFixed(5)}` : '📍 Registrar ubicación GPS'}
          onPress={async () => {
            const u = await obtenerUbicacion();
            if (u) setUbicacion(u); else Alert.alert('Sin ubicación', 'Revisa el permiso de ubicación o intenta al aire libre.');
          }} />
      </View>

      <View style={{ marginTop: espacio.l }}>
        <Boton titulo={guardando ? 'Guardando…' : 'Guardar avance'} onPress={guardar} deshabilitado={guardando} />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  seccion: { fontSize: 16, fontWeight: '700', color: colores.azul, marginTop: espacio.s, marginBottom: 6 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 48 },
  caja: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: colores.gris, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.blanco },
  pasoTexto: { flex: 1, fontSize: 16, color: colores.texto },
  miniatura: { width: 88, height: 88, borderRadius: 8, marginRight: 8 },
  ayuda: { fontSize: 13, color: colores.textoSuave },
});
