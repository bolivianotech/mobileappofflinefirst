import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { getDb } from '../src/db/database';
import { SyncProvider } from '../src/sync/SyncProvider';
import { colores } from '../src/theme';

export default function Raiz() {
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La base de datos local se abre y migra ANTES de mostrar cualquier pantalla.
  useEffect(() => {
    getDb().then(() => setListo(true)).catch((e) => setError(String(e)));
  }, []);

  if (error) return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}><Text>No se pudo abrir la base de datos: {error}</Text></View>;
  if (!listo) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={colores.azul} /></View>;

  return (
    <SyncProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.azul },
          headerTintColor: colores.blanco,
          contentStyle: { backgroundColor: colores.fondo },
        }}>
        <Stack.Screen name="index" options={{ title: 'Mis obras' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
        <Stack.Screen name="obra/nueva" options={{ title: 'Obra' }} />
        <Stack.Screen name="obra/[id]" options={{ title: 'Detalle de obra' }} />
        <Stack.Screen name="avance/nuevo" options={{ title: 'Registrar avance' }} />
        <Stack.Screen name="avance/[id]" options={{ title: 'Avance' }} />
      </Stack>
    </SyncProvider>
  );
}
