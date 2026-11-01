import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colores, espacio } from '../theme';

export function Boton({ titulo, onPress, tipo = 'primario', deshabilitado }: {
  titulo: string; onPress: () => void; tipo?: 'primario' | 'secundario' | 'peligro'; deshabilitado?: boolean;
}) {
  const fondo = tipo === 'primario' ? colores.azul : tipo === 'peligro' ? colores.error : colores.blanco;
  const texto = tipo === 'secundario' ? colores.azul : colores.blanco;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: fondo, opacity: deshabilitado ? 0.5 : pressed ? 0.8 : 1 },
        tipo === 'secundario' && { borderWidth: 1.5, borderColor: colores.azul },
      ]}>
      <Text style={[estilos.botonTexto, { color: texto }]}>{titulo}</Text>
    </Pressable>
  );
}

export function Campo({ etiqueta, sufijo, ...props }: TextInputProps & { etiqueta: string; sufijo?: string }) {
  return (
    <View style={{ marginBottom: espacio.m }}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View style={estilos.campoFila}>
        <TextInput placeholderTextColor={colores.textoSuave} style={estilos.input} {...props} />
        {sufijo ? <Text style={estilos.sufijo}>{sufijo}</Text> : null}
      </View>
    </View>
  );
}

export function Insignia({ texto, color = colores.alerta }: { texto: string; color?: string }) {
  return (
    <View style={[estilos.insignia, { backgroundColor: color }]}>
      <Text style={estilos.insigniaTexto}>{texto}</Text>
    </View>
  );
}

export function BarraProgreso({ valor, color = colores.verde }: { valor: number; color?: string }) {
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: valor }} style={estilos.barra}>
      <View style={{ width: `${Math.max(0, Math.min(100, valor))}%`, backgroundColor: color, flex: 0, height: '100%' }} />
    </View>
  );
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return <View style={estilos.tarjeta}>{children}</View>;
}

const estilos = StyleSheet.create({
  boton: { paddingVertical: 14, paddingHorizontal: espacio.m, borderRadius: 10, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  botonTexto: { fontSize: 16, fontWeight: '700' },
  etiqueta: { fontSize: 14, fontWeight: '700', color: colores.azul, marginBottom: 6 },
  campoFila: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: 10, borderWidth: 1, borderColor: colores.gris },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: colores.texto },
  sufijo: { paddingRight: 12, color: colores.textoSuave, fontSize: 14 },
  insignia: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  insigniaTexto: { color: colores.blanco, fontSize: 12, fontWeight: '700' },
  barra: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 12, padding: espacio.m, marginBottom: espacio.s, elevation: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
});
